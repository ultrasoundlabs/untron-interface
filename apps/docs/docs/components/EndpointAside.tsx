import * as React from 'react'
import { TryItButton } from './TryItButton'
import './endpointAside.css'

type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'head'
  | 'options'
  | 'trace'

type Props = {
  baseUrl: string
  path: string
  method: HttpMethod
  specUrl?: string
}

function methodLabel(method: HttpMethod) {
  return method.toUpperCase()
}

export function EndpointAside({ baseUrl, path, method, specUrl }: Props) {
  const fullUrl = `${baseUrl}${path}`
  const [copied, setCopied] = React.useState(false)

  const copy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = fullUrl
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    }
  }, [fullUrl])

  return (
    <div className="untron-aside">
      <div className="untron-aside__header">
        <div className="untron-aside__title">Try it</div>
        <TryItButton path={path} method={method}>
          Open client
        </TryItButton>
      </div>

      <div className="untron-aside__section">
        <div className="untron-aside__label">Request</div>
        <div className="untron-aside__requestLine">
          <span className="untron-aside__method">{methodLabel(method)}</span>
          <span className="untron-aside__url">{fullUrl}</span>
          <button
            type="button"
            className="untron-aside__copy"
            onClick={copy}
            aria-label={copied ? 'Copied' : 'Copy request URL'}
            title={copied ? 'Copied' : 'Copy request URL'}
          >
            {copied ? (
              <span style={{ fontSize: 11, fontWeight: 650 }}>Copied</span>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M8 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {specUrl ? (
        <div className="untron-aside__section">
          <div className="untron-aside__label">Spec</div>
          <a className="untron-aside__link" href={specUrl} target="_blank" rel="noreferrer">
            Open OpenAPI
          </a>
        </div>
      ) : null}
    </div>
  )
}
