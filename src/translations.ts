export interface TranslationSet {
  title: string;
  tagline: string;
  login: string;
  register: string;
  logout: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
  role: string;
  farmer: string;
  buyer: string;
  admin: string;
  citizenship: string;
  citizenshipVerified: string;
  citizenshipPending: string;
  citizenshipAlert: string;
  submit: string;
  noAccount: string;
  haveAccount: string;
  welcome: string;
  rating: string;
  status: string;
  pending: string;
  accepted: string;
  outForDelivery: string;
  delivered: string;
  cancelled: string;
  actions: string;
  acceptOrder: string;
  dispatchOrder: string;
  deliverOrder: string;
  cancelOrder: string;
  rateBuyer: string;
  rateFarmer: string;
  ratingSubmitted: string;
  feedbackPlaceholder: string;
  marketplace: string;
  myOrders: string;
  myProducts: string;
  addCrop: string;
  cropName: string;
  category: string;
  unit: string;
  quantity: string;
  location: string;
  marketPriceRef: string;
  aiSuggestButton: string;
  aiSuggestedPrice: string;
  finalPrice: string;
  publishListing: string;
  harvestDate: string;
  imagePlaceholder: string;
  searchPlaceholder: string;
  allCategories: string;
  vegetables: string;
  fruits: string;
  grains: string;
  herbs: string;
  buyNow: string;
  orderSuccess: string;
  orderError: string;
  insufficientStock: string;
  orderQuantity: string;
  paymentMethod: string;
  cashOnDelivery: string;
  mobileWallet: string;
  placeOrderButton: string;
  close: string;
  adminDashboard: string;
  stats: string;
  manageListings: string;
  users: string;
  totalRevenue: string;
  activeListings: string;
  totalOrders: string;
  verifyCitizenship: string;
  blockListing: string;
  unblockListing: string;
}

