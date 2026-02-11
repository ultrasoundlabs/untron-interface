import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vocs'

const __dirname = dirname(fileURLToPath(import.meta.url))

type SidebarItem =
  | { text: string; link: string }
  | { text: string; collapsed?: boolean; items: SidebarItem[] }

function toSlug(pathname: string) {
  if (pathname === '/') return 'root'
  return pathname
    .replace(/^\//, '')
    .replace(/\{([^}]+)\}/g, '$1')
    .replace(/_/g, '-')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
}

function buildV3GeneratedEndpointLinks(): SidebarItem[] {
  const specPath = join(__dirname, 'v3api.json')
  if (!existsSync(specPath)) return []

  const raw = readFileSync(specPath, 'utf8')
  const spec = JSON.parse(raw) as { paths?: Record<string, Record<string, unknown>> }

  const methods = ['get', 'post'] as const
  const realtorCurated = new Set(['/realtor', '/payout_config', '/leases/{lease_id}'])

  const items: SidebarItem[] = []
  for (const pathname of Object.keys(spec.paths ?? {}).sort()) {
    if (pathname === '/') continue
    if (realtorCurated.has(pathname)) continue
    const pathItem = spec.paths?.[pathname] ?? {}
    for (const method of methods) {
      if (!(method in pathItem)) continue
      items.push({
        text: `${method.toUpperCase()} ${pathname}`,
        link: `/v3-api/endpoints/generated/${toSlug(pathname)}-${method}`,
      })
    }
  }
  return items
}

const v3GeneratedEndpointLinks = buildV3GeneratedEndpointLinks()

export default defineConfig({
  title: 'Untron',
  titleTemplate: '%s – Untron Docs',
  description:
    'Stablecoin rails for builders: a stable Bridge API, a raw V3 API, and protocol reference docs.',
  logoUrl: '/logo.svg',
  topNav: [
    { text: 'Home', link: '/home', match: '/home' },
    { text: 'Bridge API', link: '/bridge-api', match: '/bridge-api' },
    { text: 'V3 API', link: '/v3-api', match: '/v3-api' },
    { text: 'V3 Reference', link: '/v3-reference', match: '/v3-reference' },
  ],
  sidebar: {
    '/home': [
      { text: 'Introduction', link: '/home' },
      { text: 'APIs & access', link: '/home/apis' },
    ],
    '/bridge-api': [
      { text: 'Overview', link: '/bridge-api' },
      { text: 'API Reference', link: '/bridge-api/reference' },
      {
        text: 'Endpoints',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/bridge-api/endpoints' },
          { text: 'GET /v1/capabilities', link: '/bridge-api/endpoints/get-capabilities' },
          { text: 'POST /v1/quotes', link: '/bridge-api/endpoints/create-quote' },
          { text: 'POST /v1/orders', link: '/bridge-api/endpoints/create-order' },
          { text: 'GET /v1/orders/{orderId}', link: '/bridge-api/endpoints/get-order' },
        ],
      },
    ],
    '/v3-api': [
      { text: 'Overview', link: '/v3-api' },
      { text: 'API Reference', link: '/v3-api/reference' },
      {
        text: 'Endpoints',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/v3-api/endpoints' },
          {
            text: 'Realtor endpoints',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/v3-api/endpoints/realtor-module' },
              { text: 'GET /realtor', link: '/v3-api/endpoints/realtor' },
              { text: 'POST /realtor', link: '/v3-api/endpoints/create-lease' },
              { text: 'POST /payout_config', link: '/v3-api/endpoints/payout-config' },
              { text: 'GET /leases/{lease_id}', link: '/v3-api/endpoints/lease-by-id' },
            ],
          },
          {
            text: 'Indexer endpoints',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/v3-api/endpoints/indexer' },
              { text: 'GET /lease_view', link: '/v3-api/endpoints/lease-view' },
              { text: 'GET /hub_leases', link: '/v3-api/endpoints/hub-leases' },
              { text: 'GET /usdt_deposit_txs', link: '/v3-api/endpoints/usdt-deposit-txs' },
              { text: 'GET /health', link: '/v3-api/endpoints/health' },
              {
                text: 'All other endpoints',
                collapsed: true,
                items: v3GeneratedEndpointLinks,
              },
            ],
          },
        ],
      },
    ],
    '/v3-reference': [
      { text: 'Overview', link: '/v3-reference' },
      { text: 'How V3 Works', link: '/v3-reference/how-it-works' },
      {
        text: 'Protocol reference',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/v3-reference/protocol' },
          { text: 'Terminology', link: '/v3-reference/protocol/terminology' },
          { text: 'System architecture', link: '/v3-reference/protocol/architecture' },
          {
            text: 'Core mechanics',
            collapsed: true,
            items: [
              {
                text: 'Deterministic receivers',
                link: '/v3-reference/protocol/deterministic-receivers',
              },
              { text: 'Leases', link: '/v3-reference/protocol/leases' },
              { text: 'Claims', link: '/v3-reference/protocol/claims' },
            ],
          },
          {
            text: 'Entitlement & settlement',
            collapsed: true,
            items: [
              {
                text: 'Entitlement (fast path)',
                link: '/v3-reference/protocol/entitlement-fast-path',
              },
              {
                text: 'Entitlement (subjective)',
                link: '/v3-reference/protocol/entitlement-subjective',
              },
              {
                text: 'Entitlement (slow path)',
                link: '/v3-reference/protocol/entitlement-slow-path',
              },
              { text: 'Settlement (fill)', link: '/v3-reference/protocol/settlement-fill' },
            ],
          },
          {
            text: 'Liquidity & contracts',
            collapsed: true,
            items: [
              { text: 'Liquidity (LP vault)', link: '/v3-reference/protocol/liquidity-lp-vault' },
              { text: 'Tron contracts', link: '/v3-reference/protocol/contracts-tron' },
              { text: 'EVM hub contracts', link: '/v3-reference/protocol/contracts-evm' },
            ],
          },
          { text: 'Admin & trust model', link: '/v3-reference/protocol/admin-trust-model' },
        ],
      },
    ],
  },
})
