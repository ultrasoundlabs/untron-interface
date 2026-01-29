# `@untron/connectkit`

Shared wallet connection primitives for Untron apps.

## What lives here

- Wallet metadata + bundled icons: `@untron/connectkit/wallets` (`WALLETS`)
- Wagmi helpers: `@untron/connectkit/wagmi`

## Usage

Wallet list (icons are bundled via `import.meta.url`, apps don’t need `static/logos/wallets/*`):

```ts
import { WALLETS } from '@untron/connectkit/wallets';
```

Wagmi helpers:

```ts
import { createInjectedWagmiConfig, createConnectionStore } from '@untron/connectkit/wagmi';
```

## Roadmap

- WalletConnect integration should be added here so all apps share the exact same behavior.

