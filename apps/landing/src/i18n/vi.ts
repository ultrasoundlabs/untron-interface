import type { LandingDictionary } from './types';

export const landing: LandingDictionary = {
  localeCode: 'vi',
  localeName: 'Tiếng Việt',
  meta: {
    title: 'Untron | Cầu nối stablecoin Tron <-> EVM phi lưu ký',
    description:
      'Bridge USDT và USDC giữa Tron và các chuỗi EVM lớn với UX không cần gas, phí thấp và hợp đồng đã kiểm toán.',
    keywords:
      'tron bridge, usdt bridge, usdc bridge, tron sang evm, cầu nối phi lưu ký, stablecoin bridge, web3',
    ogTitle: 'Untron | Cầu nối Tron <-> EVM phi lưu ký',
    ogDescription:
      'Chuyển stablecoin giữa Tron và các chuỗi EVM mà không cần phụ thuộc vào sàn giao dịch tập trung.',
    twitterTitle: 'Untron | Cầu nối stablecoin Tron <-> EVM',
    twitterDescription:
      'UX không cần gas, phí thấp và thiết kế giảm tin cậy để chuyển USDT và USDC giữa các chuỗi.',
  },
  nav: {
    brand: 'Untron',
    skipToContentLabel: 'Chuyển tới nội dung chính',
    productsLabel: 'Sản phẩm',
    productBridge: 'Bridge',
    productV3: 'V3',
    productIntegrate: 'Tích hợp',
    sectionsLabel: 'Mục',
    sectionHowItWorks: 'Cách hoạt động',
    sectionFees: 'Phí',
    sectionSecurity: 'Bảo mật',
    sectionFaq: 'FAQ',
    openApp: 'Mở ứng dụng',
    languageLabel: 'Ngôn ngữ',
    toggleThemeLabel: 'Chuyển chủ đề',
  },
  hero: {
    eyebrow: 'Cầu nối stablecoin phi lưu ký',
    title: 'Chuyển USDT và USDC giữa Tron và các chuỗi EVM mà không phải chịu rủi ro sàn giao dịch.',
    description:
      'Gửi stablecoin từ Tron sang Ethereum, Arbitrum, Base và các chuỗi EVM khác chỉ trong vài phút.',
    supportingLine: 'Không cần tài khoản CEX. Không bàn giao lưu ký. Tuyến rõ ràng, thực thi dễ dự đoán.',
    routePreviewLabel: 'Xem trước tuyến',
    routeSourceLabel: 'Từ',
    routeDestinationLabel: 'Đến',
    swapSendLabel: 'Bạn gửi',
    swapReceiveLabel: 'Bạn nhận',
    swapFlipLabel: 'Đảo chiều',
    swapMaxLabel: 'MAX',
    swapQuoteLoading: 'Đang lấy báo giá trực tiếp...',
    swapQuoteReady: 'Báo giá đã cập nhật',
    swapQuoteError: 'Không thể tải báo giá',
    swapRateLabel: 'Tỷ giá',
    swapFeeLabel: 'Phí bridge',
    swapOpenBridgeLabel: 'Mở trong Bridge',
    primaryCta: 'Bắt đầu bridge',
    secondaryCta: 'Xem so sánh phí',
    pickerBackLabel: 'Quay lại',
    pickerCloseLabel: 'Đóng bộ chọn',
    highlightsLabel: 'Điểm nổi bật',
  },
  stats: [
    { value: '0 lưu ký', label: 'Bạn kiểm soát ví từ đầu đến cuối' },
    { value: 'UX không cần gas', label: 'Không cần nạp trước TRX hoặc ETH cho các tuyến được hỗ trợ' },
    { value: 'Đã kiểm toán', label: 'Hợp đồng được rà soát và xác minh hình thức' },
  ],
  audiences: {
    title: 'Xây dựng cho các luồng stablecoin thực tế',
    subtitle: 'Chuyển khoản, cân bằng thanh khoản và tích hợp sản phẩm đều theo cùng một luồng đơn giản.',
    cards: [
      {
        label: 'Người dùng',
        title: 'Bridge từ bất kỳ sàn hoặc ví nào',
        description: 'Chuyển stablecoin giữa các chuỗi mà không cần đổi nhiều ứng dụng hay token gas.',
        ctaLabel: 'Mở bridge',
        ctaHref: 'https://bridge.untron.finance',
      },
      {
        label: 'Doanh nghiệp',
        title: 'Cân bằng thanh khoản theo tốc độ thị trường',
        description: 'Chuyển khối lượng giữa Tron và EVM với ít phụ thuộc hơn so với kênh CEX.',
        ctaLabel: 'Liên hệ',
        ctaHref: 'mailto:contact@untron.finance',
      },
      {
        label: 'Lập trình viên',
        title: 'Tích hợp với một API + một lần gọi hợp đồng',
        description: 'Dùng API hosted hoặc tự triển khai. Phù hợp cho thanh toán và kho quỹ onchain.',
        ctaLabel: 'Đọc tài liệu',
        ctaHref: 'https://docs.untron.finance',
      },
    ],
  },
  howItWorks: {
    title: 'Cách hoạt động',
    subtitle: 'Ba bước từ chuỗi nguồn đến chuỗi đích.',
    steps: [
      {
        title: '1. Chọn tuyến và số lượng',
        description: 'Chọn nguồn, đích và số lượng. Bạn nhận báo giá trước khi thực thi.',
      },
      {
        title: '2. Xác nhận một lần trong ví',
        description: 'Chỉ cần một lần xác nhận. Untron kiểm tra trạng thái onchain và chạy luồng thanh toán.',
      },
      {
        title: '3. Nhận ở chuỗi đích',
        description: 'Tiền vào ví đích với trạng thái rõ ràng, không có bước lưu ký ẩn.',
      },
    ],
  },
  fees: {
    title: 'Tóm tắt phí',
    subtitle: 'So sánh ước tính cho giao dịch $100. Báo giá trực tiếp luôn được ưu tiên.',
    amountLabel: 'Ví dụ tuyến $100',
    columns: {
      service: 'Dịch vụ',
      received: 'Số tiền nhận',
      notes: 'Ghi chú',
    },
    rows: [
      {
        service: 'Untron',
        received: '$99.90',
        notes: 'Luồng phi lưu ký, định tuyến tối ưu',
        isUntron: true,
      },
      {
        service: 'FixedFloat',
        received: '$98.50',
        notes: 'Mô hình sàn tập trung',
      },
      {
        service: 'ChangeNOW',
        received: '$98.50',
        notes: 'Mô hình sàn tập trung',
      },
      {
        service: 'Symbiosis',
        received: '$94.00',
        notes: 'Chi phí gas hợp đồng bổ sung phía Tron',
      },
      {
        service: 'Bridgers',
        received: '$94.00',
        notes: 'Chi phí gas hợp đồng bổ sung phía Tron',
      },
    ],
    footnote:
      'Các số liệu chỉ mang tính tham khảo, không phải cam kết. Hãy kiểm tra báo giá trực tiếp trong bridge trước khi gửi.',
    focusTitle: 'Lợi thế thực thi',
    focusBullets: [
      'Phi lưu ký ngay từ thiết kế',
      'UX bridge tối ưu để giảm ma sát',
      'Thanh toán cross-chain với trạng thái rõ ràng',
      'Không phụ thuộc vào kênh tài khoản tập trung',
    ],
    focusCta: 'Mở báo giá trực tiếp',
  },
  chains: {
    title: 'Tài sản và mạng được hỗ trợ',
    subtitle: 'Phủ stablecoin, chain và điểm vào từ ví.',
    stablecoinsLabel: 'Stablecoin',
    stablecoins: ['USDT', 'USDC'],
    networksLabel: 'Mạng',
    networkCountSuffix: 'chain đang hoạt động',
    networks: ['Tron', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'và hơn nữa'],
    walletsLabel: 'Bất kỳ ví nào',
    exchangesLabel: 'Bất kỳ sàn nào',
    moreLabel: 'và hơn nữa',
    walletsNote: 'Hỗ trợ deep link và ví trình duyệt để kết nối mượt mà.',
  },
  security: {
    title: 'Bảo mật',
    subtitle: 'Logic thanh toán bám theo trạng thái onchain thay vì tùy ý vận hành.',
    bullets: [
      'Kiến trúc phi lưu ký với ví do người dùng kiểm soát.',
      'Hợp đồng được kiểm toán và xác minh hình thức cho các luồng cốt lõi.',
      'Thiết kế giảm tin cậy, neo theo dữ liệu Tron làm nguồn sự thật.',
    ],
    ctaLabel: 'Đọc ghi chú bảo mật kỹ thuật',
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'Tôi có cần tài khoản sàn tập trung không?',
        answer:
          'Không. Untron được xây dựng để bridge trực tiếp từ ví giữa các chuỗi, không cần đi qua tài khoản CEX.',
      },
      {
        question: 'Có cần KYC không?',
        answer:
          'Giao thức không yêu cầu KYC vì là phi lưu ký. Hãy kiểm tra yêu cầu tuân thủ tại khu vực của bạn.',
      },
      {
        question: 'Tôi có cần TRX hoặc ETH để bắt đầu không?',
        answer:
          'Các tuyến được hỗ trợ tối ưu cho UX không cần gas, nên thường không cần chuẩn bị trước token gas mạng.',
      },
      {
        question: 'Tôi có thể bridge số tiền lớn kiểu treasury không?',
        answer:
          'Có. Doanh nghiệp dùng Untron cho các luồng cân bằng lớn. Hãy xem báo giá trực tiếp và giới hạn tuyến trong ứng dụng trước khi thực thi.',
      },
    ],
  },
  finalCta: {
    title: 'Sẵn sàng bridge?',
    description:
      'Mở ứng dụng để nhận báo giá trực tiếp và chuyển stablecoin giữa Tron và các chuỗi EVM ngay bây giờ.',
    buttonLabel: 'Mở Bridge App',
  },
  footer: {
    tagline: 'Thanh khoản stablecoin xuyên chain, không bàn giao lưu ký.',
    legal: 'Đã đăng ký bản quyền.',
    linksLabel: 'Liên kết nhanh',
    terms: 'Điều khoản',
    privacy: 'Quyền riêng tư',
    docs: 'Tài liệu',
    contact: 'Liên hệ',
    socialLabel: 'Mạng xã hội',
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

