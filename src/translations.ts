export type Language = 'en' | 'fr' | 'sw';

export interface Translations {
  common: {
    appName: string;
    loading: string;
    signIn: string;
    signInDesc: string;
    continueGoogle: string;
    signOut: string;
    session: string;
    traders: string;
    active: string;
    growthEngine: string;
    platformStatus: string;
    systemsOperational: string;
  };
  navigation: {
    dashboard: string;
    onboard: string;
    allTraders: string;
    inventory: string;
    pos: string;
    regime: string;
    settings: string;
  };
  dashboard: {
    overview: string;
    overviewDesc: string;
    liveFeed: string;
    totalRevenue: string;
    activeTraders: string;
    inventoryItems: string;
    totalSales: string;
    recentOrders: string;
    viewAll: string;
    attentionRequired: string;
    itemsLow: string;
    quickStats: string;
    newToday: string;
    totalSubscribed: string;
    noTransactions: string;
    optimalStock: string;
  };
  traderList: {
    title: string;
    export: string;
    tradersCount: string;
    noTraders: string;
    name: string;
    email: string;
    plan: string;
    status: string;
    action: string;
    confirmDelete: string;
  };
  traderForm: {
    title: string;
    description: string;
    fullName: string;
    email: string;
    phone: string;
    location: string;
    plan: string;
    status: string;
    submit: string;
    submitting: string;
    guide: string;
    guide1: string;
    guide2: string;
    guide3: string;
    guide4: string;
    onboardedStatus: string;
  };
  inventory: {
    title: string;
    search: string;
    addProduct: string;
    name: string;
    sku: string;
    stock: string;
    price: string;
    actions: string;
    units: string;
    adjustStock: string;
    updateStock: string;
    restock: string;
    damaged: string;
    returned: string;
    lowStockAlerts: string;
    noLowStock: string;
    newProduct: string;
    createProduct: string;
    category: string;
  };
  pos: {
    title: string;
    search: string;
    inStock: string;
    currentOrder: string;
    clearCart: string;
    emptyCart: string;
    subtotal: string;
    tax: string;
    total: string;
    checkout: string;
    processing: string;
    paymentMethods: {
      cash: string;
      card: string;
      mpesa: string;
    };
    saleSuccessful: string;
    orderNumber: string;
    paymentMethod: string;
    totalPaid: string;
    printReceipt: string;
    newOrder: string;
  };
  settings: {
    title: string;
    account: string;
    email: string;
    role: string;
    language: string;
    rolesManagement: string;
    adminNote: string;
    traderNote: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      appName: "Biashara Sasa",
      loading: "Initializing platform...",
      signIn: "Sign In",
      signInDesc: "Smart trader onboarding and business management platform.",
      continueGoogle: "Continue with Google",
      signOut: "Sign Out",
      session: "Session",
      traders: "Traders",
      active: "Active",
      growthEngine: "Growth Engine",
      platformStatus: "Platform Status",
      systemsOperational: "Systems Operational",
    },
    navigation: {
      dashboard: "Dashboard",
      onboard: "Onboard Trader",
      allTraders: "All Traders",
      inventory: "Inventory",
      pos: "POS System",
      regime: "Subscription Regime",
      settings: "System Settings",
    },
    dashboard: {
      overview: "System Overview",
      overviewDesc: "Real-time performance metrics across all Biashara Sasa modules.",
      liveFeed: "Live Engine Feed",
      totalRevenue: "Total Revenue",
      activeTraders: "Active Traders",
      inventoryItems: "Inventory Items",
      totalSales: "Total Sales",
      recentOrders: "Recent POS Orders",
      viewAll: "View All",
      attentionRequired: "Attention Required",
      itemsLow: "Items Low",
      quickStats: "Traders Quick Stats",
      newToday: "New Today",
      totalSubscribed: "Total Subscribed",
      noTransactions: "No transactions recorded yet.",
      optimalStock: "All inventory levels are optimal.",
    },
    traderList: {
      title: "All Traders",
      export: "Export List",
      tradersCount: "trader",
      noTraders: "No traders onboarded yet.",
      name: "Name",
      email: "Email",
      plan: "Plan",
      status: "Status",
      action: "Action",
      confirmDelete: "Remove trader",
    },
    traderForm: {
      title: "Register Trader",
      description: "Create an individual account and assign a subscription plan.",
      fullName: "Full Name",
      email: "Email",
      phone: "Phone",
      location: "Location",
      plan: "Subscription Regime",
      status: "Status",
      submit: "Onboard Trader",
      submitting: "Onboarding...",
      guide: "Quick Guide",
      guide1: "Each trader gets an individual account.",
      guide2: "Choose a subscription regime.",
      guide3: "Set status: Active / Pending / Inactive.",
      guide4: "View all traders in the All Traders tab.",
      onboardedStatus: "trader onboarded",
    },
    inventory: {
      title: "Inventory Management",
      search: "Search products...",
      addProduct: "Add Product",
      name: "Product Name",
      sku: "SKU",
      stock: "Stock",
      price: "Price",
      actions: "Actions",
      units: "units",
      adjustStock: "Adjust Stock",
      updateStock: "Update Stock",
      restock: "Restock",
      damaged: "Damaged",
      returned: "Returned",
      lowStockAlerts: "Low Stock Alerts",
      noLowStock: "No items under low stock limit.",
      newProduct: "New Product",
      createProduct: "Create Product",
      category: "Category",
    },
    pos: {
      title: "Point of Sale",
      search: "Search products by name or SKU...",
      inStock: "in stock",
      currentOrder: "Current Order",
      clearCart: "Clear",
      emptyCart: "Your cart is empty",
      subtotal: "Subtotal",
      tax: "Tax",
      total: "Total",
      checkout: "Complete Checkout",
      processing: "Processing...",
      paymentMethods: {
        cash: "Cash",
        card: "Card",
        mpesa: "M-Pesa",
      },
      saleSuccessful: "Sale Successful",
      orderNumber: "Order Number",
      paymentMethod: "Payment Method",
      totalPaid: "Total Paid",
      printReceipt: "Receipt",
      newOrder: "New Order",
    },
    settings: {
      title: "System Settings",
      account: "Account Information",
      email: "Email Address",
      role: "User Role",
      language: "Preferred Language",
      rolesManagement: "Roles & Permissions",
      adminNote: "You have full access to manage traders, inventory, and point of sale systems.",
      traderNote: "You have restricted access. You can manage your inventory and use the point of sale system.",
    }
  },
  fr: {
    common: {
      appName: "Biashara Sasa",
      loading: "Initialisation de la plateforme...",
      signIn: "Se connecter",
      signInDesc: "Plateforme intelligente d'intégration des commerçants et de gestion d'entreprise.",
      continueGoogle: "Continuer avec Google",
      signOut: "Se déconnecter",
      session: "Session",
      traders: "Commerçants",
      active: "Actif",
      growthEngine: "Moteur de croissance",
      platformStatus: "Statut de la plateforme",
      systemsOperational: "Systèmes opérationnels",
    },
    navigation: {
      dashboard: "Tableau de bord",
      onboard: "Intégrer commerçant",
      allTraders: "Tous les commerçants",
      inventory: "Inventaire",
      pos: "Système de vente",
      regime: "Régime d'abonnement",
      settings: "Paramètres système",
    },
    dashboard: {
      overview: "Aperçu du système",
      overviewDesc: "Métriques de performance en temps réel sur tous les modules Biashara Sasa.",
      liveFeed: "Flux en direct",
      totalRevenue: "Chiffre d'affaires",
      activeTraders: "Commerçants actifs",
      inventoryItems: "Articles en stock",
      totalSales: "Ventes totales",
      recentOrders: "Commandes POS récentes",
      viewAll: "Tout voir",
      attentionRequired: "Attention requise",
      itemsLow: "Articles faibles",
      quickStats: "Stats rapides",
      newToday: "Nouveaux aujourd'hui",
      totalSubscribed: "Total abonnés",
      noTransactions: "Aucune transaction enregistrée.",
      optimalStock: "Tous les niveaux de stock sont optimaux.",
    },
    traderList: {
      title: "Tous les commerçants",
      export: "Exporter la liste",
      tradersCount: "commerçant",
      noTraders: "Aucun commerçant intégré.",
      name: "Nom",
      email: "E-mail",
      plan: "Plan",
      status: "Statut",
      action: "Action",
      confirmDelete: "Supprimer le commerçant",
    },
    traderForm: {
      title: "Enregistrer commerçant",
      description: "Créer un compte individuel et attribuer un plan d'abonnement.",
      fullName: "Nom complet",
      email: "E-mail",
      phone: "Téléphone",
      location: "Localisation",
      plan: "Régime d'abonnement",
      status: "Statut",
      submit: "Intégrer",
      submitting: "Intégration...",
      guide: "Guide rapide",
      guide1: "Chaque commerçant reçoit un compte individuel.",
      guide2: "Choisissez un régime d'abonnement.",
      guide3: "Définir le statut : Actif / En attente / Inactif.",
      guide4: "Voir tous les commerçants dans l'onglet dédié.",
      onboardedStatus: "commerçant intégré",
    },
    inventory: {
      title: "Gestion d'inventaire",
      search: "Rechercher...",
      addProduct: "Ajouter un produit",
      name: "Nom du produit",
      sku: "SKU",
      stock: "Stock",
      price: "Prix",
      actions: "Actions",
      units: "unités",
      adjustStock: "Ajuster le stock",
      updateStock: "Mettre à jour",
      restock: "Réapprovisionnement",
      damaged: "Endommagé",
      returned: "Retourné",
      lowStockAlerts: "Alertes stock faible",
      noLowStock: "Aucun article en stock faible.",
      newProduct: "Nouveau produit",
      createProduct: "Créer le produit",
      category: "Catégorie",
    },
    pos: {
      title: "Point de vente",
      search: "Rechercher par nom ou SKU...",
      inStock: "en stock",
      currentOrder: "Commande actuelle",
      clearCart: "Vider",
      emptyCart: "Votre panier est vide",
      subtotal: "Sous-total",
      tax: "Taxe",
      total: "Total",
      checkout: "Terminer la vente",
      processing: "Traitement...",
      paymentMethods: {
        cash: "Espèces",
        card: "Carte",
        mpesa: "M-Pesa",
      },
      saleSuccessful: "Vente réussie",
      orderNumber: "Numéro de commande",
      paymentMethod: "Mode de paiement",
      totalPaid: "Total payé",
      printReceipt: "Reçu",
      newOrder: "Nouvelle commande",
    },
    settings: {
      title: "Paramètres système",
      account: "Informations de compte",
      email: "Adresse e-mail",
      role: "Rôle de l'utilisateur",
      language: "Langue préférée",
      rolesManagement: "Rôles et autorisations",
      adminNote: "Vous avez un accès complet pour gérer les commerçants, l'inventaire et les systèmes de point de vente.",
      traderNote: "Vous avez un accès restreint. Vous pouvez gérer votre inventaire et utiliser le système de point de vente.",
    }
  },
  sw: {
    common: {
      appName: "Biashara Sasa",
      loading: "Inatayarisha jukwaa...",
      signIn: "Ingia",
      signInDesc: "Jukwaa mahiri la kusajili wafanyabiashara na usimamizi wa biashara.",
      continueGoogle: "Endelea na Google",
      signOut: "Ondoka",
      session: "Kipindi",
      traders: "Wafanyabiashara",
      active: "Inatumika",
      growthEngine: "Injini ya Ukuaji",
      platformStatus: "Hali ya Jukwaa",
      systemsOperational: "Mifumo Inafanya Kazi",
    },
    navigation: {
      dashboard: "Dashibodi",
      onboard: "Sajili Mfanyabiashara",
      allTraders: "Wafanyabiashara Wote",
      inventory: "Stoo",
      pos: "Mfumo wa Mauzo",
      regime: "Mpango wa Usajili",
      settings: "Mipangilio ya Mfumo",
    },
    dashboard: {
      overview: "Muhtasari wa Mfumo",
      overviewDesc: "Vipimo vya utendaji vya wakati halisi katika moduli zote za Biashara Sasa.",
      liveFeed: "Mlisho wa Moja kwa Moja",
      totalRevenue: "Mapato Jumla",
      activeTraders: "Wanachama Hai",
      inventoryItems: "Bidhaa za Stoo",
      totalSales: "Mauzo Jumla",
      recentOrders: "Maagizo Mapya ya POS",
      viewAll: "Ona Yote",
      attentionRequired: "Inahitaji Tahadhari",
      itemsLow: "Vitu Vimepungua",
      quickStats: "Takwimu za Haraka",
      newToday: "Wageni wa Leo",
      totalSubscribed: "Jumla ya Waliojisajili",
      noTransactions: "Hakuna miamala iliyorekodiwa bado.",
      optimalStock: "Bidhaa zote zipo kwa wingi wa kutosha.",
    },
    traderList: {
      title: "Wafanyabiashara Wote",
      export: "Hamisha Orodha",
      tradersCount: "mfanyabiashara",
      noTraders: "Hakuna wafanyabiashara waliosajiliwa bado.",
      name: "Jina",
      email: "Barua Pepe",
      plan: "Mpango",
      status: "Hali",
      action: "Hatua",
      confirmDelete: "Ondoa mfanyabiashara",
    },
    traderForm: {
      title: "Sajili Mfanyabiashara",
      description: "Fungua akaunti ya kibinafsi na weka mpango wa usajili.",
      fullName: "Jina Kamili",
      email: "Barua Pepe",
      phone: "Simu",
      location: "Mahali",
      plan: "Mpango wa Usajili",
      status: "Hali",
      submit: "Sajili",
      submitting: "Inasajili...",
      guide: "Maelekezo Maaka",
      guide1: "Kila mfanyabiashara anapata akaunti yake.",
      guide2: "Chagua mpango wa usajili.",
      guide3: "Weka hali: Hai / Inasubiri / Haifanyi kazi.",
      guide4: "Angalia wafanyabiashara wote kwenye kichupo cha Wafanyabiashara.",
      onboardedStatus: "mfanyabiashara amesajiliwa",
    },
    inventory: {
      title: "Usimamizi wa Stoo",
      search: "Tafuta bidhaa...",
      addProduct: "Ongeza Bidhaa",
      name: "Jina la Bidhaa",
      sku: "SKU",
      stock: "Stoo",
      price: "Bei",
      actions: "Hatua",
      units: "vitu",
      adjustStock: "Rekebisha Idadi",
      updateStock: "Sasisha Stoo",
      restock: "Ongeza Bidhaa",
      damaged: "Imeharibika",
      returned: "Imerudishwa",
      lowStockAlerts: "Tahadhari za Stoo Chache",
      noLowStock: "Hakuna bidhaa zilizo chini ya kikomo.",
      newProduct: "Bidhaa Mpya",
      createProduct: "Tengeneza Bidhaa",
      category: "Kundi",
    },
    pos: {
      title: "Wakala wa Mauzo",
      search: "Tafuta bidhaa kwa jina au SKU...",
      inStock: "zilizopo",
      currentOrder: "Agizo la Sasa",
      clearCart: "Futa",
      emptyCart: "Kikapu chako kiko tupu",
      subtotal: "Jumla Ndogo",
      tax: "Kodi",
      total: "Jumla",
      checkout: "Kamilisha Malipo",
      processing: "Inashughulikia...",
      paymentMethods: {
        cash: "Pesa Taslimu",
        card: "Kadi",
        mpesa: "M-Pesa",
      },
      saleSuccessful: "Malipo Yamefanikiwa",
      orderNumber: "Namba ya Agizo",
      paymentMethod: "Njia ya Malipo",
      totalPaid: "Jumla Iliyolipwa",
      printReceipt: "Risiti",
      newOrder: "Agizo Jipya",
    },
    settings: {
      title: "Mipangilio ya Mfumo",
      account: "Habari za Akaunti",
      email: "Barua Pepe",
      role: "Wajibu wa Mtumiaji",
      language: "Lugha Inayopendwa",
      rolesManagement: "Majukumu na Ruhusa",
      adminNote: "Una ufikiaji kamili wa kusimamia wafanyabiashara, stoo, na mifumo ya mauzo.",
      traderNote: "Una ufikiaji mdogo. Unaweza kusimamia stoo yako na kutumia mfumo wa mauzo.",
    }
  }
};
