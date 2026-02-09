import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'es',
  localeName: 'Español',
  meta: {
    title: 'Untron | Puente de stablecoins sin custodia Tron <-> EVM',
    description:
      'Mueve USDT y USDC entre Tron y redes EVM con una UX sin gas, comisiones bajas y contratos auditados.',
    keywords:
      'puente tron, puente usdt, puente usdc, tron a evm, puente no custodial, stablecoins, web3',
    ogTitle: 'Untron | Puente no custodial Tron <-> EVM',
    ogDescription:
      'Transfiere stablecoins entre Tron y EVM sin depender de exchanges centralizados.',
    twitterTitle: 'Untron | Puente de stablecoins Tron <-> EVM',
    twitterDescription:
      'UX sin gas, comisiones bajas y contratos con confianza minimizada para mover USDT y USDC entre redes.',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'Saltar al contenido principal',
    productsLabel: 'Productos',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'Integrar',
    sectionsLabel: 'Secciones',
    sectionHowItWorks: 'Cómo funciona',
    sectionFees: 'Comisiones',
    sectionSecurity: 'Seguridad',
    sectionFaq: 'FAQ',
    openApp: 'Abrir la app',
    languageLabel: 'Idioma',
    toggleThemeLabel: 'Cambiar tema de color',
  },
  hero: {
    eyebrow: 'Puente no custodial de stablecoins',
    title: 'Mueve USDT y USDC entre Tron y redes EVM sin el riesgo de un exchange.',
    description:
      'Envía stablecoins desde Tron hacia Ethereum, Arbitrum, Base y otras redes EVM en minutos.',
    supportingLine:
      'Sin cuenta en un CEX. Sin entregar custodia. Rutas claras y ejecución predecible.',
    routePreviewLabel: 'Vista de ruta',
    routeSourceLabel: 'Desde',
    routeDestinationLabel: 'Hacia',
    swapSendLabel: 'Envías',
    swapReceiveLabel: 'Recibes',
    swapFlipLabel: 'Invertir dirección',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'Obteniendo cotización en vivo...',
    swapQuoteReady: 'Cotización actualizada',
    swapQuoteError: 'No se pudo cargar la cotización',
    swapRateLabel: 'Tipo de cambio',
    swapFeeLabel: 'Comisión del puente',
    swapOpenBridgeLabel: 'Abrir en Bridge',
    primaryCta: 'Empezar a hacer bridge',
    secondaryCta: 'Ver comparación de comisiones',
    pickerBackLabel: 'Atrás',
    pickerCloseLabel: 'Cerrar selector',
    highlightsLabel: 'Destacados',
  },
  stats: [
    { value: '0 custodia', label: 'Mantienes el control de tu wallet de principio a fin' },
    { value: 'UX sin gas', label: 'Sin precargar TRX o ETH en rutas compatibles' },
    { value: 'Auditado', label: 'Contratos revisados y auditados por terceros' },
  ],
  audiences: {
    title: 'Hecho para flujos reales de stablecoins',
    subtitle:
      'Transferencias, rebalanceo de liquidez e integraciones usan el mismo flujo simple.',
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
        title: 'Rebalancea liquidez a la velocidad del mercado',
        description:
          'Mueve volumen entre Tron y EVM con menos dependencias operativas que la infraestructura de un CEX.',
        ctaLabel: 'Hablar con nosotros',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'Desarrolladores',
        title: 'Integra con una API y una llamada de contrato',
        description:
          'Usa APIs alojadas o autoalojadas. Integración pensada para pagos y tesorería onchain.',
        ctaLabel: 'Leer documentación',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'Cómo funciona',
    subtitle: 'Tres pasos desde la cadena de origen hasta la cadena de destino.',
    steps: [
      {
        title: '1. Elige ruta y monto',
        description: 'Selecciona origen, destino y monto. Ves la cotización antes de ejecutar.',
      },
      {
        title: '2. Envia una vez desde tu wallet',
        description:
          'Confirma una vez. Untron valida el estado onchain y ejecuta el flujo de liquidación.',
      },
      {
        title: '3. Recibe en la cadena destino',
        description: 'Los fondos llegan con estado claro y sin pasos ocultos de custodia.',
      },
    ],
  },
  fees: {
    title: 'Resumen de comisiones',
    subtitle:
      'Comparación aproximada para mover $100. La cotización en vivo siempre es la referencia.',
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
      'Los valores son orientativos, no una promesa. Revisa la cotización en vivo en la app antes de enviar.',
    focusTitle: 'Ventajas de ejecución',
    focusBullets: [
      'Diseño sin custodia',
      'UX del bridge optimizada para baja fricción',
      'Liquidación cross-chain con estado claro',
      'Sin depender de cuentas centralizadas',
    ],
    focusCta: 'Abrir cotización en vivo',
  },
  chains: {
    title: 'Activos y redes compatibles',
    subtitle: 'Cobertura de stablecoins, cadenas y puntos de entrada de wallets.',
    stablecoinsLabel: 'Stablecoins',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'Redes',
    networkCountSuffix: 'redes activas',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'y más'],
    walletsLabel: 'Cualquier wallet',
    exchangesLabel: 'Cualquier exchange',
    moreLabel: 'y más',
    walletsNote: 'Admite deep links y wallets del navegador para una conexión fluida.',
  },
  security: {
    title: 'Postura de seguridad',
    subtitle: 'La liquidación se ancla al estado onchain, no a la discreción del operador.',
    bullets: [
      'Arquitectura no custodial con wallets controladas por el usuario.',
      'Contratos auditados por terceros en rutas centrales del protocolo.',
      'Diseño con confianza minimizada anclado a datos de Tron como fuente de verdad.',
    ],
    ctaLabel: 'Leer notas técnicas de seguridad',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: '¿Necesito una cuenta en un exchange centralizado?',
        answer:
          'No. Untron está hecho para operar directo desde tu wallet entre cadenas, sin pasar por una cuenta de CEX.',
      },
      {
        question: '¿Se requiere KYC?',
        answer:
          'El protocolo no requiere KYC porque es no custodial. Verifica los requisitos en tu jurisdicción.',
      },
      {
        question: '¿Necesito TRX o ETH para empezar?',
        answer:
          'Las rutas compatibles están optimizadas para una UX sin gas, por lo que normalmente no hace falta precargar tokens de gas.',
      },
      {
        question: '¿Puedo mover montos grandes de tesorería?',
        answer:
          'Sí. Empresas usan Untron para rebalanceos de mayor volumen. Revisa cotizaciones y límites en vivo antes de ejecutar.',
      },
    ],
  },
  finalCta: {
    title: '¿Listo para hacer bridge?',
    description:
      'Abre la app para obtener una cotización en vivo y mover stablecoins entre Tron y redes EVM ahora mismo.',
    buttonLabel: 'Abrir Bridge App',
  },
  footer: {
    tagline: 'Liquidez de stablecoins entre cadenas, sin traspaso de custodia.',
    legal: 'Todos los derechos reservados.',
    linksLabel: 'Enlaces rápidos',
    terms: 'Términos',
    privacy: 'Privacidad',
    docs: 'Docs',
    contact: 'Contacto',
    socialLabel: 'Redes',
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
