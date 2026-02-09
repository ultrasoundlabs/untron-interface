import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'es',
  localeName: 'Español',
  meta: {
    title: 'Untron | Puente no custodial de stablecoins Tron <-> EVM',
    description:
      'Mueve USDT y USDC entre Tron y cadenas EVM con experiencia sin gas, comisiones bajas y contratos auditados.',
    keywords:
      'puente tron, puente usdt, puente usdc, tron a evm, puente no custodial, stablecoins, web3',
    ogTitle: 'Untron | Puente no custodial Tron <-> EVM',
    ogDescription:
      'Transfiere stablecoins entre Tron y EVM sin depender de exchanges centralizados.',
    twitterTitle: 'Untron | Puente de stablecoins Tron <-> EVM',
    twitterDescription:
      'UX sin gas, comisiones bajas y contratos minimizados en confianza para USDT y USDC.',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'Saltar al contenido principal',
    productsLabel: 'Productos',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'Integrar',
    sectionsLabel: 'Secciones',
    sectionHowItWorks: 'Como funciona',
    sectionFees: 'Comisiones',
    sectionSecurity: 'Seguridad',
    sectionFaq: 'FAQ',
    openApp: 'Abrir app',
    languageLabel: 'Idioma',
    toggleThemeLabel: 'Cambiar tema',
  },
  hero: {
    eyebrow: 'Puente no custodial de stablecoins',
    title: 'Mueve USDT y USDC entre Tron y cadenas EVM sin riesgo de exchange.',
    description:
      'Envia stablecoins desde Tron hacia Ethereum, Arbitrum, Base y otras redes EVM en minutos.',
    supportingLine: 'Sin cuenta en CEX. Sin ceder custodia. Rutas claras y ejecucion predecible.',
    routePreviewLabel: 'Vista de ruta',
    routeSourceLabel: 'Desde',
    routeDestinationLabel: 'Hacia',
    swapSendLabel: 'Envias',
    swapReceiveLabel: 'Recibes',
    swapFlipLabel: 'Invertir direccion',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'Obteniendo cotizacion en vivo...',
    swapQuoteReady: 'Cotizacion actualizada',
    swapQuoteError: 'No se pudo cargar la cotizacion',
    swapRateLabel: 'Tipo de cambio',
    swapFeeLabel: 'Comision del bridge',
    swapOpenBridgeLabel: 'Abrir en Bridge',
    primaryCta: 'Empezar bridge',
    secondaryCta: 'Ver comparacion de comisiones',
    pickerBackLabel: 'Atras',
    pickerCloseLabel: 'Cerrar selector',
    highlightsLabel: 'Destacados',
  },
  stats: [
    { value: '0 custodia', label: 'Mantienes control de la wallet de principio a fin' },
    { value: 'UX sin gas', label: 'Sin precargar TRX o ETH en rutas compatibles' },
    { value: 'Auditado', label: 'Contratos revisados y verificados formalmente' },
  ],
  audiences: {
    title: 'Hecho para flujos reales de stablecoins',
    subtitle:
      'Pagos minoristas, rebalanceo de liquidez e integraciones usan el mismo flujo simple.',
    cards: [
      {
        label: 'Usuarios',
        title: 'Bridge desde cualquier exchange o wallet',
        description:
          'Mueve stablecoins entre cadenas sin depender de varias apps ni tokens de gas.',
        ctaLabel: 'Abrir bridge',
        ctaHref: 'https://bridge.untron.finance',
      },
      {
        label: 'Empresas',
        title: 'Rebalancea liquidez a velocidad de mercado',
        description:
          'Mueve volumen entre Tron y EVM con menos dependencias operativas que vias CEX.',
        ctaLabel: 'Hablar con nosotros',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'Desarrolladores',
        title: 'Integra con una API y una llamada de contrato',
        description:
          'Usa APIs alojadas o autoalojadas. Integracion pensada para pagos y tesoreria onchain.',
        ctaLabel: 'Leer docs',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'Como funciona',
    subtitle: 'Tres pasos desde la cadena origen hasta la cadena destino.',
    steps: [
      {
        title: '1. Elige ruta y monto',
        description: 'Selecciona origen, destino y monto. Ves cotizacion antes de ejecutar.',
      },
      {
        title: '2. Envia una vez desde tu wallet',
        description: 'Confirma una vez. Untron valida estado onchain y ejecuta el flujo.',
      },
      {
        title: '3. Recibe en la cadena destino',
        description: 'Los fondos llegan con estado claro y sin pasos ocultos de custodia.',
      },
    ],
  },
  fees: {
    title: 'Resumen de comisiones',
    subtitle: 'Comparacion aproximada para mover $100. La cotizacion en vivo siempre manda.',
    amountLabel: 'Ejemplo de ruta por $100',
    columns: {
      service: 'Servicio',
      received: 'Monto recibido',
      notes: 'Notas',
    },
    rows: [
      {
        service: 'Untron',
        received: '$99.90',
        notes: 'Flujo no custodial con ruteo optimizado',
        isUntron: true,
      },
      {
        service: 'FixedFloat',
        received: '$98.50',
        notes: 'Modelo de exchange centralizado',
      },
      {
        service: 'ChangeNOW',
        received: '$98.50',
        notes: 'Modelo de exchange centralizado',
      },
      {
        service: 'Symbiosis',
        received: '$94.00',
        notes: 'Mayor costo por gas de contrato en Tron',
      },
      {
        service: 'Bridgers',
        received: '$94.00',
        notes: 'Mayor costo por gas de contrato en Tron',
      },
    ],
    footnote:
      'Los valores son orientativos y no una promesa. Revisa la cotizacion en vivo en la app antes de enviar.',
    focusTitle: 'Ventajas de ejecucion',
    focusBullets: [
      'Diseno no custodial',
      'UX de bridge optimizada para baja friccion',
      'Liquidacion cross-chain con estado claro',
      'Sin depender de cuentas en rieles centralizados',
    ],
    focusCta: 'Abrir cotizacion en vivo',
  },
  chains: {
    title: 'Activos y redes compatibles',
    subtitle: 'Cobertura de stablecoins, cadenas y puntos de entrada de wallets.',
    stablecoinsLabel: 'Stablecoins',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'Redes',
    networkCountSuffix: 'cadenas activas',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'y mas'],
    walletsLabel: 'Cualquier wallet',
    exchangesLabel: 'Cualquier exchange',
    moreLabel: 'y mas',
    walletsNote: 'Soporte para deep links y wallets de navegador con conexion fluida.',
  },
  security: {
    title: 'Postura de seguridad',
    subtitle: 'La liquidacion se ancla al estado onchain, no a la discrecion de operadores.',
    bullets: [
      'Arquitectura no custodial con wallets controladas por el usuario.',
      'Contratos auditados y verificados formalmente en rutas centrales del protocolo.',
      'Diseno minimizado en confianza anclado a datos de Tron como fuente de verdad.',
    ],
    ctaLabel: 'Leer notas tecnicas de seguridad',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'Necesito cuenta en un exchange centralizado?',
        answer:
          'No. Untron esta hecho para operar directo desde wallet entre cadenas, sin pasar por una cuenta de CEX.',
      },
      {
        question: 'Se requiere KYC?',
        answer:
          'El protocolo no requiere KYC porque es no custodial. Siempre verifica requisitos regulatorios en tu jurisdiccion.',
      },
      {
        question: 'Necesito TRX o ETH para empezar?',
        answer:
          'Las rutas compatibles estan optimizadas para UX sin gas, por lo que normalmente no hace falta precargar tokens de gas.',
      },
      {
        question: 'Puedo mover montos grandes de tesoreria?',
        answer:
          'Si. Empresas usan Untron para rebalanceo de mayor volumen. Revisa cotizacion y limites en vivo antes de ejecutar.',
      },
    ],
  },
  finalCta: {
    title: 'Listo para hacer bridge?',
    description:
      'Abre la app para obtener una cotizacion en vivo y mover stablecoins entre Tron y cadenas EVM ahora mismo.',
    buttonLabel: 'Abrir Bridge App',
  },
  footer: {
    tagline: 'Liquidez de stablecoins entre cadenas, sin traspaso de custodia.',
    legal: 'Todos los derechos reservados.',
    linksLabel: 'Enlaces rapidos',
    terms: 'Terminos',
    privacy: 'Privacidad',
    docs: 'Docs',
    contact: 'Contacto',
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
