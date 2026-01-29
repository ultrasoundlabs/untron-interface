# Untron: Frontend Interfaces

This is the **public** repository for Untron's frontend interfaces, including the official landing page and the Bridge frontend. Untron is a series of cross-chain protocols for decentralized exchange of stablecoins between Tron and EVM chains.

## Frontends

- Landing Page: [untron.finance](https://untron.finance)
- Bridge: [bridge.untron.finance](https://bridge.untron.finance)
- Untron V3 Dashboard: [v3.untron.finance](https://v3.untron.finance)

## Install & Apps

```bash
git clone git@github.com:ultrasoundlabs/untron-interface.git
node -v # should be v22.16.0 (see .nvmrc)
bun install
bun dev
```

For instructions per application or package, see the README published for each application:

- [Landing Page](apps/landing/README.md)
- [Bridge](apps/bridge/README.md)
- [Untron V3 Dashboard](apps/v3/README.md)

## Packages

- `@untron/ui`: shared shadcn-svelte component library used by all apps. See [packages/ui](packages/ui/README.md).
- `@untron/stylekit`: shared theme + layout primitives (header/footer/theme/head). See [packages/stylekit](packages/stylekit/README.md).
- `@untron/connectkit`: shared wallet connection primitives (wagmi helpers + wallet metadata/icons). See [packages/connectkit](packages/connectkit/README.md).

## Socials / Contact

- X: [@untronfi](https://x.com/untronfi)
- Telegram: [@untronchat](https://t.me/untronchat)
- Email: [contact@untron.finance](mailto:contact@untron.finance)

## 🗂 Directory Structure

| Folder      | Contents                                                                       |
| ----------- | ------------------------------------------------------------------------------ |
| `apps/`     | The home for each standalone application.                                      |
| `packages/` | Shared code packages (UI, theme, wallet connect, etc.).                        |
