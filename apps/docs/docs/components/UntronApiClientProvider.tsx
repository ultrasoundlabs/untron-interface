import * as React from 'react'
import { ApiClientModalProvider } from '@scalar/api-client-react'
import '@scalar/api-client-react/style.css'
import './scalar-overrides.css'

const BRIDGE_SPEC_URL = 'https://api.untron.finance/bridge/v1/openapi.json'
const V3_SPEC_URL = 'https://api.untron.finance/v3/openapi.json'

function usePathname() {
  const [pathname, setPathname] = React.useState(() => {
    if (typeof window === 'undefined') return ''
    return window.location.pathname
  })

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const update = () => setPathname(window.location.pathname)

    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (...args) {
      originalPushState.apply(this, args as any)
      update()
    }
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args as any)
      update()
    }

    window.addEventListener('popstate', update)
    update()

    return () => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener('popstate', update)
    }
  }, [])

  return pathname
}

export function UntronApiClientProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const specUrl = React.useMemo(() => {
    // Default to Bridge spec unless we're clearly in V3 docs.
    return pathname.startsWith('/v3') ? V3_SPEC_URL : BRIDGE_SPEC_URL
  }, [pathname])

  return <ApiClientModalProvider configuration={{ url: specUrl }}>{children}</ApiClientModalProvider>
}
