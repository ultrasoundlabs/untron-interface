import * as React from 'react'
import { UntronApiClientProvider } from './components/UntronApiClientProvider'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <UntronApiClientProvider>{children}</UntronApiClientProvider>
}

