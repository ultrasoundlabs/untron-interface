import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'ms',
  localeName: 'Bahasa Melayu',
  meta: {
    title: 'Untron | Jambatan stablecoin Tron <-> EVM tanpa kustodian',
    description:
      'Bridge USDT dan USDC antara Tron dan rangkaian EVM utama dengan UX tanpa gas, yuran rendah, dan kontrak pintar yang diaudit.',
    keywords:
      'tron bridge, usdt bridge, usdc bridge, tron ke evm, jambatan tanpa kustodian, stablecoin bridge, web3 bridge',
    ogTitle: 'Untron | Jambatan Tron <-> EVM tanpa kustodian',
    ogDescription:
      'Pindahkan stablecoin antara Tron dan rangkaian EVM tanpa bergantung pada bursa berpusat.',
    twitterTitle: 'Untron | Jambatan stablecoin Tron <-> EVM',
    twitterDescription:
      'UX tanpa gas, yuran rendah, dan reka bentuk kepercayaan minimum untuk memindahkan USDT dan USDC antara rangkaian.',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'Langkau ke kandungan utama',
    productsLabel: 'Produk',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'Integrasi',
    sectionsLabel: 'Seksyen',
    sectionHowItWorks: 'Cara ia berfungsi',
    sectionFees: 'Yuran',
    sectionSecurity: 'Keselamatan',
    sectionFaq: 'FAQ',
    openApp: 'Buka aplikasi',
    languageLabel: 'Bahasa',
    toggleThemeLabel: 'Tukar tema',
  },
  hero: {
    eyebrow: 'Jambatan stablecoin tanpa kustodian',
    title: 'Pindahkan USDT dan USDC antara Tron dan rangkaian EVM tanpa risiko bursa.',
    description:
      'Hantar stablecoin dari Tron ke Ethereum, Arbitrum, Base, dan rangkaian EVM lain dalam beberapa minit.',
    supportingLine:
      'Tiada akaun CEX. Tiada serahan kustodian. Laluan jelas dan pelaksanaan yang boleh dijangka.',
    routePreviewLabel: 'Pratonton laluan',
    routeSourceLabel: 'Dari',
    routeDestinationLabel: 'Ke',
    swapSendLabel: 'Anda hantar',
    swapReceiveLabel: 'Anda terima',
    swapFlipLabel: 'Tukar arah',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'Mendapatkan sebut harga langsung...',
    swapQuoteReady: 'Sebut harga dikemas kini',
    swapQuoteError: 'Tidak dapat memuatkan sebut harga',
    swapRateLabel: 'Kadar',
    swapFeeLabel: 'Yuran bridge',
    swapOpenBridgeLabel: 'Buka di Bridge',
    primaryCta: 'Mula bridging',
    secondaryCta: 'Lihat perbandingan yuran',
    pickerBackLabel: 'Kembali',
    pickerCloseLabel: 'Tutup pemilih',
    highlightsLabel: 'Sorotan',
  },
  stats: [
    { value: '0 kustodian', label: 'Anda kekal mengawal wallet dari mula hingga akhir' },
    { value: 'UX tanpa gas', label: 'Tidak perlu pramuat TRX atau ETH untuk laluan yang disokong' },
    { value: 'Diaudit', label: 'Kontrak disemak dan diaudit oleh pihak ketiga' },
  ],
  audiences: {
    title: 'Dibina untuk aliran stablecoin sebenar',
    subtitle:
      'Pemindahan, pengimbangan semula kecairan, dan integrasi produk menggunakan aliran ringkas yang sama.',
    cards: [
      {
        label: 'Pengguna',
        title: 'Bridge dari mana-mana bursa atau wallet',
        description: 'Pindahkan stablecoin merentas rangkaian tanpa bertukar banyak aplikasi atau token gas.',
        ctaLabel: 'Buka bridge',
        ctaHref: 'https://bridge.untron.finance',
      },
      {
        label: 'Perniagaan',
        title: 'Imbang semula kecairan pada kelajuan pasaran',
        description:
          'Pindahkan jumlah besar antara Tron dan EVM dengan kurang kebergantungan berbanding infrastruktur CEX.',
        ctaLabel: 'Hubungi kami',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'Pembangun',
        title: 'Integrasi dengan satu API + satu panggilan kontrak',
        description:
          'Guna API hos atau hos sendiri. Dibina untuk pembayaran dan produk treasury onchain.',
        ctaLabel: 'Baca docs',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'Cara ia berfungsi',
    subtitle: 'Tiga langkah dari rangkaian sumber ke rangkaian destinasi.',
    steps: [
      {
        title: '1. Pilih laluan dan jumlah',
        description: 'Pilih sumber, destinasi, dan jumlah. Anda akan lihat sebut harga sebelum pelaksanaan.',
      },
      {
        title: '2. Hantar sekali dari wallet anda',
        description:
          'Sahkan sekali. Untron mengesahkan keadaan onchain dan menjalankan aliran penyelesaian.',
      },
      {
        title: '3. Terima di rangkaian destinasi',
        description: 'Dana masuk ke wallet destinasi dengan status jelas tanpa langkah kustodian tersembunyi.',
      },
    ],
  },
  fees: {
    title: 'Ringkasan yuran',
    subtitle: 'Perbandingan anggaran untuk bridging $100. Sebut harga langsung sentiasa diutamakan.',
    amountLabel: 'Contoh laluan $100',
    columns: {
      service: 'Perkhidmatan',
      received: 'Jumlah diterima',
      notes: 'Nota',
    },
    rows: [
      {
        service: 'Untron',
        received: '$99.90',
        notes: 'Aliran tanpa kustodian, routing dioptimumkan',
        isUntron: true,
      },
      {
        service: 'FixedFloat',
        received: '$98.50',
        notes: 'Model bursa berpusat',
      },
      {
        service: 'ChangeNOW',
        received: '$98.50',
        notes: 'Model bursa berpusat',
      },
      {
        service: 'Symbiosis',
        received: '$94.00',
        notes: 'Overhed gas kontrak tambahan di sisi Tron',
      },
      {
        service: 'Bridgers',
        received: '$94.00',
        notes: 'Overhed gas kontrak tambahan di sisi Tron',
      },
    ],
    footnote:
      'Angka ini hanya contoh arah, bukan janji. Semak sebut harga langsung dalam bridge sebelum menghantar.',
    focusTitle: 'Kelebihan pelaksanaan',
    focusBullets: [
      'Tanpa kustodian secara reka bentuk',
      'UX bridge dioptimumkan untuk geseran rendah',
      'Penyelesaian rentas rantai dengan status jelas',
      'Tidak bergantung pada akaun dan infrastruktur berpusat',
    ],
    focusCta: 'Buka sebut harga langsung',
  },
  chains: {
    title: 'Aset dan rangkaian disokong',
    subtitle: 'Liputan stablecoin, rangkaian, dan titik masuk wallet.',
    stablecoinsLabel: 'Stablecoin',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'Rangkaian',
    networkCountSuffix: 'chain aktif',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'dan lagi'],
    walletsLabel: 'Mana-mana wallet',
    exchangesLabel: 'Mana-mana bursa',
    moreLabel: 'dan lagi',
    walletsNote: 'Menyokong deep links dan wallet pelayar untuk aliran sambungan yang lancar.',
  },
  security: {
    title: 'Keselamatan',
    subtitle: 'Logik penyelesaian berpandukan keadaan onchain, bukan budi bicara operator.',
    bullets: [
      'Seni bina tanpa kustodian dengan wallet dikawal pengguna.',
      'Kontrak diaudit oleh pihak ketiga untuk laluan teras protokol.',
      'Reka bentuk kepercayaan minimum berasaskan data Tron sebagai sumber kebenaran.',
    ],
    ctaLabel: 'Baca nota keselamatan teknikal',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'Perlu akaun bursa berpusat?',
        answer:
          'Tidak. Untron dibina untuk bridging terus dari wallet antara rangkaian, tanpa melalui akaun CEX.',
      },
      {
        question: 'Perlu KYC?',
        answer:
          'Protokol sendiri tidak memerlukan KYC kerana ia tanpa kustodian. Sila semak keperluan pematuhan tempatan.',
      },
      {
        question: 'Perlu TRX atau ETH untuk mula?',
        answer:
          'Laluan disokong dioptimumkan untuk UX tanpa gas, jadi pramuat token gas selalunya tidak diperlukan.',
      },
      {
        question: 'Boleh bridge jumlah besar seperti treasury?',
        answer:
          'Boleh. Perniagaan menggunakan Untron untuk aliran pengimbangan semula besar. Semak sebut harga langsung dan had laluan sebelum melaksanakan saiz.',
      },
    ],
  },
  finalCta: {
    title: 'Sedia untuk bridge?',
    description:
      'Buka aplikasi untuk dapatkan sebut harga langsung dan pindahkan stablecoin antara Tron dan rangkaian EVM sekarang.',
    buttonLabel: 'Buka Bridge App',
  },
  footer: {
    tagline: 'Kecairan stablecoin merentas rangkaian, tanpa serahan kustodian.',
    legal: 'Hak cipta terpelihara.',
    linksLabel: 'Pautan pantas',
    terms: 'Terma',
    privacy: 'Privasi',
    docs: 'Docs',
    contact: 'Hubungi',
    socialLabel: 'Sosial',
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
