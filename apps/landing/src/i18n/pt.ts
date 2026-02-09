import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'pt',
  localeName: 'Português',
  meta: {
    title: 'Untron | Ponte de stablecoins Tron <-> EVM sem custódia',
    description:
      'Transfira USDT e USDC entre Tron e as principais redes EVM com UX sem gás, taxas baixas e contratos auditados.',
    keywords:
      'ponte tron, bridge usdt, bridge usdc, tron para evm, ponte sem custódia, ponte de stablecoins, web3 bridge',
    ogTitle: 'Untron | Ponte Tron <-> EVM sem custódia',
    ogDescription:
      'Movimente stablecoins entre Tron e redes EVM sem depender de exchanges centralizadas.',
    twitterTitle: 'Untron | Ponte de stablecoins Tron <-> EVM',
    twitterDescription:
      'UX sem gás, taxas baixas e design com confiança minimizada para mover USDT e USDC entre redes.',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'Saltar para o conteúdo principal',
    productsLabel: 'Produtos',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'Integrar',
    sectionsLabel: 'Seções',
    sectionHowItWorks: 'Como funciona',
    sectionFees: 'Taxas',
    sectionSecurity: 'Segurança',
    sectionFaq: 'FAQ',
    openApp: 'Abrir o app',
    languageLabel: 'Idioma',
    toggleThemeLabel: 'Alternar tema de cor',
  },
  hero: {
    eyebrow: 'Ponte de stablecoins sem custódia',
    title: 'Movimente USDT e USDC entre Tron e redes EVM sem risco de corretora.',
    description:
      'Envie stablecoins da rede Tron para Ethereum, Arbitrum, Base e outras redes EVM em minutos.',
    supportingLine:
      'Sem conta em CEX. Sem transferência de custódia. Rotas claras e execução previsível.',
    routePreviewLabel: 'Prévia da rota',
    routeSourceLabel: 'De',
    routeDestinationLabel: 'Para',
    swapSendLabel: 'Você envia',
    swapReceiveLabel: 'Você recebe',
    swapFlipLabel: 'Inverter direção',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'Obtendo cotação ao vivo...',
    swapQuoteReady: 'Cotação atualizada',
    swapQuoteError: 'Não foi possível carregar a cotação',
    swapRateLabel: 'Taxa',
    swapFeeLabel: 'Taxa da ponte',
    swapOpenBridgeLabel: 'Abrir no Bridge',
    primaryCta: 'Começar a transferir',
    secondaryCta: 'Ver comparação de taxas',
    pickerBackLabel: 'Voltar',
    pickerCloseLabel: 'Fechar seletor',
    highlightsLabel: 'Destaques',
  },
  stats: [
    { value: '0 custódia', label: 'Você mantém o controle da carteira do início ao fim' },
    { value: 'UX sem gás', label: 'Sem precisar carregar TRX ou ETH nas rotas compatíveis' },
    { value: 'Auditado', label: 'Contratos revisados e auditados por terceiros' },
  ],
  audiences: {
    title: 'Feito para fluxos reais de stablecoins',
    subtitle:
      'Transferências, rebalanceamento de liquidez e integrações usam o mesmo fluxo simples.',
    cards: [
      {
        label: 'Usuários',
        title: 'Faça bridge a partir de qualquer exchange ou carteira',
        description:
          'Movimente stablecoins entre redes sem alternar entre apps ou tokens de gás.',
        ctaLabel: 'Abrir bridge',
        ctaHref: 'https://bridge.untron.finance',
      },
      {
        label: 'Empresas',
        title: 'Rebalanceie liquidez na velocidade do mercado',
        description:
          'Mova volume entre Tron e EVM com menos dependências do que a infraestrutura de CEX.',
        ctaLabel: 'Fale conosco',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'Desenvolvedores',
        title: 'Integre com uma API + uma chamada de contrato',
        description:
          'Use a API hospedada ou hospede você mesmo. Feito para pagamentos e produtos de tesouraria onchain.',
        ctaLabel: 'Ler documentação',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'Como funciona',
    subtitle: 'Três passos da rede de origem até a rede de destino.',
    steps: [
      {
        title: '1. Escolha rota e valor',
        description:
          'Selecione origem, destino e valor. Você vê a cotação antes de executar.',
      },
      {
        title: '2. Envie uma única vez da sua carteira',
        description:
          'Confirme uma vez. Untron valida o estado onchain e executa o fluxo de liquidação.',
      },
      {
        title: '3. Receba na rede de destino',
        description:
          'Os fundos chegam à carteira de destino com status claro e sem etapa oculta de custódia.',
      },
    ],
  },
  fees: {
    title: 'Resumo de taxas',
    subtitle:
      'Comparação aproximada para transferir $100. Cotações ao vivo sempre têm prioridade.',
    amountLabel: 'Exemplo de rota ($100)',
    columns: {
      service: 'Serviço',
      received: 'Valor recebido',
      notes: 'Notas',
    },
    rows: [
      {
        service: 'Untron',
        received: '$99.90',
        notes: 'Fluxo sem custódia, roteamento otimizado',
        isUntron: true,
      },
      {
        service: 'FixedFloat',
        received: '$98.50',
        notes: 'Modelo de exchange centralizada',
      },
      {
        service: 'ChangeNOW',
        received: '$98.50',
        notes: 'Modelo de exchange centralizada',
      },
      {
        service: 'Symbiosis',
        received: '$94.00',
        notes: 'Sobrecusto de gás do contrato no lado Tron',
      },
      {
        service: 'Bridgers',
        received: '$94.00',
        notes: 'Sobrecusto de gás do contrato no lado Tron',
      },
    ],
    footnote:
      'Os números são exemplos direcionais, não uma promessa. Verifique a cotação ao vivo no bridge antes de enviar.',
    focusTitle: 'Vantagens de execução',
    focusBullets: [
      'Sem custódia por design',
      'UX da ponte otimizada para baixa fricção',
      'Liquidação cross-chain com status claro',
      'Sem depender de infraestrutura de contas centralizadas',
    ],
    focusCta: 'Abrir cotação ao vivo',
  },
  chains: {
    title: 'Ativos e redes suportados',
    subtitle: 'Cobertura de stablecoins, redes e pontos de entrada de carteira.',
    stablecoinsLabel: 'Stablecoins',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'Redes',
    networkCountSuffix: 'redes ativas',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'e mais'],
    walletsLabel: 'Qualquer carteira',
    exchangesLabel: 'Qualquer exchange',
    moreLabel: 'e mais',
    walletsNote: 'Deep links e carteiras de navegador suportados para um fluxo de conexão suave.',
  },
  security: {
    title: 'Postura de segurança',
    subtitle: 'A liquidação é ancorada no estado onchain, não na discrição de operadores.',
    bullets: [
      'Arquitetura sem custódia com carteiras controladas pelo usuário.',
      'Contratos auditados por terceiros para os caminhos centrais do protocolo.',
      'Design com confiança minimizada, ancorado em dados da Tron como fonte de verdade.',
    ],
    ctaLabel: 'Ler notas técnicas de segurança',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'Preciso de uma conta em exchange centralizada?',
        answer:
          'Não. Untron foi feita para transferir entre redes direto da carteira, sem passar por uma conta de CEX.',
      },
      {
        question: 'KYC é necessário?',
        answer:
          'O protocolo em si não exige KYC porque é sem custódia. Sempre verifique as exigências de compliance na sua região.',
      },
      {
        question: 'Preciso de TRX ou ETH para começar?',
        answer:
          'Rotas suportadas são otimizadas para UX sem gás, então muitas vezes não é preciso pré-financiar tokens de gás.',
      },
      {
        question: 'Posso transferir valores maiores (tipo tesouraria)?',
        answer:
          'Sim. Empresas usam a Untron para rebalanceamentos maiores. Use cotações ao vivo e limites de rota no app antes de executar volume.',
      },
    ],
  },
  finalCta: {
    title: 'Pronto para fazer a ponte?',
    description:
      'Abra o app para obter uma cotação ao vivo e mover stablecoins entre Tron e redes EVM agora.',
    buttonLabel: 'Abrir Bridge App',
  },
  footer: {
    tagline: 'Liquidez de stablecoins entre redes, sem transferência de custódia.',
    legal: 'Todos os direitos reservados.',
    linksLabel: 'Links rápidos',
    terms: 'Termos',
    privacy: 'Privacidade',
    docs: 'Docs',
    contact: 'Contato',
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
