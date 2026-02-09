import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'th',
  localeName: 'ไทย',
  meta: {
    title: 'Untron | บริดจ์สเตเบิลคอยน์ Tron <-> EVM แบบไม่ฝากทรัพย์',
    description:
      'บริดจ์ USDT และ USDC ระหว่าง Tron กับเชน EVM หลัก ๆ ด้วย UX แบบไม่ต้องจ่ายแก๊ส ค่าธรรมเนียมต่ำ และสัญญาอัจฉริยะที่ผ่านการออดิท',
    keywords:
      'tron bridge, usdt bridge, usdc bridge, tron ไป evm, non-custodial bridge, stablecoin bridge, web3',
    ogTitle: 'Untron | บริดจ์ Tron <-> EVM แบบไม่ฝากทรัพย์',
    ogDescription: 'ย้ายสเตเบิลคอยน์ระหว่าง Tron และเชน EVM โดยไม่ต้องพึ่งเอ็กซ์เชนจ์แบบรวมศูนย์',
    twitterTitle: 'Untron | บริดจ์สเตเบิลคอยน์ Tron <-> EVM',
    twitterDescription:
      'UX แบบไม่ต้องจ่ายแก๊ส ค่าธรรมเนียมต่ำ และดีไซน์แบบลดความเชื่อใจ สำหรับย้าย USDT และ USDC ข้ามเชน',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'ข้ามไปยังเนื้อหาหลัก',
    productsLabel: 'ผลิตภัณฑ์',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'ผสานรวม',
    sectionsLabel: 'ส่วน',
    sectionHowItWorks: 'วิธีทำงาน',
    sectionFees: 'ค่าธรรมเนียม',
    sectionSecurity: 'ความปลอดภัย',
    sectionFaq: 'FAQ',
    openApp: 'เปิดแอป',
    languageLabel: 'ภาษา',
    toggleThemeLabel: 'สลับธีม',
  },
  hero: {
    eyebrow: 'บริดจ์สเตเบิลคอยน์แบบไม่ฝากทรัพย์',
    title: 'ย้าย USDT และ USDC ระหว่าง Tron และเชน EVM ได้โดยไม่ต้องเสี่ยงกับเอ็กซ์เชนจ์',
    description: 'ส่งสเตเบิลคอยน์จาก Tron ไป Ethereum, Arbitrum, Base และเชน EVM อื่น ๆ ได้ภายในไม่กี่นาที',
    supportingLine:
      'ไม่ต้องมีบัญชี CEX. ไม่ต้องส่งมอบการถือครอง. เส้นทางชัดเจนและการทำงานคาดเดาได้.',
    routePreviewLabel: 'พรีวิวเส้นทาง',
    routeSourceLabel: 'จาก',
    routeDestinationLabel: 'ไปยัง',
    swapSendLabel: 'คุณส่ง',
    swapReceiveLabel: 'คุณได้รับ',
    swapFlipLabel: 'สลับทิศทาง',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'กำลังดึงราคาล่าสุด...',
    swapQuoteReady: 'อัปเดตราคาแล้ว',
    swapQuoteError: 'โหลดราคาไม่ได้',
    swapRateLabel: 'อัตรา',
    swapFeeLabel: 'ค่าธรรมเนียมบริดจ์',
    swapOpenBridgeLabel: 'เปิดใน Bridge',
    primaryCta: 'เริ่มบริดจ์',
    secondaryCta: 'ดูเปรียบเทียบค่าธรรมเนียม',
    pickerBackLabel: 'ย้อนกลับ',
    pickerCloseLabel: 'ปิดตัวเลือก',
    highlightsLabel: 'ไฮไลต์',
  },
  stats: [
    { value: '0 ฝากทรัพย์', label: 'คุณควบคุมวอลเล็ทได้ตลอดเส้นทาง' },
    { value: 'UX ไม่ต้องจ่ายแก๊ส', label: 'ไม่ต้องเติม TRX หรือ ETH ล่วงหน้าสำหรับเส้นทางที่รองรับ' },
    { value: 'ผ่านการออดิท', label: 'สัญญาผ่านการตรวจสอบและการยืนยันเชิงรูปแบบ' },
  ],
  audiences: {
    title: 'สร้างมาเพื่อเวิร์กโฟลว์สเตเบิลคอยน์จริง',
    subtitle: 'การโอนเงิน รีบาลานซ์สภาพคล่อง และการอินทิเกรต ใช้โฟลว์เดียวกันที่เรียบง่าย',
    cards: [
      {
        label: 'ผู้ใช้',
        title: 'บริดจ์จากเอ็กซ์เชนจ์หรือวอลเล็ทใดก็ได้',
        description: 'ย้ายสเตเบิลคอยน์ข้ามเชนโดยไม่ต้องสลับหลายแอปหรือเตรียมโทเคนแก๊ส',
        ctaLabel: 'เปิด Bridge',
        ctaHref: 'https://bridge.untron.finance',
      },
      {
        label: 'ธุรกิจ',
        title: 'รีบาลานซ์สภาพคล่องได้ตามความเร็วตลาด',
        description: 'ย้ายขนาดระหว่าง Tron และ EVM ด้วยการพึ่งพาน้อยกว่าช่องทาง CEX',
        ctaLabel: 'ติดต่อเรา',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'นักพัฒนา',
        title: 'อินทิเกรตด้วย API เดียว + เรียกสัญญา 1 ครั้ง',
        description: 'ใช้ API แบบโฮสต์หรือโฮสต์เองก็ได้ สร้างมาเพื่อระบบชำระเงินและคลัง onchain',
        ctaLabel: 'อ่านเอกสาร',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'วิธีทำงาน',
    subtitle: 'สามขั้นตอนจากเชนต้นทางไปยังเชนปลายทาง',
    steps: [
      {
        title: '1. เลือกเส้นทางและจำนวน',
        description: 'เลือกต้นทาง ปลายทาง และจำนวน คุณจะเห็นราคาก่อนทำรายการ',
      },
      {
        title: '2. ส่งครั้งเดียวจากวอลเล็ทของคุณ',
        description: 'ยืนยันครั้งเดียว Untron ตรวจสอบสถานะบนเชนและดำเนินโฟลว์การชำระบัญชี',
      },
      {
        title: '3. รับบนเชนปลายทาง',
        description: 'เงินเข้าวอลเล็ทปลายทางพร้อมสถานะชัดเจน ไม่มีขั้นตอนฝากทรัพย์แฝง',
      },
    ],
  },
  fees: {
    title: 'ภาพรวมค่าธรรมเนียม',
    subtitle: 'เปรียบเทียบคร่าว ๆ สำหรับการบริดจ์ $100 โดยให้ราคาจริงใน Bridge เป็นหลัก',
    amountLabel: 'ตัวอย่างเส้นทาง $100',
    columns: {
      service: 'บริการ',
      received: 'จำนวนที่ได้รับ',
      notes: 'หมายเหตุ',
    },
    rows: [
      {
        service: 'Untron',
        received: '$99.90',
        notes: 'โฟลว์ไม่ฝากทรัพย์ พร้อมการจัดเส้นทางที่เหมาะสม',
        isUntron: true,
      },
      {
        service: 'FixedFloat',
        received: '$98.50',
        notes: 'โมเดลเอ็กซ์เชนจ์แบบรวมศูนย์',
      },
      {
        service: 'ChangeNOW',
        received: '$98.50',
        notes: 'โมเดลเอ็กซ์เชนจ์แบบรวมศูนย์',
      },
      {
        service: 'Symbiosis',
        received: '$94.00',
        notes: 'มีค่าแก๊สสัญญาเพิ่มเติมฝั่ง Tron',
      },
      {
        service: 'Bridgers',
        received: '$94.00',
        notes: 'มีค่าแก๊สสัญญาเพิ่มเติมฝั่ง Tron',
      },
    ],
    footnote: 'ตัวเลขเป็นแนวทาง ไม่ใช่คำรับประกัน ตรวจสอบราคาจริงใน Bridge ก่อนส่งเสมอ',
    focusTitle: 'ข้อได้เปรียบด้านการทำงาน',
    focusBullets: [
      'ไม่ฝากทรัพย์โดยดีไซน์',
      'UX ของบริดจ์ถูกปรับให้ลื่นไหล',
      'ชำระบัญชีข้ามเชนพร้อมสถานะชัดเจน',
      'ไม่พึ่งพาช่องทางบัญชีแบบรวมศูนย์',
    ],
    focusCta: 'เปิดดูราคาจริง',
  },
  chains: {
    title: 'สินทรัพย์และเครือข่ายที่รองรับ',
    subtitle: 'ครอบคลุมสเตเบิลคอยน์ เชน และช่องทางเข้าจากวอลเล็ท',
    stablecoinsLabel: 'สเตเบิลคอยน์',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'เครือข่าย',
    networkCountSuffix: 'เชนที่เปิดใช้งาน',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'และอื่น ๆ'],
    walletsLabel: 'วอลเล็ทใดก็ได้',
    exchangesLabel: 'เอ็กซ์เชนจ์ใดก็ได้',
    moreLabel: 'และอื่น ๆ',
    walletsNote: 'รองรับ deep links และวอลเล็ทบนเบราว์เซอร์สำหรับการเชื่อมต่อที่ราบรื่น',
  },
  security: {
    title: 'ความปลอดภัย',
    subtitle: 'การชำระบัญชียึดกับสถานะบนเชน ไม่ขึ้นกับดุลยพินิจของผู้ให้บริการ',
    bullets: [
      'สถาปัตยกรรมแบบไม่ฝากทรัพย์ โดยผู้ใช้ควบคุมวอลเล็ทเอง',
      'สัญญาผ่านการออดิทและการยืนยันเชิงรูปแบบในเส้นทางหลักของโปรโตคอล',
      'ดีไซน์แบบลดความเชื่อใจ โดยอ้างอิงข้อมูลบน Tron เป็นแหล่งความจริง',
    ],
    ctaLabel: 'อ่านบันทึกความปลอดภัยเชิงเทคนิค',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'ต้องมีบัญชีเอ็กซ์เชนจ์แบบรวมศูนย์ไหม?',
        answer:
          'ไม่ต้อง Untron สร้างมาเพื่อบริดจ์จากวอลเล็ทโดยตรงระหว่างเชน โดยไม่ต้องผ่านบัญชี CEX',
      },
      {
        question: 'ต้องทำ KYC ไหม?',
        answer:
          'โปรโตคอลเองไม่บังคับ KYC เพราะเป็นแบบไม่ฝากทรัพย์ โปรดตรวจสอบข้อกำหนดในพื้นที่ของคุณ',
      },
      {
        question: 'ต้องมี TRX หรือ ETH เพื่อเริ่มไหม?',
        answer:
          'เส้นทางที่รองรับถูกปรับเพื่อ UX แบบไม่ต้องจ่ายแก๊ส จึงมักไม่จำเป็นต้องเติมโทเคนแก๊สล่วงหน้า',
      },
      {
        question: 'บริดจ์จำนวนมากระดับ treasury ได้ไหม?',
        answer:
          'ได้ ธุรกิจใช้ Untron สำหรับการรีบาลานซ์ขนาดใหญ่ ตรวจสอบราคาจริงและลิมิตเส้นทางในแอปก่อนทำรายการ',
      },
    ],
  },
  finalCta: {
    title: 'พร้อมบริดจ์แล้วหรือยัง?',
    description: 'เปิดแอปเพื่อรับราคาจริง และย้ายสเตเบิลคอยน์ระหว่าง Tron และเชน EVM ได้ทันที',
    buttonLabel: 'เปิด Bridge App',
  },
  footer: {
    tagline: 'สภาพคล่องสเตเบิลคอยน์ข้ามเชน โดยไม่ต้องส่งมอบการถือครอง',
    legal: 'สงวนลิขสิทธิ์',
    linksLabel: 'ลิงก์ด่วน',
    terms: 'เงื่อนไข',
    privacy: 'ความเป็นส่วนตัว',
    docs: 'เอกสาร',
    contact: 'ติดต่อ',
    socialLabel: 'โซเชียล',
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
