// src/i18n/en.ts
export const landing = {
  // Meta
  metaTitle: 'Untron – Non-custodial stablecoin bridge between Tron and EVM chains',
  metaDescription:
    'Untron is a non-custodial stablecoin bridge between Tron (TRC-20) and major EVM chains. Bridge USDT and USDC with gasless UX, low fees, and a trust-minimized, audited design.',
  ogTitle: 'Untron – Tron ↔ EVM stablecoin bridge',
  ogDescription:
    'Move stablecoins between Tron and EVM chains with a gasless, non-custodial bridge. Cheaper than centralized and decentralized alternatives.',

  // Header / navigation
  navBrand: 'Untron',
  navIntegrate: 'Integrate',
  navFees: 'Fees',
  navChains: 'Supported chains',
  navSecurity: 'Security',
  navFaq: 'FAQ',
  navBlog: 'Blog',
  navGoToApp: 'Go to app',
  languageSwitcherLabel: 'Change language',

  // Hero
  heroEyebrow: 'Non-custodial stablecoin bridge',
  heroTitle: 'Non-custodial stablecoin bridge between Tron and EVM chains',
  heroParagraph1:
    'Untron is a cross-chain protocol for moving stablecoins between Tron (TRC-20) and major EVM networks. Bridge USDT and USDC from Tron to Ethereum, Arbitrum, Base, and more with gasless UX, low fees, and a trust-minimized design.',
  heroParagraph2: 'Never touch Tron again — but keep your TRC-20 payments.',
  heroCta: 'Try it out',

  // For stablecoin users
  forUsersHeading: 'For stablecoin users: bridge USDT and USDC between Tron and EVM',
  forUsersParagraph1:
    'Untron is a web-based platform you can use from any exchange or wallet to send stablecoins between Tron (TRC-20) and dozens of popular EVM chains. It’s gasless for end users — you don’t need ETH, TRX, or BNB to use it — and it’s incredibly cheap.',
  forUsersParagraph2:
    'For example, swapping USDT to a Tron address often costs around $2, typically about twice as cheap as sending USDT directly on Tron. Exact fees may vary; always check the app for current pricing.',
  forUsersParagraph3:
    'In short, Untron connects cheap and convenient EVM chains to Tron’s vast payments ecosystem, letting you benefit from both.',
  forUsersCta: 'Try Untron',

  // For businesses
  forBusinessesHeading:
    'For businesses: rebalance stablecoin liquidity between Tron and EVM at scale',
  forBusinessesParagraph1:
    'From payment merchants and rails to Argentinian cuevas and OTC desks, Untron is the way to rebalance stablecoin liquidity across chains worldwide. Move millions of dollars in minutes between Tron and EVM chains, without relying on centralized exchanges.',
  forBusinessesParagraph2:
    'Fully audited contracts and a trust-minimized design ensure that funds can be bridged with no arbitrary limits or restrictions.',
  forBusinessesCtaBridgeNow: 'Bridge now',
  forBusinessesCtaComparison: 'Comparison with alternatives',
  forBusinessesCtaTalkToUs: 'Talk to us',

  // Developers / integration
  forDevelopersHeading: 'For developers: integrate Untron with one API call',
  forDevelopersParagraph1:
    'Integrating Untron into your product is as simple as a single API call and a smart contract transaction. Our hosted, free APIs are open-source and can be self-hosted for maximum control.',
  forDevelopersParagraph2:
    'Untron V3 and Untron Intents smart contracts have been audited and formally verified by Ultrasound Labs. Both use a ZK-based Tron light client design as the source of truth, making Untron one of the most trust-minimized stablecoin bridges in the ecosystem.',
  forDevelopersCtaDocs: 'Read the docs',
  forDevelopersCtaTalkToUs: 'Talk to us',

  // Fees & pricing
  feesHeading: 'Fees & pricing',
  feesIntro:
    'Untron is free to integrate and self-host. The examples below are approximate and may change over time; always check current rates in the app.',

  feesTronToEvmHeading: 'Swapping $100 from Tron to an EVM chain',
  feesTronToEvmNote: 'Includes TRX gas fees, if applicable.',
  feesTableService: 'Service',
  feesTableReceived: 'Received amount (approx.)',
  feesRowUntronTronToEvm: 'Untron',
  feesRowUntronTronToEvmValue: '$99.90 (0.10%)',
  feesRowFixedFloat: 'FixedFloat',
  feesRowFixedFloatValue: '$98.50 (~1.5%)',
  feesRowChangeNow: 'ChangeNOW',
  feesRowChangeNowValue: '$98.50 (~1.5%)',
  feesRowSymbiosis: 'Symbiosis',
  feesRowSymbiosisValue: '$94.00 (0.30% + gas fees)*',
  feesRowBridgers: 'Bridgers',
  feesRowBridgersValue: '$94.00 (0.30% + gas fees)*',
  feesFootnote1:
    '* Most decentralized bridges like Symbiosis and Bridgers require a smart contract call on Tron, which costs around $5 in TRX gas fees. FixedFloat and ChangeNOW are centralized exchanges and do not require that call.',
  feesFootnote2:
    'Untron is the only decentralized bridge that doesn’t require Tron smart contract calls, can be used from any exchange or wallet, and is cheaper than both centralized and decentralized alternatives on typical routes.',

  feesEvmToTronHeading: 'Swapping $100 from an EVM chain to Tron',
  feesRowUntronEvmToTron: 'Untron',
  feesRowUntronEvmToTronValue: '$98.00 (effectively fee-free into Tron)*',
  feesRowSymbiosisEvmToTronValue: '$90.00 (0.30% + gas fees)',
  feesRowBridgersEvmToTronValue: '$90.00 (0.30% + gas fees)',
  feesFootnote3:
    '* Untron does not charge bridging fees for swapping into Tron USDT and optimizes gas usage on Tron, often making it roughly twice as cheap as a normal Tron USDT transfer — practical even for daily transfers.',

  // Supported assets / chains
  chainsHeading: 'Supported stablecoins and EVM chains',
  chainsStablecoinsHeading: 'Stablecoins',
  chainsStablecoinUsdt: 'USDT (TRC-20, ERC-20, and supported EVM deployments)',
  chainsStablecoinUsdc: 'USDC (where available)',
  chainsNetworksHeading: 'EVM networks',
  chainsNetworkEthereum: 'Ethereum',
  chainsNetworkArbitrum: 'Arbitrum',
  chainsNetworkOptimism: 'Optimism',
  chainsNetworkBase: 'Base',
  chainsNetworkBnb: 'BNB Chain',
  chainsNetworkMore: '…and more',
  chainsParagraph:
    'Untron’s fee structure is consistent across chains and routes, keeping transactions affordable and easy to reason about, no matter where your crypto is.',

  // Security
  securityHeading: 'Security',
  securityParagraph1:
    'Untron is a non-custodial Tron ↔ EVM stablecoin bridge. Our protocols read the Tron blockchain in real time as the source of truth, so funds only leave your possession if the Tron blockchain has processed the transaction you requested.',
  securityParagraph2:
    'Our smart contracts have been audited and formally verified by Ultrasound Labs and are built around a ZK-based Tron light client. This makes Untron one of the most trust-minimized bridging solutions for Tron and EVM ecosystems.',
  securityCtaTechnical: 'Read more (technical)',

  // FAQ
  faqHeading: 'FAQ',
  faqIsNonCustodialQuestion: 'Is Untron non-custodial?',
  faqIsNonCustodialAnswer:
    'Yes. Untron never holds your private keys. All transfers are executed via your wallet and Untron smart contracts; you remain in control of your funds at all times.',
  faqGasQuestion: 'Do I need TRX or ETH gas to use Untron?',
  faqGasAnswer:
    'End-user experience is gasless. Untron abstracts gas costs on supported routes so you can bridge stablecoins without pre-funding TRX or ETH.',

  // Blog
  blogHeading: 'From the Untron blog',
  blogArticle1: 'Article 1',
  blogArticle2: 'Article 2',
  blogArticle3: 'Article 3',

  // Footer
  footerCopyright: '© Untron. All rights reserved.',
  footerLinkTerms: 'Terms',
  footerLinkPrivacy: 'Privacy',
  footerLinkDocs: 'Docs',
  footerLinkDiscord: 'Discord',
  footerLinkX: 'X (Twitter)',
};
