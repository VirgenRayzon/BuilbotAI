import {
  Truck,
  Building2,
  Award,
  Cpu,
  Store,
  ShieldCheck,
  Headphones,
  type LucideIcon,
} from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  category: string;
  icon: LucideIcon;
  questions: FAQItem[];
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "shipping-amp-delivery",
    category: "Shipping & Delivery",
    icon: Truck,
    questions: [
      {
        question: "Does Netcodex ship nationwide?",
        answer: "Absolutely. We provide nationwide fulfillment across Luzon, Visayas, and Mindanao. From our strategic logistics hub in Quezon City, we partner with trusted carriers like LBC for provincial orders and offer Same-Day Delivery (via Grab or Lalamove) for Metro Manila. We have successfully delivered high-end rigs to thousands of locations—check our Reviews Page to see proof of our safe deliveries to provinces near you.",
      },
      {
        question: "How do you ensure my Custom PC doesn't break during shipping to the province?",
        answer: "We treat every PC build as if we were shipping it to ourselves. For nationwide orders, especially those going to Visayas and Mindanao, we use a multi-layer protection standard. For builds with heavy graphics cards or air coolers, we use internal supportive packing material inside the case to prevent component sag or breakage. You can see photos of our securely packed rigs arriving in pristine condition on our Reviews Page .",
      },
      {
        question: "How long does shipping take, and how can I track my order?",
        answer: "Metro Manila express deliveries typically arrive same-day or within 24 hours of build completion. Provincial shipments via LBC generally arrive within 3–5 business days for Luzon and 5–7 business days for Visayas and Mindanao. Once dispatched, full courier tracking details are provided, and registered users can track live progress in their Profile.",
      },
    ],
  },
  {
    id: "about-our-store",
    category: "About Netcodex & Authenticity",
    icon: Building2,
    questions: [
      {
        question: "Is Netcodex a legitimate computer and technology retailer in the Philippines?",
        answer: "Yes. Netcodex Computer Center is operated by Netcodex Inc., a SEC-registered Philippine corporation and an authorized reseller of major global technology brands. We have successfully shipped thousands of orders to satisfied customers across Luzon, Visayas, and Mindanao. While the company was formally established in 2020, our roots run much deeper. Today, Netcodex operates as an online-first technology platform designed to serve customers nationwide , while maintaining a physical showroom in Quezon City. Our founder has been a trusted member of the Filipino PC community since the late 90s, maintaining a verified 100% positive feedback record on TipidPC since 2007 (user: nievz) and contributing to the global enthusiast community Overclock.net since 2011 . You don't have to take our word for it—we invite you to check our 100+ 5-star Google Reviews , where clients share photos of their custom rigs and their unboxing experiences. Our physical showroom in Quezon City stands as a testament to our commitment to transparency, accountability, and premium technical service in the Philippine tech community.",
      },
      {
        question: "Where is Netcodex located, and can I visit?",
        answer: "Netcodex is located at the heart of Quezon City at 35G Liberty Avenue, corner 9th Ave, Socorro, Cubao, 1109 Metro Manila . Our store is highly accessible via public transport, situated near both LRT and MRT stations, with major landmarks like SM Cubao and SM Hypermarket Cubao just a few blocks away. We are open daily from 10:00 AM to 7:00 PM (Monday to Sunday). Unlike standard \"pickup-only\" counters, Netcodex features a full retail showroom where customers can personally view our wide selection of PC components, high-performance GPUs, and gaming peripherals on display. While we operate as an online-first retailer to provide nationwide reach and competitive pricing, our physical shop serves as a premium hub where you can browse shelves, consult face-to-face with our expert technicians , or personally test a system before taking it home.",
      },
      {
        question: "Can I see real customer builds and delivery photos?",
        answer: "Yes. You can visit our Reviews Page to see real customer feedback, actual build photos, and documented deliveries nationwide . These include completed systems, securely packed units, and rigs delivered across Luzon, Visayas, and Mindanao.",
      },
      {
        question: "How do I know I’m communicating with Netcodex safely?",
        answer: "To protect our customers, Netcodex communicates only through our official contact channels listed on our Contact Page , including our official website, verified Facebook Page , and authorized Viber Marketplace account . Be cautious of messages coming from look-alike domains, misspellings, or unofficial accounts claiming to represent Netcodex. We will never ask for your passwords, one-time PINs (OTP), card details, or login credentials via chat, email, or social media. Payment instructions, including GCash , are provided only after checkout and are sent through our official website or our verified Netcodex staff accounts linked on the Contact Page . Any payment request coming from accounts not listed on our Contact Page, or messages that feel rushed or inconsistent with our normal process, should be treated with caution. When in doubt, we recommend verifying directly with us through our official channels before proceeding.",
      },
      {
        question: "Is netcodex.ph verified safe by independent website-security scanners?",
        answer: "Yes. Netcodex.ph is regularly checked by independent, third-party website trust and safety scanners, and consistently comes back clean. You can verify this yourself: ScamAdviser Trust Score for netcodex.ph — an independent site-trust checker used to screen unfamiliar online stores. Scam Detector Validator review for netcodex.ph — a separate third-party site-validation service. We encourage cautious shoppers to run these checks themselves before ordering, alongside reading our real customer reviews and delivery photos .",
      },
    ],
  },
  {
    id: "why-buy-from-us",
    category: "Why Choose Netcodex & Pricing",
    icon: Award,
    questions: [
      {
        question: "Why should I choose Netcodex over traditional retail stores?",
        answer: "Netcodex bridges the gap between the competitive pricing of traditional tech hubs like Gilmore and the convenience of a modern, online-first platform. Unlike standard retail, we offer an Advanced Custom PC Builder with built-in compatibility logic to ensure your parts work perfectly together. Furthermore, every custom build is handled by technicians with decades of experience in professional cable management and stress testing. This means you get premium service without waiting days for a reply.",
      },
      {
        question: "How does Netcodex ensure I’m getting the lowest prices for my budget PC build without the need to canvass other stores?",
        answer: "Yes, we guarantee the best total value nationwide. At Netcodex, we have engineered our online-first model to eliminate the need for exhausting \"canvassing\" trips to physical tech hubs. Whether you are in Metro Manila or provincial areas, we ensure you get the best deal through three core pillars: Daily Market Monitoring: We track Philippine retail and online prices daily to ensure our budget gaming and office builds are priced at the absolute competitive edge. Price Match Guarantee: If you find a lower price for an identical, in-stock item from another legitimate local retailer, we will do our best to match or beat it. Zero Hidden Fees &amp; Nationwide Logistics: Unlike many retailers, our prices include professional assembly, OS installation, and stress testing. We also utilize specialized, insured couriers to ensure your build arrives safely anywhere in the Philippines, saving you the risk and cost of personal transport. By shopping with us, you get \"Gilmore-level\" pricing (or better) combined with the convenience of a secured online platform and full official warranties—protections that \"cheap\" grey-market sellers simply cannot provide. Ready to build from anywhere? Use our Online PC Configurator to see real-time pricing and start your build today.",
      },
      {
        question: "Why should I buy from Netcodex instead of other online marketplaces?",
        answer: "We distinguish ourselves as a dedicated technology hub rather than a general marketplace. This focus ensures Guaranteed Authenticity , meaning every item is 100% brand new and backed by an official manufacturer’s warranty—no grey market risks. We don't just move boxes; we utilize Expert Curation to ensure components work seamlessly together. Most importantly, when you message us, you talk to real technicians who understand your needs, not an automated script. Our AI Build Assistant is there if you want a quick starting build, but every chat and every order is handled by people.",
      },
      {
        question: "Do you build systems for businesses, professionals, or home use?",
        answer: "Yes. Netcodex builds systems not only for gamers, but also for businesses, professionals, students, and home users . We assemble PCs for work-from-home setups, homeschooling, content creation, engineering, streaming, and productivity-focused workloads. Beyond system units, we also supply related equipment such as streaming gear, large-format displays, professional peripherals, and high-performance GPUs for AI and compute workloads , with component selection focused on reliability, stability, and long-term use.",
      },
      {
        question: "Do you offer price matching?",
        answer: "Yes. We work hard to give you the best deals! If you find the same item locally, in stock, and at a lower price from another legitimate retailer, message us. We will review it and try our best to match or even beat it so you can enjoy the best value with Netcodex’s premium support.",
      },
      {
        question: "Why do prices change frequently, and can I lock in a quote?",
        answer: "Component pricing—particularly for RAM and SSDs—can fluctuate due to global supply and market conditions. To protect our customers from sudden price changes, Netcodex quotes are valid for up to 24 hours . Prices are locked in once payment is completed within this period . For custom builds, securing key components early helps ensure pricing stability and availability.",
      },
      {
        question: "Do you reserve items before payment?",
        answer: "All orders and quotations are reviewed by our team before processing. Items are officially reserved once payment is completed within the quote validity period . This ensures pricing accuracy and availability while protecting customers from sudden stock or market changes.",
      },
      {
        question: "Are prices subject to change?",
        answer: "Yes. All prices are subject to change without prior notice due to supply availability, manufacturer pricing adjustments, and global market conditions. However, once an order or quotation is confirmed within its validity period, the agreed price is locked in.",
      },
      {
        question: "How many products does Netcodex offer?",
        answer: "Netcodex is a comprehensive tech hub offering thousands of SKUs . Our catalog covers everything from high-end PC components and professional workstations to laptops, printers, home entertainment, and hard-to-find enthusiast parts. Whether you are building a budget office PC or a liquid-cooled gaming rig, we are designed to be your one-stop shop.",
      },
      {
        question: "Can Netcodex help me find specific or hard-to-find components?",
        answer: "Yes. Because we carry thousands of SKUs and maintain deep relationships with official suppliers, we specialize in sourcing components that are often out of stock at traditional retail outlets. If you don't see a specific part on our website, you can reach out to our Live Chat for assistance.",
      },
      {
        question: "Do you cater to corporate clients, BPOs, and SMEs?",
        answer: "Yes. Netcodex supports not only gamers and home users, but also corporate clients, BPOs, and small-to-medium enterprises (SMEs) that require reliable computing infrastructure. Our team brings over 20 years of enterprise IT leadership experience , including environments where system reliability and uptime are critical. We apply disciplined deployment practices based on ITIL® service management principles , ensuring stable, well-documented systems rather than ad-hoc setups. Whether you need high-density workstations for BPO operations, stable office PCs for SMEs, or performance systems for content creators and engineers , Netcodex focuses on reliability, scalability, and long-term support.",
      },
    ],
  },
  {
    id: "building-your-dream-pc",
    category: "Custom PC Building & AI Assistant",
    icon: Cpu,
    questions: [
      {
        question: "What is the AI Build Assistant?",
        answer: "It’s a free tool at the top of our Custom PC Builder . Tell it your budget (₱15,000 to ₱500,000) and what the PC is for: gaming, gaming and streaming, video and photo editing, 3D rendering and CAD, AI and development, or office and school. For gaming you can also say what you play: esports titles, big AAA games, or both. In seconds it fills the builder with a complete, compatible build at today’s prices and tells you why, for example how much of the budget went to the graphics card and the reason. You can switch between Best Value, Balanced and Max Performance versions, swap any part, and check out as usual. No account is needed, and with an account you can save your builds.",
      },
      {
        question: "Can I trust the parts the AI Build Assistant picks?",
        answer: "Every part comes with a one-line reason, such as whether the case fits the graphics card or how much power the build needs.. Next to your build it also shows other options when they make sense: an upgrade if a little more money gives a clear gain, a cheaper version, a full-brand build, and a “Built to last” version that puts budget into a faster processor and a bigger power supply, ready for a future graphics card. Nothing changes unless you pick one.",
      },
      {
        question: "Can I fine-tune what the AI Build Assistant picks?",
        answer: "Yes. In the AI Build Assistant , choose AMD or Intel for the processor, and under More options pick your screen (1080p, 1440p or 4K), graphics brand (NVIDIA, AMD or Intel), a black, white or RGB look, air or liquid cooling, an all-MSI, ASUS or GIGABYTE build, the size of the PC (standard, compact or Mini-ITX) and built-in Wi-Fi.",
      },
      {
        question: "Can it build an all-MSI, ASUS or GIGABYTE PC?",
        answer: "Yes. Choose Brand build under More options: the motherboard and graphics card come from that brand, and the case, cooler, power supply and SSD follow when the brand has one that fits. It can also show a full-brand version with every part we carry from that brand, with how much more it costs.",
      },
      {
        question: "I already have some parts. Can the AI Build Assistant work around them?",
        answer: "Yes. Under “I already have”, tick your graphics card, SSD, or case and power supply. They are left out of the build, your whole budget goes to the other parts, and those parts are sized to fit what you have. If you keep your own case, set Size to match it.",
      },
      {
        question: "Can it also pick a monitor, keyboard, chair and other extras?",
        answer: "Yes. Under “Also pick for me”, tick a monitor, monitor bracket, case fans, keyboard, mouse, mousepad, printer, chair or headset. They come out of the same budget and are matched to what the PC is for, like a 1440p high refresh rate monitor for a 1440p gaming build. When a keyboard and mouse set costs less than buying them apart, it picks the set.",
      },
      {
        question: "Can I save my build or get a second opinion?",
        answer: "Yes. Every AI build has a build code. Tap Ask our builders to send it to our team for a second look, or save it to My Saved Builds (with an account) and come back to it later. Try it on our Custom PC Builder .",
      },
      {
        question: "I’m new to PC building. Can you help me choose the right parts?",
        answer: "Absolutely. The quickest start is our AI Build Assistant on the Custom PC Builder : enter your budget and what the PC is for, and it fills in a compatible build for you. If you would rather talk it through, our team is here too. We can look over your build, suggest changes, or put a list together with you for 1080p gaming, video editing, heavy rendering or anything else. Chat with us via the Live Chat on this page or visit our Contact Page .",
      },
      {
        question: "How do I know if the parts I want are compatible?",
        answer: "Use our Custom PC Builder . As you pick parts yourself, it keeps your processor, motherboard and RAM matched by socket and memory type. For a full check, use the AI Build Assistant : it also checks that the graphics card and cooler fit the case and that the power supply covers the whole build. Every custom order is also reviewed by our technical team before processing.",
      },
      {
        question: "Do you build the PC for me?",
        answer: "Yes, and we offer this labor completely free of charge with no hidden build fees ! If you order a complete system unit, our experienced technicians will professionally assemble, cable-manage, and stress-test your rig before shipping. We ensure it is \"plug-and-play\" ready when it arrives at your doorstep, so you can enjoy a professionally built system without the hassle or the extra cost.",
      },
      {
        question: "What happens after I place an order?",
        answer: "Once your order is placed, our team verifies and confirms your payment. After confirmation, the items for your order are officially reserved and your build is scheduled for assembly as soon as possible. For custom PC orders, our technicians assemble and test the system, then send you actual photos of the completed build before shipping. For parts-only orders, photos can be provided upon request. Once ready, we arrange shipment to your selected address or notify you if the order is available for in-store pickup. Throughout the process, you are welcome to message us anytime for the latest status of your order or build.",
      },
      {
        question: "Do you test the PC before shipping it out?",
        answer: "Absolutely. We believe in a strict \"no surprises\" policy. We don't just build your PC; we stress-test it to ensure stability, thermal performance, and manufacturing quality. Before any custom rig leaves our Quezon City facility, we send you actual photos of the completed build and the successful test results , so you can see exactly what is coming your way before we pack it. We verify that the CPU, GPU, and RAM are performing within optimal limits to prevent \"Blue Screens of Death\" upon arrival, ensuring your system is ready for gaming or creating the moment you unbox it. If you ever encounter issues after delivery, our technical team remains available to assist you even after the PC is in your hands.",
      },
      {
        question: "Does my PC come with pre-installed software or bloatware?",
        answer: "We believe your PC belongs to you, not to advertisers. If you purchase a Windows license or request a trial installation, we perform a \"Clean Install.\" This means we set up the necessary drivers for your specific hardware to ensure stability, but we strictly do not install bloatware, unnecessary trial antivirus programs, or junk apps that slow down your system. You get a pure, optimized environment that is ready for gaming or productivity the moment you press the power button.",
      },
    ],
  },
  {
    id: "store-pickup-and-fulfillment",
    category: "Store Pickup & Stock Allocation",
    icon: Store,
    questions: [
      {
        question: "I’m visiting the shop today, are all the items listed online available for immediate walk-in purchase?",
        answer: "While we keep our most popular items on-hand, our full catalog is managed through an extensive supply network. Also some items are on order basis from suppliers. To ensure the item you want is ready when you arrive, always inquire for stock availability first before your visit. If an item is not currently on the shelf, we can arrange a Priority Stock Allocation to have it ready at the shop for you.",
      },
      {
        question: "Why do I need a downpayment for items in your online warehouse?",
        answer: "As an online-first store, we maintain a vast inventory across our Central Supply Network rather than keeping every item on display at our physical branch. When you request an item that isn't currently on-hand at our physical shop, we require a down payment to: Secure Your Unit: This guarantees the stock is reserved exclusively for you and removed from our online inventory. Initiate Fulfillment: Please note that the down payment serves as a Security Deposit to guarantee your unit and initiate its priority transfer to the shop. Since this credit is used to reserve a specific unit exclusively for you, it is non-refundable for changes of mind or cancellations once the stock has been successfully allocated.",
      },
      {
        question: "What is your refund policy for stock allocations?",
        answer: "We offer a 100% full refund if your requested item becomes unavailable within our supply network or is found to have a manufacturer defect upon inspection at our store. Please note that the down payment serves as a Security Deposit to guarantee your unit and initiate its priority transfer to the shop. Since this credit is used to reserve a specific unit exclusively for you, it is non-refundable for changes of mind or cancellations once the stock has been successfully allocated.",
      },
    ],
  },
  {
    id: "payments-warranty-amp-returns",
    category: "Payments, Warranty & Returns",
    icon: ShieldCheck,
    questions: [
      {
        question: "What payment and installment options are available?",
        answer: "We provide a fully secured, SSL-encrypted checkout experience. We support various payment methods including Bank Transfers, Credit Cards, GCash, and PayPal. For those looking to build now and pay later, we offer flexible installment plans through Home Credit, BillEase, and major credit cards (including JCB).",
      },
      {
        question: "How secure is my personal data, account, and payment information on Netcodex?",
        answer: "At Netcodex, your privacy and digital security are our top priorities. We utilize a multi-layered, enterprise-grade security stack to ensure your information is strictly protected from the moment you create an account to your final checkout: Advanced Account Protection: Your account, login, and registration data are safeguarded by Cloudflare Turnstile . This modern, invisible security layer blocks malicious bots, spam, and unauthorized login attempts without interrupting your shopping experience with frustrating visual puzzles. Encrypted &amp; Secured Checkout: All transactions are processed through highly secure, SSL-encrypted systems. Furthermore, our checkout and payment gateways are fortified by Google reCAPTCHA to detect and prevent automated fraud. Zero Data Retention: We partner only with trusted, top-tier payment providers (for GCash, Credit Cards, Installments, etc.). We strictly do not store any of your sensitive credit card or financial information on our servers. Whether you are saving a custom PC build to your account or finalizing a high-value transaction, you can shop with absolute confidence knowing your personal and financial data is locked down and fully protected.",
      },
      {
        question: "Does my purchase come with a warranty?",
        answer: "Every item sold by Netcodex is 100% authentic and comes with a legitimate manufacturer’s warranty . We act as your partner in the after-sales process, providing dedicated technical support and assistance with warranty claims to keep your system running at peak performance.",
      },
      {
        question: "What if I receive a defective item? (Is it safe to order online?)",
        answer: "Absolutely. We want you to build with confidence, so we offer a stress-free 7-Day Defective-on-Arrival (DOA) Guarantee . If your item is confirmed defective within 7 days of receipt, we will provide a 1-to-1 replacement at no extra cost —and unlike many other stores, we even shoulder the return shipping fees! We take the risk out of online ordering so you can focus on enjoying your new gear.",
      },
      {
        question: "Can I return an item?",
        answer: "Netcodex does not offer returns for change of mind or compatibility issues. However, if an item is confirmed to be defective upon inspection by our technical team , it is covered under our 7-Day Defective-on-Arrival (DOA) policy , and we will provide a replacement in accordance with manufacturer and store guidelines. All warranty and DOA cases are subject to verification to ensure proper handling and fair resolution.",
      },
      {
        question: "Are your products sealed and brand new?",
        answer: "Yes. All products we sell are brand new and come in sealed boxes as supplied by the manufacturer . For added peace of mind, we are also happy to open and test any item before shipping upon request to ensure you receive a fully working unit.",
      },
    ],
  },
  {
    id: "after-sales-support-amp-technical-assistance",
    category: "Technical & After-Sales Support",
    icon: Headphones,
    questions: [
      {
        question: "Do you provide post-purchase technical support, and who will I be speaking with?",
        answer: "Yes. Netcodex provides real post-purchase technical support handled by actual trained and experienced PC builders , not bots or call center scripts. Our technicians are the same professionals who assemble, test, and validate our custom systems. Support is available Monday to Sunday, 10:00 AM to 7:00 PM (PH time) . You may reach us via Live Chat or call us directly—our phone numbers and contact details are listed on our Contact Page .",
      },
      {
        question: "What support channels are available if I need help?",
        answer: "You can reach Netcodex through Live Chat, phone support, and our official contact channels listed on our Contact Page . All inquiries are handled by trained and experienced PC builders, ensuring you receive accurate and practical assistance whether you are pre-purchase, setting up your system, or troubleshooting after delivery.",
      },
      {
        question: "Can you help me troubleshoot issues after setup, including drivers or system errors?",
        answer: "Absolutely. If you encounter issues such as boot errors, display problems, driver conflicts, or system instability after setup, our technical team can assist you. When needed, we can remotely access your PC (with your permission) so you can watch as we troubleshoot in real time. This allows us to properly diagnose driver issues, verify BIOS settings, and perform standard configuration checks related to compatibility and stability. Advanced overclocking, experimental BIOS tuning, or third-party modifications are not covered, but we are always happy to guide you on safe best practices.",
      },
    ],
  },
];
