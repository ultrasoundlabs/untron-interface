import * as React from 'react'
import './endpoint.css'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE'

type Props = {
  title: string
  method: HttpMethod
  path: string
  summary?: string
  aside?: React.ReactNode
  children: React.ReactNode
}

function methodColor(method: HttpMethod) {
  switch (method) {
    case 'GET':
      return { bg: 'rgba(59, 130, 246, 0.14)', fg: 'rgb(59, 130, 246)' }
    case 'POST':
      return { bg: 'rgba(16, 185, 129, 0.14)', fg: 'rgb(16, 185, 129)' }
    case 'PUT':
    case 'PATCH':
      return { bg: 'rgba(234, 179, 8, 0.14)', fg: 'rgb(234, 179, 8)' }
    case 'DELETE':
      return { bg: 'rgba(239, 68, 68, 0.14)', fg: 'rgb(239, 68, 68)' }
    default:
      return { bg: 'rgba(148, 163, 184, 0.14)', fg: 'rgb(148, 163, 184)' }
  }
}

export function EndpointLayout({ title, method, path, summary, aside, children }: Props) {
  const colors = methodColor(method)

  return (
    <div className="untron-endpoint">
      <div className="untron-endpoint__header">
        <div className="untron-endpoint__titleRow">
          <span
            className="untron-endpoint__method"
            style={{
              background: colors.bg,
              color: colors.fg,
              borderColor: 'color-mix(in oklab, currentColor 30%, transparent)',
            }}
          >
            {method}
          </span>
          <span className="untron-endpoint__path">{path}</span>
        </div>
        <h1 className="untron-endpoint__title">{title}</h1>
        {summary ? <p className="untron-endpoint__summary">{summary}</p> : null}
        {aside ? <div className="untron-endpoint__asideInline">{aside}</div> : null}
      </div>

      <div className="untron-endpoint__content">{children}</div>
    </div>
  )
}
