import * as React from 'react'
import { useApiClientModal } from '@scalar/api-client-react'
import './tryit.css'

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
  path: string
  method: HttpMethod
  children?: React.ReactNode
  variant?: 'primary' | 'ghost'
}

export function TryItButton({ path, method, children, variant = 'primary' }: Props) {
  const client = useApiClientModal()

  return (
    <button
      type="button"
      onClick={() => client?.open({ path, method })}
      className={variant === 'primary' ? 'untron-tryit untron-tryit_primary' : 'untron-tryit untron-tryit_ghost'}
    >
      {children ?? 'Try it'}
    </button>
  )
}