export const translations: Record<"en" | "ne", TranslationSet> = {
  en: {
    title: "AgriBridge",
    tagline: "Connecting farmers directly with buyers in Nepal, driven by fair trade and smart AI-assisted pricing.",
    login: "Sign In",
    register: "Register",
    logout: "Sign Out",
    email: "Email Address",
    password: "Password",
    fullName: "Full Name",
    phone: "Phone Number (Ncell/NTC)",
    address: "Location Address (e.g. Kavre, Panchkhal)",
    role: "Select Your Profile Role",
    farmer: "Farmer (किसान)",
    buyer: "Buyer (उपभोक्ता)",
    admin: "Platform Administrator",
    citizenship: "National Citizenship Number",
    citizenshipVerified: "Citizenship Verified",
    citizenshipPending: "Citizenship Verification Pending",
    citizenshipAlert: "Your citizenship verification is pending approval by the admin. You will be able to list your crop harvest once verified.",
    submit: "Submit",
    noAccount: "Don't have an account? Sign Up",
    haveAccount: "Already have an account? Sign In",
    welcome: "Welcome back",
    rating: "Rating",
    status: "Status",
    pending: "Pending",
    accepted: "Accepted",
    outForDelivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    actions: "Actions",
    acceptOrder: "Accept Order",
    dispatchOrder: "Ship Harvest",
    deliverOrder: "Mark Delivered",
    cancelOrder: "Cancel Order",
    rateBuyer: "Rate Buyer",
    rateFarmer: "Rate Farmer",
    ratingSubmitted: "Review submitted successfully!",
    feedbackPlaceholder: "Write a short comment on your trading experience...",
    marketplace: "Marketplace",
    myOrders: "My Orders",
    myProducts: "My Harvest Listings",
    addCrop: "List New Crop",
    cropName: "Crop / Produce Name (e.g., Organic Tomatoes)",
    category: "Crop Category",
    unit: "Unit (e.g., kg, crate, sack)",
    quantity: "Available Quantity",
    location: "Farm Location (e.g., Kavre, Panchkhal)",
    marketPriceRef: "Standard Market Reference Price (NPR/Unit)",
    aiSuggestButton: "Calculate Smart AI Fair Price Suggestion",
    aiSuggestedPrice: "AI Suggested Fair Price",
    finalPrice: "Final Selling Price (NPR/Unit)",
    publishListing: "Publish Crop Listing",
    harvestDate: "Estimated Harvest Date",
    imagePlaceholder: "Produce Image (URL or standard mock loaded)",
    searchPlaceholder: "Search crops by name, location, or farm...",
    allCategories: "All Categories",
    vegetables: "Vegetables",
    fruits: "Fruits",
    grains: "Grains",
    herbs: "Herbs",
    buyNow: "Buy Now",
    orderSuccess: "Purchase order created successfully!",
    orderError: "Failed to place purchase order.",
    insufficientStock: "Insufficient stock available.",
    orderQuantity: "Purchase Quantity",
    paymentMethod: "Select Payment Method",
    cashOnDelivery: "Cash on Delivery (COD)",
    mobileWallet: "Mock Nepal Wallet (eSewa / Khalti)",
    placeOrderButton: "Confirm Purchase",
    close: "Close",
    adminDashboard: "Admin Management Control",
    stats: "Platform Stats",
    manageListings: "Review Crop Listings",
    users: "Registered Users List",
    totalRevenue: "Gross Transacted Volume",
    activeListings: "Active Harvest Listings",
    totalOrders: "Total Orders Processed",
    verifyCitizenship: "Approve Citizenship Verification",
    blockListing: "Block Listing",
    unblockListing: "Approve Listing"
  },
  ne: {
    title: "एग्रिब्रिज",
    tagline: "नेपालका किसान र उपभोक्ताहरूलाई सीधा जोड्ने माध्यम, निष्पक्ष बजार र स्मार्ट एआई मूल्य निर्धारणको साथ।",
    login: "लगइन गर्नुहोस्",
    register: "नयाँ दर्ता गर्नुहोस्",
    logout: "बाहिरिनुहोस्",
    email: "इमेल ठेगाना",
    password: "पासवर्ड",
    fullName: "पूरा नाम",
    phone: "फोन नम्बर (एनसेल/एनटिसी)",
    address: "फार्मको ठेगाना (जस्तै: काभ्रे, पाँचखाल)",
    role: "तपाईंको भूमिका छनौट गर्नुहोस्",
    farmer: "किसान",
    buyer: "उपभोक्ता",
    admin: "प्लेटफर्म व्यवस्थापक",
    citizenship: "राष्ट्रिय नागरिकता नम्बर",
    citizenshipVerified: "नागरिकता प्रमाणित भयो",
    citizenshipPending: "नागरिकता प्रमाणीकरण बाँकी छ",
    citizenshipAlert: "तपाईंको नागरिकता प्रमाणीकरण व्यवस्थापकद्वारा स्वीकृत हुन बाँकी छ। स्वीकृत भएपछि तपाईंले आफ्नो बाली बजारमा राख्न सक्नुहुनेछ।",
    submit: "बुझाउनुहोस्",
    noAccount: "नयाँ खाता बनाउन दर्ता गर्नुहोस्",
    haveAccount: "पहिल्यै खाता छ? लगइन गर्नुहोस्",
    welcome: "स्वागत छ",
    rating: "रेटिङ",
    status: "अवस्था",
    pending: "प्रतीक्षामा",
    accepted: "स्वीकृत",
    outForDelivery: "डेलिभरीमा छ",
    delivered: "डेलिभर भयो",
    cancelled: "रद्द भयो",
    actions: "कार्यहरू",
    acceptOrder: "अर्डर स्वीकार्नुहोस्",
    dispatchOrder: "बाली पठाउनुहोस्",
    deliverOrder: "डेलिभर भएको जनाउनुहोस्",
    cancelOrder: "अर्डर रद्द गर्नुहोस्",
    rateBuyer: "उपभोक्तालाई रेट गर्नुहोस्",
    rateFarmer: "किसानलाई रेट गर्नुहोस्",
    ratingSubmitted: "प्रतिक्रिया सफलतापूर्वक प्राप्त भयो!",
    feedbackPlaceholder: "तपाईंको व्यापारिक अनुभव बारे छोटो टिप्पणी लेख्नुहोस्...",
    marketplace: "बजार (मार्केटप्लेस)",
    myOrders: "मेरो अर्डरहरू",
    myProducts: "मेरो उत्पादन सूची",
    addCrop: "नयाँ बाली थप्नुहोस्",
    cropName: "बाली/उत्पादनको नाम (जस्तै: ताजा रातो गोलभेडा)",
    category: "बालीको वर्गीकरण",
    unit: "इकाई (जस्तै: केजी, क्रेट, बोरा)",
    quantity: "उपलब्ध परिमाण",
    location: "बाली फलेको ठेगाना (जस्तै: पाँचखाल, काभ्रे)",
    marketPriceRef: "मानक बजार मूल्य (रु/इकाई)",
    aiSuggestButton: "स्मार्ट एआई निष्पक्ष मूल्य सुझाव",
    aiSuggestedPrice: "एआई सुझावित निष्पक्ष मूल्य",
    finalPrice: "अन्तिम बिक्री मूल्य (रु/इकाई)",
    publishListing: "बाली बजारमा राख्नुहोस्",
    harvestDate: "अनुमानित बाली कटानी मिति",
    imagePlaceholder: "उत्पादनको फोटो (लिंक वा मानक फोटो)",
    searchPlaceholder: "बालीको नाम, ठेगाना वा फार्मबाट खोज्नुहोस्...",
    allCategories: "सबै वर्गीकरण",
    vegetables: "तरकारी",
    fruits: "फलफूल",
    grains: "अन्नबाली",
    herbs: "जडीबुटी",
    buyNow: "किन्नुहोस्",
    orderSuccess: "खरीद अर्डर सफलतापूर्वक सिर्जना भयो!",
    orderError: "खरीद अर्डर सिर्जना गर्न असफल भयो।",
    insufficientStock: "पर्याप्त परिमाण उपलब्ध छैन।",
    orderQuantity: "खरीद परिमाण",
    paymentMethod: "भुक्तानीको माध्यम छान्नुहोस्",
    cashOnDelivery: "डेलिभरीमा नगद (COD)",
    mobileWallet: "डिजिटल वालेट (eSewa / Khalti)",
    placeOrderButton: "खरीद प्रक्रिया अघि बढाउनुहोस्",
    close: "बन्द गर्नुहोस्",
    adminDashboard: "प्रशासकीय नियन्त्रण बोर्ड",
    stats: "प्लेटफर्मको तथ्याङ्क",
    manageListings: "बाली सूची समीक्षा",
    users: "दर्ता भएका प्रयोगकर्ताहरूको सूची",
    totalRevenue: "कुल कारोबार परिमाण",
    activeListings: "सक्रिय उत्पादनहरू",
    totalOrders: "कुल अर्डर प्रक्रिया",
    verifyCitizenship: "नागरिकता प्रमाणीकरण स्वीकृत गर्नुहोस्",
    blockListing: "बाली रोक्का गर्नुहोस्",
    unblockListing: "बाली स्वीकृत गर्नुहोस्"
  }
};
