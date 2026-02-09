import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'en',
  localeName: 'English',
  meta: {
    title: 'Untron | Non-custodial Tron <-> EVM Stablecoin Bridge',
    description:
      'Bridge USDT and USDC between Tron and major EVM chains with gasless UX, low fees, and audited smart contracts.',
    keywords:
      'tron bridge, usdt bridge, usdc bridge, tron to evm, non-custodial bridge, stablecoin bridge, web3 bridge',
    ogTitle: 'Untron | Non-custodial Tron <-> EVM bridge',
    ogDescription:
      'Move stablecoins between Tron and EVM chains without relying on centralized exchanges.',
    twitterTitle: 'Untron | Tron <-> EVM stablecoin bridge',
    twitterDescription:
      'Gasless UX, low fees, and trust-minimized contracts for moving USDT and USDC between chains.',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'Skip to main content',
    productsLabel: 'Products',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'Integrate',
    sectionsLabel: 'Sections',
    sectionHowItWorks: 'How it works',
    sectionFees: 'Fees',
    sectionSecurity: 'Security',
    sectionFaq: 'FAQ',
    openApp: 'Open app',
    languageLabel: 'Language',
    toggleThemeLabel: 'Toggle color theme',
  },
  hero: {
    eyebrow: 'Non-custodial stablecoin bridge',
    title: 'Move USDT and USDC between Tron and EVM chains without exchange risk.',
    description:
      'Send stablecoins from Tron to Ethereum, Arbitrum, Base, and other EVM chains in minutes.',
    supportingLine: 'No CEX account. No custody handoff. Clear routes and predictable execution.',
    routePreviewLabel: 'Route preview',
    routeSourceLabel: 'From',
    routeDestinationLabel: 'To',
    swapSendLabel: 'You send',
    swapReceiveLabel: 'You receive',
    swapFlipLabel: 'Flip direction',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'Getting live quote...',
    swapQuoteReady: 'Live quote updated',
    swapQuoteError: 'Could not load quote',
    swapRateLabel: 'Rate',
    swapFeeLabel: 'Bridge fee',
    swapOpenBridgeLabel: 'Open in Bridge',
    primaryCta: 'Start bridging',
    secondaryCta: 'See fee comparison',
    pickerBackLabel: 'Back',
    pickerCloseLabel: 'Close selector',
    highlightsLabel: 'Highlights',
  },
  stats: [
    { value: '0 custody', label: 'You keep wallet control end to end' },
    { value: 'Gasless UX', label: 'No pre-funding TRX or ETH for supported routes' },
    { value: 'Audited', label: 'Contracts independently audited and reviewed' },
  ],
  audiences: {
    title: 'Built for real stablecoin workflows',
    subtitle:
      'Retail transfers, liquidity rebalancing, and product integrations all use the same simple flow.',
    cards: [
      {
        label: 'Users',
        title: 'Bridge from any exchange or wallet',
        description: 'Move stablecoins across chains without juggling apps or gas tokens.',
        ctaLabel: 'Open bridge',
        ctaHref: 'https://bridge.untron.finance',
      },
      {
        label: 'Businesses',
        title: 'Rebalance liquidity at market speed',
        description: 'Move size between Tron and EVM with fewer dependencies than CEX rails.',
        ctaLabel: 'Talk to us',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'Developers',
        title: 'Integrate with one API + one contract call',
        description:
          'Use hosted APIs or self-host. Built for payments and onchain treasury products.',
        ctaLabel: 'Read docs',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'How it works',
    subtitle: 'Three steps from source chain to destination chain.',
    steps: [
      {
        title: '1. Pick route and amount',
        description: 'Choose source, destination, and amount. You get a quote before execution.',
      },
      {
        title: '2. Send once from your wallet',
        description: 'Confirm once. Untron validates chain state and runs the settlement flow.',
      },
      {
        title: '3. Receive on destination chain',
        description:
          'Funds arrive to destination wallet with clear status and no hidden custody step.',
      },
    ],
  },
  fees: {
    title: 'Fee snapshot',
    subtitle: 'Approximate comparison for bridging $100. Live quotes always take priority.',
    amountLabel: '$100 example route',
    columns: {
      service: 'Service',
      received: 'Received amount',
      notes: 'Notes',
    },
    rows: [
      {
        service: 'Untron',
        received: '$99.90',
        notes: 'Non-custodial flow, optimized routing',
        isUntron: true,
      },
      {
        service: 'FixedFloat',
        received: '$98.50',
        notes: 'Centralized exchange model',
      },
      {
        service: 'ChangeNOW',
        received: '$98.50',
        notes: 'Centralized exchange model',
      },
      {
        service: 'Symbiosis',
        received: '$94.00',
        notes: 'Additional Tron-side contract gas overhead',
      },
      {
        service: 'Bridgers',
        received: '$94.00',
        notes: 'Additional Tron-side contract gas overhead',
      },
    ],
    footnote:
      'Figures are directional examples, not a promise. Check the live quote in the bridge before sending.',
    focusTitle: 'Execution advantages',
    focusBullets: [
      'Non-custodial by design',
      'Bridge UX optimized for low friction',
      'Cross-chain settlement with clear status',
      'No dependency on centralized account rails',
    ],
    focusCta: 'Open live quote',
  },
  chains: {
    title: 'Supported assets and networks',
    subtitle: 'Coverage for stablecoins, chains, and wallet entry points.',
    stablecoinsLabel: 'Stablecoins',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'Networks',
    networkCountSuffix: 'chains live',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'and more'],
    walletsLabel: 'Any wallet',
    exchangesLabel: 'Any exchange',
    moreLabel: 'and more',
    walletsNote: 'Deep links and browser wallets supported for smooth connect flow.',
  },
  security: {
    title: 'Security posture',
    subtitle: 'Settlement logic is anchored to chain state rather than operator discretion.',
    bullets: [
      'Non-custodial architecture with user-controlled wallets.',
      'Independently audited contracts for core protocol paths.',
      'Trust-minimized design anchored to Tron chain data as source of truth.',
    ],
    ctaLabel: 'Read technical security notes',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'Do I need a centralized exchange account?',
        answer:
          'No. Untron is built for wallet-native bridging between chains, so you can transfer without moving through a CEX account.',
      },
      {
        question: 'Is KYC required?',
        answer:
          'The protocol itself does not require KYC because it is non-custodial. Always verify your local compliance requirements.',
      },
      {
        question: 'Do I need TRX or ETH to start?',
        answer:
          'Supported routes are optimized for gasless user experience, so pre-funding network gas is often unnecessary.',
      },
      {
        question: 'Can I bridge larger treasury-sized amounts?',
        answer:
          'Yes. Businesses use Untron for large rebalancing flows. Use live quotes and route limits in the app before executing size.',
      },
    ],
  },
  finalCta: {
    title: 'Ready to bridge?',
    description:
      'Open the app to get a live quote and move stablecoins between Tron and EVM chains right now.',
    buttonLabel: 'Open Bridge App',
  },
  footer: {
    tagline: 'Stablecoin liquidity across chains, without custody handoffs.',
    legal: 'All rights reserved.',
    linksLabel: 'Quick links',
    terms: 'Terms',
    privacy: 'Privacy',
    docs: 'Docs',
    contact: 'Contact',
    socialLabel: 'Social',
  },
  links: {
    bridgeApp: 'https://bridge.untron.finance',
    v3Dashboard: 'https://v3.untron.finance',
    docs: 'https://docs.untron.finance',
    securityDocs: 'https://docs.untron.finance',
    contactEmail: 'mailto:contact@untron.finance',
    x: 'https://x.com/untronfi',
    telegram: 'https://t.me/untronchat',
    github: 'https://github.com/ultrasoundlabs',
  },
};
