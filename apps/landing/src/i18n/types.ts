export type LandingLinkSet = {
  bridgeApp: string;
  v3Dashboard: string;
  docs: string;
  securityDocs: string;
  contactEmail: string;
  x: string;
  telegram: string;
  github: string;
};

export type LandingDictionary = {
  localeCode: string;
  localeName: string;
  meta: {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    twitterTitle: string;
    twitterDescription: string;
  };
  nav: {
    brand: string;
    skipToContentLabel: string;
    productsLabel: string;
    productBridge: string;
    productV3: string;
    productIntegrate: string;
    sectionsLabel: string;
    sectionHowItWorks: string;
    sectionFees: string;
    sectionSecurity: string;
    sectionFaq: string;
    openApp: string;
    languageLabel: string;
    toggleThemeLabel: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    supportingLine: string;
    routePreviewLabel: string;
    routeSourceLabel: string;
    routeDestinationLabel: string;
    swapSendLabel: string;
    swapReceiveLabel: string;
    swapFlipLabel: string;
    swapMaxLabel: string;
    swapQuoteLoading: string;
    swapQuoteReady: string;
    swapQuoteError: string;
    swapRateLabel: string;
    swapFeeLabel: string;
    swapOpenBridgeLabel: string;
    primaryCta: string;
    secondaryCta: string;
    pickerBackLabel: string;
    pickerCloseLabel: string;
    highlightsLabel: string;
  };
  stats: ReadonlyArray<{
    value: string;
    label: string;
  }>;
  audiences: {
    title: string;
    subtitle: string;
    cards: ReadonlyArray<{
      label: string;
      title: string;
      description: string;
      ctaLabel: string;
      ctaHref: string;
    }>;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: ReadonlyArray<{
      title: string;
      description: string;
    }>;
  };
  fees: {
    title: string;
    subtitle: string;
    amountLabel: string;
    columns: {
      service: string;
      received: string;
      notes: string;
    };
    rows: ReadonlyArray<{
      service: string;
      received: string;
      notes: string;
      isUntron?: boolean;
    }>;
    footnote: string;
    focusTitle: string;
    focusBullets: ReadonlyArray<string>;
    focusCta: string;
  };
  chains: {
    title: string;
    subtitle: string;
    stablecoinsLabel: string;
    stablecoins: ReadonlyArray<string>;
    networksLabel: string;
    networkCountSuffix: string;
    networks: ReadonlyArray<string>;
    walletsLabel: string;
    exchangesLabel: string;
    moreLabel: string;
    walletsNote: string;
  };
  security: {
    title: string;
    subtitle: string;
    bullets: ReadonlyArray<string>;
    ctaLabel: string;
  };
  faq: {
    title: string;
    items: ReadonlyArray<{
      question: string;
      answer: string;
    }>;
  };
  finalCta: {
    title: string;
    description: string;
    buttonLabel: string;
  };
  footer: {
    tagline: string;
    legal: string;
    linksLabel: string;
    terms: string;
    privacy: string;
    docs: string;
    contact: string;
    socialLabel: string;
  };
  links: LandingLinkSet;
};
