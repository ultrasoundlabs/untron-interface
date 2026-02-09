import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'fil',
  localeName: 'Filipino',
  meta: {
    title: 'Untron | Non-custodial na stablecoin bridge Tron <-> EVM',
    description:
      'I-bridge ang USDT at USDC sa pagitan ng Tron at mga pangunahing EVM chain gamit ang gasless UX, mababang fees, at mga audited smart contract.',
    keywords:
      'tron bridge, usdt bridge, usdc bridge, tron to evm, non-custodial bridge, stablecoin bridge, web3 bridge',
    ogTitle: 'Untron | Non-custodial Tron <-> EVM bridge',
    ogDescription:
      'Ilipat ang mga stablecoin sa pagitan ng Tron at EVM chains nang hindi umaasa sa mga centralized exchange.',
    twitterTitle: 'Untron | Tron <-> EVM stablecoin bridge',
    twitterDescription:
      'Gasless UX, mababang fees, at trust-minimized na kontrata para ilipat ang USDT at USDC sa pagitan ng chains.',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'Tumalon sa pangunahing nilalaman',
    productsLabel: 'Mga produkto',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'Integrasyon',
    sectionsLabel: 'Mga seksyon',
    sectionHowItWorks: 'Paano ito gumagana',
    sectionFees: 'Bayarin',
    sectionSecurity: 'Seguridad',
    sectionFaq: 'FAQ',
    openApp: 'Buksan ang app',
    languageLabel: 'Wika',
    toggleThemeLabel: 'Palitan ang tema',
  },
  hero: {
    eyebrow: 'Non-custodial na stablecoin bridge',
    title: 'Ilipat ang USDT at USDC sa pagitan ng Tron at EVM chains nang walang panganib sa exchange.',
    description:
      'Magpadala ng stablecoins mula Tron papuntang Ethereum, Arbitrum, Base, at iba pang EVM chains sa loob ng ilang minuto.',
    supportingLine:
      'Walang CEX account. Walang custody handoff. Malinaw ang mga ruta at predictable ang execution.',
    routePreviewLabel: 'Preview ng ruta',
    routeSourceLabel: 'Mula',
    routeDestinationLabel: 'Papunta',
    swapSendLabel: 'Ikaw ang magpapadala',
    swapReceiveLabel: 'Ikaw ang makakatanggap',
    swapFlipLabel: 'Baliktarin ang direksyon',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'Kinukuha ang live quote...',
    swapQuoteReady: 'Na-update ang live quote',
    swapQuoteError: 'Hindi ma-load ang live quote',
    swapRateLabel: 'Rate',
    swapFeeLabel: 'Bayad sa bridge',
    swapOpenBridgeLabel: 'Buksan sa Bridge',
    primaryCta: 'Simulan ang bridging',
    secondaryCta: 'Tingnan ang paghahambing ng bayarin',
    pickerBackLabel: 'Bumalik',
    pickerCloseLabel: 'Isara ang pagpili',
    highlightsLabel: 'Mga tampok',
  },
  stats: [
    { value: '0 custody', label: 'Ikaw ang may kontrol sa wallet mula simula hanggang dulo' },
    { value: 'Gasless UX', label: 'Hindi kailangang mag-prefund ng TRX o ETH para sa mga suportadong ruta' },
    { value: 'Audited', label: 'Nairebyu at na-verify nang pormal ang mga kontrata' },
  ],
  audiences: {
    title: 'Ginawa para sa tunay na stablecoin workflows',
    subtitle:
      'Mga paglilipat, pag-rebalance ng liquidity, at integrations ay gumagamit ng parehong simpleng proseso.',
    cards: [
      {
        label: 'Mga user',
        title: 'Mag-bridge mula sa anumang exchange o wallet',
        description:
          'Ilipat ang stablecoins sa pagitan ng chains nang hindi nagpapalit-palit ng apps o gas token.',
        ctaLabel: 'Buksan ang bridge',
        ctaHref: 'https://bridge.untron.finance',
      },
      {
        label: 'Mga negosyo',
        title: 'Mag-rebalance ng liquidity sa bilis ng merkado',
        description:
          'Ilipat ang halaga sa pagitan ng Tron at EVM na may mas kaunting dependencies kaysa sa CEX rails.',
        ctaLabel: 'Makipag-usap',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'Mga developer',
        title: 'Mag-integrate gamit ang isang API + isang contract call',
        description:
          'Gamitin ang hosted API o mag-self-host. Para sa payments at onchain treasury products.',
        ctaLabel: 'Basahin ang dokumentasyon',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'Paano ito gumagana',
    subtitle: 'Tatlong hakbang mula source chain hanggang destination chain.',
    steps: [
      {
        title: '1. Piliin ang ruta at halaga',
        description:
          'Piliin ang source, destination, at halaga. Makakakuha ka ng quote bago mag-execute.',
      },
      {
        title: '2. Magpadala isang beses mula sa wallet',
        description:
          'Isang confirmation lang. Vina-validate ng Untron ang chain state at nirurun ang settlement.',
      },
      {
        title: '3. Tumanggap sa destination chain',
        description: 'Dumarating ang funds sa destination wallet na may malinaw na status at walang hidden custody step.',
      },
    ],
  },
  fees: {
    title: 'Paghahambing ng bayarin',
    subtitle: 'Tinatayang comparison para mag-bridge ng $100. Laging mas prioridad ang live quotes.',
    amountLabel: '$100 halimbawa ng ruta',
    columns: {
      service: 'Serbisyo',
      received: 'Natanggap na amount',
      notes: 'Mga tala',
    },
    rows: [
      {
        service: 'Untron',
        received: '$99.90',
        notes: 'Non-custodial na flow, optimized routing',
        isUntron: true,
      },
      {
        service: 'FixedFloat',
        received: '$98.50',
        notes: 'Modelo ng centralized exchange',
      },
      {
        service: 'ChangeNOW',
        received: '$98.50',
        notes: 'Modelo ng centralized exchange',
      },
      {
        service: 'Symbiosis',
        received: '$94.00',
        notes: 'May dagdag na gas overhead ng kontrata sa Tron side',
      },
      {
        service: 'Bridgers',
        received: '$94.00',
        notes: 'May dagdag na gas overhead ng kontrata sa Tron side',
      },
    ],
    footnote:
      'Directional examples lang ito, hindi pangako. Tingnan ang live quote sa bridge bago magpadala.',
    focusTitle: 'Mga bentahe sa execution',
    focusBullets: [
      'Non-custodial mula sa disenyo',
      'Bridge UX na optimized para mas madaling gamitin',
      'Settlement sa pagitan ng chains na may malinaw na status',
      'Hindi naka-depende sa centralized na account rails',
    ],
    focusCta: 'Buksan ang live quote',
  },
  chains: {
    title: 'Mga suportadong asset at network',
    subtitle: 'Saklaw para sa stablecoins, chains, at mga entry point ng wallet.',
    stablecoinsLabel: 'Stablecoins',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'Mga network',
    networkCountSuffix: 'mga chain na live',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'at iba pa'],
    walletsLabel: 'Kahit anong wallet',
    exchangesLabel: 'Kahit anong exchange',
    moreLabel: 'at iba pa',
    walletsNote: 'Sinusuportahan ang deep links at browser wallets para sa mas smooth na pag-connect.',
  },
  security: {
    title: 'Seguridad',
    subtitle: 'Naka-anchor ang settlement logic sa chain state, hindi sa discretion ng operator.',
    bullets: [
      'Non-custodial na arkitektura na wallet ang kontrol ng user.',
      'Audited at formally verified na contracts para sa core protocol paths.',
      'Trust-minimized na design na naka-anchor sa Tron chain data bilang source of truth.',
    ],
    ctaLabel: 'Basahin ang mga teknikal na tala sa seguridad',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'Kailangan ko ba ng centralized exchange account?',
        answer:
          'Hindi. Wallet-native ang Untron para sa bridging sa pagitan ng chains, kaya hindi kailangan dumaan sa CEX account.',
      },
      {
        question: 'Kailangan ba ng KYC?',
        answer:
          'Hindi kailangan ng KYC sa protocol dahil non-custodial ito. I-verify pa rin ang local compliance requirements mo.',
      },
      {
        question: 'Kailangan ko ba ng TRX o ETH para magsimula?',
        answer:
          'Ang supported routes ay optimized para gasless UX, kaya madalas hindi na kailangan mag-prefund ng gas tokens.',
      },
      {
        question: 'Pwede ba akong mag-bridge ng mas malalaking halaga?',
        answer:
          'Oo. Ginagamit ng mga negosyo ang Untron para sa malalaking rebalancing flows. Tingnan ang live quotes at route limits sa app bago mag-execute.',
      },
    ],
  },
  finalCta: {
    title: 'Handa ka na bang mag-bridge?',
    description:
      'Buksan ang app para sa live quote at ilipat ang stablecoins sa pagitan ng Tron at EVM chains ngayon din.',
    buttonLabel: 'Buksan ang Bridge App',
  },
  footer: {
    tagline: 'Stablecoin liquidity sa pagitan ng chains, walang custody handoff.',
    legal: 'Lahat ng karapatan ay nakalaan.',
    linksLabel: 'Mga link',
    terms: 'Mga tuntunin',
    privacy: 'Pribasiya',
    docs: 'Docs',
    contact: 'Makipag-ugnayan',
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
