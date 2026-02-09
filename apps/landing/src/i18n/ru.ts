import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'ru',
  localeName: 'Русский',
  meta: {
    title: 'Untron | Некастодиальный мост стейблкоинов Tron <-> EVM',
    description:
      'Переводите USDT и USDC между Tron и крупными EVM-сетями с UX без газа, низкими комиссиями и аудированными смарт-контрактами.',
    keywords:
      'мост tron, мост usdt, мост usdc, tron в evm, некастодиальный мост, мост стейблкоинов, web3',
    ogTitle: 'Untron | Некастодиальный мост Tron <-> EVM',
    ogDescription:
      'Перемещайте стейблкоины между Tron и EVM-сетями без зависимости от централизованных бирж.',
    twitterTitle: 'Untron | Мост стейблкоинов Tron <-> EVM',
    twitterDescription:
      'UX без газа, низкие комиссии и дизайн с минимальным доверием для перевода USDT и USDC между сетями.',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'Перейти к основному содержимому',
    productsLabel: 'Продукты',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'Интеграция',
    sectionsLabel: 'Разделы',
    sectionHowItWorks: 'Как это работает',
    sectionFees: 'Комиссии',
    sectionSecurity: 'Безопасность',
    sectionFaq: 'FAQ',
    openApp: 'Открыть приложение',
    languageLabel: 'Язык',
    toggleThemeLabel: 'Переключить тему',
  },
  hero: {
    eyebrow: 'Некастодиальный мост стейблкоинов',
    title: 'Переводите USDT и USDC между Tron и EVM-сетями без рисков биржи.',
    description:
      'Отправляйте стейблкоины из Tron в Ethereum, Arbitrum, Base и другие EVM-сети за минуты.',
    supportingLine:
      'Без аккаунта на CEX. Без передачи кастодии. Прозрачные маршруты и предсказуемое исполнение.',
    routePreviewLabel: 'Предпросмотр маршрута',
    routeSourceLabel: 'Из',
    routeDestinationLabel: 'В',
    swapSendLabel: 'Вы отправляете',
    swapReceiveLabel: 'Вы получаете',
    swapFlipLabel: 'Сменить направление',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'Получаем актуальную котировку...',
    swapQuoteReady: 'Котировка обновлена',
    swapQuoteError: 'Не удалось загрузить котировку',
    swapRateLabel: 'Курс',
    swapFeeLabel: 'Комиссия моста',
    swapOpenBridgeLabel: 'Открыть в Bridge',
    primaryCta: 'Начать перевод',
    secondaryCta: 'Сравнить комиссии',
    pickerBackLabel: 'Назад',
    pickerCloseLabel: 'Закрыть выбор',
    highlightsLabel: 'Ключевые моменты',
  },
  stats: [
    { value: '0 кастодии', label: 'Вы сохраняете контроль над кошельком от начала до конца' },
    { value: 'UX без газа', label: 'Не нужно заранее пополнять TRX или ETH для поддерживаемых маршрутов' },
    { value: 'Аудировано', label: 'Контракты проверены и формально верифицированы' },
  ],
  audiences: {
    title: 'Создано для реальных сценариев со стейблкоинами',
    subtitle:
      'Переводы, ребалансировка ликвидности и интеграции используют один простой поток.',
    cards: [
      {
        label: 'Пользователи',
        title: 'Перевод из любого кошелька или биржи',
        description: 'Перемещайте стейблкоины между сетями без лишних приложений и токенов газа.',
        ctaLabel: 'Открыть bridge',
        ctaHref: 'https://bridge.untron.finance',
      },
      {
        label: 'Бизнес',
        title: 'Ребалансируйте ликвидность на скорости рынка',
        description: 'Перемещайте объём между Tron и EVM с меньшими зависимостями, чем у CEX-рейлов.',
        ctaLabel: 'Связаться',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'Разработчики',
        title: 'Интеграция: один API + один вызов контракта',
        description:
          'Используйте облачный API или разворачивайте самостоятельно. Для платежей и ончейн-казначейства.',
        ctaLabel: 'Документация',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'Как это работает',
    subtitle: 'Три шага от сети-источника до сети назначения.',
    steps: [
      {
        title: '1. Выберите маршрут и сумму',
        description: 'Выберите источник, назначение и сумму. Котировка показывается до выполнения.',
      },
      {
        title: '2. Подтвердите один раз в кошельке',
        description: 'Одно подтверждение. Untron проверяет состояние сети и выполняет расчёт.',
      },
      {
        title: '3. Получите средства в сети назначения',
        description:
          'Средства приходят на кошелёк назначения с понятным статусом и без скрытой кастодии.',
      },
    ],
  },
  fees: {
    title: 'Снимок комиссий',
    subtitle: 'Примерное сравнение для перевода $100. Актуальная котировка всегда важнее.',
    amountLabel: 'Пример маршрута на $100',
    columns: {
      service: 'Сервис',
      received: 'Полученная сумма',
      notes: 'Примечания',
    },
    rows: [
      {
        service: 'Untron',
        received: '$99.90',
        notes: 'Некастодиальный поток, оптимизированный роутинг',
        isUntron: true,
      },
      {
        service: 'FixedFloat',
        received: '$98.50',
        notes: 'Модель централизованной биржи',
      },
      {
        service: 'ChangeNOW',
        received: '$98.50',
        notes: 'Модель централизованной биржи',
      },
      {
        service: 'Symbiosis',
        received: '$94.00',
        notes: 'Дополнительные затраты на gas контрактов на стороне Tron',
      },
      {
        service: 'Bridgers',
        received: '$94.00',
        notes: 'Дополнительные затраты на gas контрактов на стороне Tron',
      },
    ],
    footnote:
      'Числа приведены для ориентира, не обещание. Перед отправкой проверьте живую котировку в bridge.',
    focusTitle: 'Преимущества исполнения',
    focusBullets: [
      'Некастодиально по дизайну',
      'UX моста с минимальной фрикцией',
      'Кроссчейн-расчёт с прозрачным статусом',
      'Без зависимости от централизованных аккаунтных рейлов',
    ],
    focusCta: 'Открыть живую котировку',
  },
  chains: {
    title: 'Поддерживаемые активы и сети',
    subtitle: 'Покрытие стейблкоинов, сетей и точек входа из кошельков.',
    stablecoinsLabel: 'Стейблкоины',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'Сети',
    networkCountSuffix: 'сетей онлайн',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'и другое'],
    walletsLabel: 'Любой кошелёк',
    exchangesLabel: 'Любая биржа',
    moreLabel: 'и другое',
    walletsNote: 'Поддерживаются deep link и браузерные кошельки для плавного подключения.',
  },
  security: {
    title: 'Подход к безопасности',
    subtitle: 'Логика расчёта привязана к состоянию сети, а не к решениям оператора.',
    bullets: [
      'Некастодиальная архитектура с кошельками под контролем пользователя.',
      'Аудированные и формально верифицированные контракты для ключевых путей протокола.',
      'Дизайн с минимальным доверием, где данные Tron выступают источником истины.',
    ],
    ctaLabel: 'Технические заметки по безопасности',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'Нужен аккаунт на централизованной бирже?',
        answer:
          'Нет. Untron создан для нативного перевода между сетями из кошелька, без прохождения через аккаунт CEX.',
      },
      {
        question: 'Требуется ли KYC?',
        answer:
          'Сам протокол не требует KYC, потому что он некастодиальный. Проверьте локальные требования по комплаенсу.',
      },
      {
        question: 'Нужны ли TRX или ETH для старта?',
        answer:
          'Поддерживаемые маршруты оптимизированы под UX без газа, поэтому заранее пополнять gas-токены часто не нужно.',
      },
      {
        question: 'Можно ли переводить крупные суммы, как у казначейства?',
        answer:
          'Да. Бизнес использует Untron для крупных ребалансировок. Перед выполнением проверьте живые котировки и лимиты маршрута в приложении.',
      },
    ],
  },
  finalCta: {
    title: 'Готовы сделать bridge?',
    description:
      'Откройте приложение, получите живую котировку и переведите стейблкоины между Tron и EVM-сетями прямо сейчас.',
    buttonLabel: 'Открыть Bridge App',
  },
  footer: {
    tagline: 'Ликвидность стейблкоинов между сетями без передачи кастодии.',
    legal: 'Все права защищены.',
    linksLabel: 'Быстрые ссылки',
    terms: 'Условия',
    privacy: 'Конфиденциальность',
    docs: 'Docs',
    contact: 'Контакты',
    socialLabel: 'Соцсети',
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
