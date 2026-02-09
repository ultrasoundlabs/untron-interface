import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'id',
  localeName: 'Bahasa Indonesia',
  meta: {
    title: 'Untron | Bridge Stablecoin Tron <-> EVM Non-kustodial',
    description:
      'Bridge USDT dan USDC antara Tron dan chain EVM utama dengan UX tanpa gas, biaya rendah, dan smart contract yang diaudit.',
    keywords:
      'bridge tron, bridge usdt, bridge usdc, tron ke evm, non-kustodial bridge, stablecoin bridge, web3 bridge',
    ogTitle: 'Untron | Bridge Tron <-> EVM Non-kustodial',
    ogDescription:
      'Pindahkan stablecoin antara Tron dan chain EVM tanpa bergantung pada exchange terpusat.',
    twitterTitle: 'Untron | Bridge stablecoin Tron <-> EVM',
    twitterDescription:
      'UX tanpa gas, biaya rendah, dan desain trust-minimized untuk memindahkan USDT dan USDC antar chain.',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'Lewati ke konten utama',
    productsLabel: 'Produk',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'Integrasi',
    sectionsLabel: 'Bagian',
    sectionHowItWorks: 'Cara kerja',
    sectionFees: 'Biaya',
    sectionSecurity: 'Keamanan',
    sectionFaq: 'FAQ',
    openApp: 'Buka aplikasi',
    languageLabel: 'Bahasa',
    toggleThemeLabel: 'Ganti tema',
  },
  hero: {
    eyebrow: 'Bridge stablecoin non-kustodial',
    title: 'Pindahkan USDT dan USDC antara Tron dan chain EVM tanpa risiko exchange.',
    description:
      'Kirim stablecoin dari Tron ke Ethereum, Arbitrum, Base, dan chain EVM lainnya dalam hitungan menit.',
    supportingLine:
      'Tanpa akun CEX. Tanpa penyerahan kustodi. Rute jelas dan eksekusi dapat diprediksi.',
    routePreviewLabel: 'Pratinjau rute',
    routeSourceLabel: 'Dari',
    routeDestinationLabel: 'Ke',
    swapSendLabel: 'Anda kirim',
    swapReceiveLabel: 'Anda terima',
    swapFlipLabel: 'Balik arah',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'Mengambil quote live...',
    swapQuoteReady: 'Quote diperbarui',
    swapQuoteError: 'Gagal memuat quote',
    swapRateLabel: 'Kurs',
    swapFeeLabel: 'Biaya bridge',
    swapOpenBridgeLabel: 'Buka di Bridge',
    primaryCta: 'Mulai bridging',
    secondaryCta: 'Lihat perbandingan biaya',
    pickerBackLabel: 'Kembali',
    pickerCloseLabel: 'Tutup pemilih',
    highlightsLabel: 'Sorotan',
  },
  stats: [
    { value: '0 kustodi', label: 'Anda tetap memegang kendali wallet dari awal sampai akhir' },
    { value: 'UX tanpa gas', label: 'Tidak perlu isi TRX atau ETH di awal untuk rute yang didukung' },
    { value: 'Diaudit', label: 'Kontrak ditinjau dan diverifikasi secara formal' },
  ],
  audiences: {
    title: 'Dibuat untuk alur stablecoin nyata',
    subtitle:
      'Transfer ritel, rebalance likuiditas, dan integrasi produk memakai alur sederhana yang sama.',
    cards: [
      {
        label: 'Pengguna',
        title: 'Bridge dari exchange atau wallet apa pun',
        description: 'Pindahkan stablecoin antar chain tanpa repot ganti aplikasi atau token gas.',
        ctaLabel: 'Buka bridge',
        ctaHref: 'https://bridge.untron.finance',
      },
      {
        label: 'Bisnis',
        title: 'Rebalance likuiditas secepat pasar',
        description: 'Pindahkan volume antara Tron dan EVM dengan lebih sedikit ketergantungan dibanding jalur CEX.',
        ctaLabel: 'Hubungi kami',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'Developer',
        title: 'Integrasi dengan satu API + satu panggilan kontrak',
        description:
          'Gunakan API hosted atau self-host. Dibuat untuk pembayaran dan produk treasury onchain.',
        ctaLabel: 'Baca docs',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'Cara kerja',
    subtitle: 'Tiga langkah dari chain sumber ke chain tujuan.',
    steps: [
      {
        title: '1. Pilih rute dan jumlah',
        description: 'Pilih sumber, tujuan, dan jumlah. Anda dapat quote sebelum eksekusi.',
      },
      {
        title: '2. Kirim sekali dari wallet Anda',
        description: 'Konfirmasi sekali. Untron memvalidasi state onchain dan menjalankan alur settlement.',
      },
      {
        title: '3. Terima di chain tujuan',
        description: 'Dana masuk ke wallet tujuan dengan status yang jelas dan tanpa langkah kustodi tersembunyi.',
      },
    ],
  },
  fees: {
    title: 'Ringkasan biaya',
    subtitle: 'Perbandingan perkiraan untuk bridging $100. Quote live selalu jadi prioritas.',
    amountLabel: 'Contoh rute $100',
    columns: {
      service: 'Layanan',
      received: 'Jumlah diterima',
      notes: 'Catatan',
    },
    rows: [
      {
        service: 'Untron',
        received: '$99.90',
        notes: 'Alur non-kustodial, routing dioptimalkan',
        isUntron: true,
      },
      {
        service: 'FixedFloat',
        received: '$98.50',
        notes: 'Model exchange terpusat',
      },
      {
        service: 'ChangeNOW',
        received: '$98.50',
        notes: 'Model exchange terpusat',
      },
      {
        service: 'Symbiosis',
        received: '$94.00',
        notes: 'Overhead gas kontrak tambahan di sisi Tron',
      },
      {
        service: 'Bridgers',
        received: '$94.00',
        notes: 'Overhead gas kontrak tambahan di sisi Tron',
      },
    ],
    footnote:
      'Angka ini contoh arah, bukan janji. Periksa quote live di bridge sebelum mengirim.',
    focusTitle: 'Keunggulan eksekusi',
    focusBullets: [
      'Non-kustodial sejak awal',
      'UX bridge dioptimalkan agar minim hambatan',
      'Settlement lintas chain dengan status yang jelas',
      'Tanpa bergantung pada jalur akun terpusat',
    ],
    focusCta: 'Buka quote live',
  },
  chains: {
    title: 'Aset dan jaringan yang didukung',
    subtitle: 'Cakupan stablecoin, chain, dan titik masuk wallet.',
    stablecoinsLabel: 'Stablecoin',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'Jaringan',
    networkCountSuffix: 'chain aktif',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'dan lainnya'],
    walletsLabel: 'Wallet apa pun',
    exchangesLabel: 'Exchange apa pun',
    moreLabel: 'dan lainnya',
    walletsNote: 'Mendukung deep link dan wallet browser untuk alur koneksi yang mulus.',
  },
  security: {
    title: 'Keamanan',
    subtitle: 'Logika settlement mengacu pada state onchain, bukan diskresi operator.',
    bullets: [
      'Arsitektur non-kustodial dengan wallet yang dikendalikan pengguna.',
      'Kontrak diaudit dan diverifikasi formal untuk jalur inti protokol.',
      'Desain trust-minimized dengan data Tron sebagai sumber kebenaran.',
    ],
    ctaLabel: 'Baca catatan keamanan teknis',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'Apakah saya perlu akun exchange terpusat?',
        answer:
          'Tidak. Untron dibuat untuk bridging langsung dari wallet antar chain, tanpa melalui akun CEX.',
      },
      {
        question: 'Apakah KYC diperlukan?',
        answer:
          'Protokol tidak mewajibkan KYC karena bersifat non-kustodial. Pastikan kepatuhan sesuai yurisdiksi Anda.',
      },
      {
        question: 'Apakah saya perlu TRX atau ETH untuk mulai?',
        answer:
          'Rute yang didukung dioptimalkan untuk UX tanpa gas, jadi sering kali tidak perlu menyiapkan token gas terlebih dahulu.',
      },
      {
        question: 'Bisa bridging jumlah besar seperti treasury?',
        answer:
          'Bisa. Bisnis memakai Untron untuk rebalance besar. Cek quote live dan limit rute di aplikasi sebelum eksekusi jumlah besar.',
      },
    ],
  },
  finalCta: {
    title: 'Siap bridging?',
    description:
      'Buka aplikasi untuk mendapatkan quote live dan memindahkan stablecoin antara Tron dan chain EVM sekarang juga.',
    buttonLabel: 'Buka Bridge App',
  },
  footer: {
    tagline: 'Likuiditas stablecoin lintas chain, tanpa perpindahan kustodi.',
    legal: 'Hak cipta dilindungi.',
    linksLabel: 'Tautan cepat',
    terms: 'Ketentuan',
    privacy: 'Privasi',
    docs: 'Docs',
    contact: 'Kontak',
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

