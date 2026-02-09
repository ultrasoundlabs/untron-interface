import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'uk',
  localeName: 'Українська',
  meta: {
    title: 'Untron | Некостодіальний міст стейблкоїнів Tron <-> EVM',
    description:
      'Переміщуйте USDT та USDC між Tron і основними EVM-мережами з UX без поповнення газу наперед, низькими комісіями та аудитованими смартконтрактами.',
    keywords:
      'міст tron, міст usdt, міст usdc, tron до evm, некостодіальний міст, міст стейблкоїнів, web3',
    ogTitle: 'Untron | Некостодіальний міст Tron <-> EVM',
    ogDescription:
      'Переносьте стейблкоїни між Tron та EVM-мережами без залежності від централізованих бірж.',
    twitterTitle: 'Untron | Міст стейблкоїнів Tron <-> EVM',
    twitterDescription:
      'UX без газу, низькі комісії та дизайн з мінімальною довірою для переказу USDT і USDC між мережами.',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'Перейти до основного вмісту',
    productsLabel: 'Продукти',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'Інтеграція',
    sectionsLabel: 'Розділи',
    sectionHowItWorks: 'Як це працює',
    sectionFees: 'Комісії',
    sectionSecurity: 'Безпека',
    sectionFaq: 'FAQ',
    openApp: 'Відкрити застосунок',
    languageLabel: 'Мова',
    toggleThemeLabel: 'Перемкнути тему',
  },
  hero: {
    eyebrow: 'Некостодіальний міст стейблкоїнів',
    title: 'Переміщуйте USDT і USDC між Tron та EVM-мережами без ризику біржі.',
    description:
      'Надсилайте стейблкоїни з Tron до Ethereum, Arbitrum, Base та інших EVM-мереж за хвилини.',
    supportingLine:
      'Без акаунта на CEX. Без передачі кастодії. Прозорі маршрути та передбачуване виконання.',
    routePreviewLabel: 'Перегляд маршруту',
    routeSourceLabel: 'З',
    routeDestinationLabel: 'До',
    swapSendLabel: 'Ви надсилаєте',
    swapReceiveLabel: 'Ви отримуєте',
    swapFlipLabel: 'Змінити напрям',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'Отримуємо актуальне котирування...',
    swapQuoteReady: 'Котирування оновлено',
    swapQuoteError: 'Не вдалося завантажити котирування',
    swapRateLabel: 'Курс',
    swapFeeLabel: 'Комісія мосту',
    swapOpenBridgeLabel: 'Відкрити в Bridge',
    primaryCta: 'Почати',
    secondaryCta: 'Порівняти комісії',
    pickerBackLabel: 'Назад',
    pickerCloseLabel: 'Закрити вибір',
    highlightsLabel: 'Основне',
  },
  stats: [
    { value: '0 кастодії', label: 'Ви контролюєте гаманець від початку до кінця' },
    { value: 'UX без газу', label: 'Без поповнення TRX чи ETH наперед для підтримуваних маршрутів' },
    { value: 'Аудитовано', label: 'Контракти перевірені та пройшли незалежний аудит' },
  ],
  audiences: {
    title: 'Для реальних сценаріїв зі стейблкоїнами',
    subtitle:
      'Перекази, ребалансування ліквідності та інтеграції використовують один простий процес.',
    cards: [
      {
        label: 'Користувачі',
        title: 'Переказ з будь-якої біржі або гаманця',
        description:
          'Переміщуйте стейблкоїни між мережами без зайвих застосунків і токенів газу.',
        ctaLabel: 'Відкрити Bridge',
        ctaHref: 'https://bridge.untron.finance',
      },
      {
        label: 'Бізнес',
        title: 'Ребалансуйте ліквідність зі швидкістю ринку',
        description:
          'Переміщуйте обсяги між Tron та EVM з меншими залежностями, ніж у переказах через CEX.',
        ctaLabel: 'Написати нам',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'Розробники',
        title: 'Інтеграція: один API + один виклик контракту',
        description:
          'Використовуйте хмарний API або розгортайте самостійно. Для платежів і ончейн-скарбниць.',
        ctaLabel: 'Читати документацію',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'Як це працює',
    subtitle: 'Три кроки від мережі-джерела до мережі-призначення.',
    steps: [
      {
        title: '1. Оберіть маршрут і суму',
        description:
          'Оберіть джерело, призначення та суму. Котирування видно ще до виконання.',
      },
      {
        title: '2. Підтвердіть один раз у гаманці',
        description:
          'Одне підтвердження. Untron перевіряє ончейн-стан і запускає процес розрахунку.',
      },
      {
        title: '3. Отримайте в мережі призначення',
        description:
          'Кошти надходять на гаманець призначення з прозорим статусом і без прихованої кастодії.',
      },
    ],
  },
  fees: {
    title: 'Огляд комісій',
    subtitle: 'Приблизне порівняння для переказу $100. Живі котирування завжди важливіші.',
    amountLabel: 'Приклад маршруту на $100',
    columns: {
      service: 'Сервіс',
      received: 'Отримана сума',
      notes: 'Примітки',
    },
    rows: [
      {
        service: 'Untron',
        received: '$99.90',
        notes: 'Некостодіальний процес, оптимізований роутинг',
        isUntron: true,
      },
      {
        service: 'FixedFloat',
        received: '$98.50',
        notes: 'Модель централізованої біржі',
      },
      {
        service: 'ChangeNOW',
        received: '$98.50',
        notes: 'Модель централізованої біржі',
      },
      {
        service: 'Symbiosis',
        received: '$94.00',
        notes: 'Додаткові витрати газу контракту на стороні Tron',
      },
      {
        service: 'Bridgers',
        received: '$94.00',
        notes: 'Додаткові витрати газу контракту на стороні Tron',
      },
    ],
    footnote:
      'Цифри наведені для орієнтиру, не обіцянка. Перед відправкою перевірте живе котирування у Bridge.',
    focusTitle: 'Переваги виконання',
    focusBullets: [
      'Некостодіально за задумом',
      'UX мосту оптимізований для мінімальної фрикції',
      'Кросчейн-розрахунок з прозорим статусом',
      'Без залежності від централізованих акаунтів та їхньої інфраструктури',
    ],
    focusCta: 'Відкрити живе котирування',
  },
  chains: {
    title: 'Підтримувані активи та мережі',
    subtitle: 'Покриття стейблкоїнів, мереж і точок входу з гаманців.',
    stablecoinsLabel: 'Стейблкоїни',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'Мережі',
    networkCountSuffix: 'мереж онлайн',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'та більше'],
    walletsLabel: 'Будь-який гаманець',
    exchangesLabel: 'Будь-яка біржа',
    moreLabel: 'та більше',
    walletsNote: 'Підтримуються deep links та браузерні гаманці для плавного підключення.',
  },
  security: {
    title: 'Безпека',
    subtitle: 'Логіка розрахунку привʼязана до ончейн-стану, а не до рішення оператора.',
    bullets: [
      'Некостодіальна архітектура з гаманцями під контролем користувача.',
      'Контракти для ключових шляхів протоколу пройшли незалежний аудит.',
      'Дизайн з мінімальною довірою, де дані Tron є джерелом істини.',
    ],
    ctaLabel: 'Технічні нотатки з безпеки',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'Потрібен акаунт на централізованій біржі?',
        answer:
          'Ні. Untron створений для переказів між мережами напряму з гаманця, без проходження через CEX-акаунт.',
      },
      {
        question: 'Потрібен KYC?',
        answer:
          'Сам протокол не вимагає KYC, бо він некостодіальний. Перевірте локальні вимоги комплаєнсу у вашій юрисдикції.',
      },
      {
        question: 'Потрібні TRX або ETH для старту?',
        answer:
          'Підтримувані маршрути оптимізовані під UX без газу, тож попереднє поповнення газ-токенів часто не потрібне.',
      },
      {
        question: 'Чи можна переказувати великі суми (казначейські)?',
        answer:
          'Так. Бізнес використовує Untron для великих ребалансів. Перед виконанням перевірте живі котирування та ліміти маршруту в застосунку.',
      },
    ],
  },
  finalCta: {
    title: 'Готові до переказу?',
    description:
      'Відкрийте застосунок, отримайте живе котирування та перемістіть стейблкоїни між Tron і EVM-мережами вже зараз.',
    buttonLabel: 'Відкрити Bridge App',
  },
  footer: {
    tagline: 'Ліквідність стейблкоїнів між мережами без передачі кастодії.',
    legal: 'Усі права захищені.',
    linksLabel: 'Швидкі посилання',
    terms: 'Умови',
    privacy: 'Конфіденційність',
    docs: 'Docs',
    contact: 'Контакти',
    socialLabel: 'Соцмережі',
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
