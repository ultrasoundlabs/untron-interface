import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SPEC_PATH = path.join(ROOT, 'v3api.json')
const OUT_DIR = path.join(ROOT, 'docs', 'pages', 'v3-api', 'endpoints', 'generated')

/** @type {import('openapi-types').OpenAPIV3.Document} */
const spec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'))

const HTTP_METHODS = /** @type {const} */ (['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'])

function toSlug(p) {
  if (p === '/') return 'root'
  return p
    .replace(/^\//, '')
    .replace(/\{([^}]+)\}/g, '$1')
    .replace(/_/g, '-')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
}

function methodTag(method) {
  return method.toUpperCase()
}

function isRealtorModuleOp(pathname, method) {
  if (pathname === '/realtor') return true
  if (pathname === '/payout_config') return true
  // lease-by-id is “core” even if it’s a view
  if (pathname.startsWith('/leases/')) return true
  if (pathname === '/leases/{lease_id}') return true
  return false
}

function pickResponse(op) {
  return op.responses?.['200'] ?? op.responses?.['201'] ?? op.responses?.['204']
}

function derefSchema(schema) {
  if (!schema) return null
  if (schema.$ref) {
    const key = schema.$ref.split('/').slice(-1)[0]
    return spec.components?.schemas?.[key] ?? null
  }
  return schema
}

function placeholderValueForSchema(schema) {
  const s = derefSchema(schema)
  if (!s) return '…'
  if (s.example != null) return s.example
  if (Array.isArray(s.examples) && s.examples.length) return s.examples[0]
  if (s.format === 'date-time') return '2026-01-29T00:00:00.000Z'
  if (s.format === 'uuid') return '00000000-0000-0000-0000-000000000000'
  if (s.type === 'string') return '…'
  if (s.type === 'integer' || s.type === 'number') return 0
  if (s.type === 'boolean') return false
  if (s.type === 'array') return []
  if (s.type === 'object') return {}
  return '…'
}

function exampleObjectFromSchema(schema, maxKeys = 8) {
  const s = derefSchema(schema)
  if (!s) return {}
  if (s.type === 'array' && s.items) return [exampleObjectFromSchema(s.items, maxKeys)]
  if (s.type !== 'object') return placeholderValueForSchema(s)

  const props = s.properties ?? {}
  const keys = Object.keys(props).slice(0, maxKeys)
  const obj = {}
  for (const k of keys) {
    obj[k] = placeholderValueForSchema(props[k])
  }
  return obj
}

function getRequestBodySchema(op) {
  const content = op.requestBody?.content
  if (!content) return null
  return content['application/json']?.schema ?? null
}

function getResponseSchema(op) {
  const resp = pickResponse(op)
  const schema = resp?.content?.['application/json']?.schema
  return schema ?? null
}

function safeWrite(filePath, content) {
  if (fs.existsSync(filePath)) return false
  fs.writeFileSync(filePath, content, 'utf8')
  return true
}

function mdxForOperation({ pathname, method, op }) {
  const slug = `${toSlug(pathname)}-${method}`
  const titlePath = pathname.includes('{') ? `\`${pathname}\`` : pathname
  const title = `${methodTag(method)} ${pathname}`

  const moduleTag = isRealtorModuleOp(pathname, method) ? 'Realtor module' : 'PostgREST view'
  const summary = op.summary || op.description || 'Endpoint documentation.'

  const requestBodySchema = getRequestBodySchema(op)
  const responseSchema = getResponseSchema(op)

  const requestBodyJson = JSON.stringify(exampleObjectFromSchema(requestBodySchema), null, 2)
  const requestBodyShell = requestBodyJson.replace(/'/g, `'\\''`)

  const requestExample =
    method === 'get'
      ? `curl -sS 'https://api.untron.finance/v3${pathname.replace('{lease_id}', '123')}'`
      : [
          `curl -sS -X ${method.toUpperCase()} 'https://api.untron.finance/v3${pathname}'`,
          `  -H 'content-type: application/json'`,
          `  -d '${requestBodyShell}'`,
        ].join(' \\\\\n')

  const responseExample = responseSchema
    ? JSON.stringify(exampleObjectFromSchema(responseSchema), null, 2)
    : JSON.stringify({ ok: true }, null, 2)

  const requestSection =
    method === 'get'
      ? `## Request\n\n:::code-group\n\n\`\`\`bash [cURL]\n${requestExample}\n\`\`\`\n\n:::\n`
      : `## Request\n\n:::code-group\n\n\`\`\`bash [cURL]\n${requestExample}\n\`\`\`\n\n\`\`\`json [Body]\n${requestBodyJson}\n\`\`\`\n\n:::\n`

  const responseSection = `## Response\n\n\`\`\`json\n${responseExample}\n\`\`\`\n`

  return `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(op.summary || '')}\n---\n\nimport { EndpointLayout } from '../../../../components/EndpointLayout'\nimport { EndpointAside } from '../../../../components/EndpointAside'\n\n<EndpointLayout\n  title=${JSON.stringify(op.summary || title)}\n  method=${JSON.stringify(methodTag(method))}\n  path=${JSON.stringify(pathname)}\n  summary=${JSON.stringify(typeof summary === 'string' ? summary.replace(/\\s+/g, ' ').trim() : '')}\n  aside={\n    <EndpointAside\n      baseUrl=\"https://api.untron.finance/v3\"\n      path=${JSON.stringify(pathname)}\n      method=${JSON.stringify(method)}\n      specUrl=\"https://api.untron.finance/v3/openapi.json\"\n    />\n  }\n>\n  :::info[Category]\n  ${moduleTag}.\n  :::\n\n  ${requestSection}\n  ${responseSection}\n\n  :::info[Placeholder]\n  This page is auto-generated from \`v3api.json\`. Replace examples/notes for endpoints you care about.\n  :::\n</EndpointLayout>\n`
}

fs.mkdirSync(OUT_DIR, { recursive: true })

let created = 0
for (const pathname of Object.keys(spec.paths ?? {})) {
  if (pathname === '/') continue
  const item = spec.paths[pathname]
  for (const method of HTTP_METHODS) {
    const op = item?.[method]
    if (!op) continue
    // skip methods we don’t want to document
    if (method !== 'get' && method !== 'post') continue
    const fileName = `${toSlug(pathname)}-${method}.mdx`
    const outPath = path.join(OUT_DIR, fileName)
    const mdx = mdxForOperation({ pathname, method, op })
    if (safeWrite(outPath, mdx)) created++
  }
}

process.stdout.write(`Generated ${created} new endpoint pages in ${OUT_DIR}\n`)
