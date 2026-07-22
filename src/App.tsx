import React, { useState, useEffect } from "react";
import { 
  Sprout, 
  Leaf, 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  Star, 
  ShoppingBag, 
  Truck, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  Award, 
  LogOut, 
  User as UserIcon, 
  TrendingUp, 
  Globe, 
  ArrowRight, 
  Users, 
  Sparkles, 
  MessageSquare,
  ChevronRight,
  AlertTriangle,
  HeartHandshake
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "./translations";

// Types mapping matching server
interface User {
  id: string;
  name: string;
  email: string;
  role: "farmer" | "buyer" | "admin";
  phone: string;
  address: string;
  avg_rating: number;
  citizenship_number: string;
  citizenship_verified: boolean;
  created_at: string;
}

interface Product {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  farmer_rating?: number;
  farmer_phone?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price_market_ref: number;
  price_ai_suggested: number;
  price_final: number;
  harvest_date: string;
  location: string;
  images: string;
  status: "active" | "sold_out" | "unapproved";
  created_at: string;
}

interface Order {
  id: string;
  buyer_id: string;
  buyer_name?: string;
  buyer_phone?: string;
  farmer_id: string;
  farmer_name?: string;
  farmer_phone?: string;
  product_id: string;
  product_name?: string;
  product_unit?: string;
  quantity: number;
  status: "pending" | "accepted" | "out_for_delivery" | "delivered" | "cancelled";
  payment_method: string;
  payment_status?: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export default function App() {
  // Localization & Auth State
  const [lang, setLang] = useState<"en" | "ne">(() => {
    return (localStorage.getItem("agribridge_lang") as "en" | "ne") || "en";
  });
  const t = translations[lang];

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("agribridge_token") || null;
  });
  const [user, setUser] = useState<User | null>(null);

  // Authentication Forms State
  const [isRegister, setIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authAddress, setAuthAddress] = useState("");
  const [authRole, setAuthRole] = useState<"farmer" | "buyer">("farmer");
  const [authCitizenship, setAuthCitizenship] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Core Data Lists State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Filter and Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");

  // Farmer New Harvest Form
  const [newCropName, setNewCropName] = useState("");
  const [newCategory, setNewCategory] = useState("Vegetables");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("kg");
  const [newLocation, setNewLocation] = useState("");
  const [marketRefPrice, setMarketRefPrice] = useState("");
  const [aiSuggestedPrice, setAiSuggestedPrice] = useState<number | null>(null);
  const [aiAnalysisNotes, setAiAnalysisNotes] = useState("");
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [finalPrice, setFinalPrice] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [cropImage, setCropImage] = useState("");
  const [supplyDemandIndex, setSupplyDemandIndex] = useState("1.0");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Buyer Purchase State
  const [purchasingProduct, setPurchasingProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [payMethod, setPayMethod] = useState("COD");
  const [placingOrder, setPlacingOrder] = useState(false);

  // Ratings & Feedback Modal/Form
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingError, setRatingError] = useState("");

  // Admin Dashboard State
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminListings, setAdminListings] = useState<Product[]>([]);
  const [adminStats, setAdminStats] = useState({
    user_count: 0,
    product_count: 0,
    order_count: 0,
    total_revenue: 0,
    pending_citizenships: 0
  });
  const [adminTab, setAdminTab] = useState<"stats" | "citizenships" | "listings">("stats");

  // Notifications or Toast messages
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Quick Login Presets
  const handleQuickLogin = (email: string) => {
    setAuthEmail(email);
    setAuthPassword(email.includes("farmer") ? "farmer123" : email.includes("buyer") ? "buyer123" : "admin123");
    setIsRegister(false);
  };

  // Trigger Language Switch
  const toggleLanguage = () => {
    const nextLang = lang === "en" ? "ne" : "en";
    setLang(nextLang);
    localStorage.setItem("agribridge_lang", nextLang);
  };

  // Auto-clear Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch Current User on Token Mount
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setUser(null);
    }
  }, [token]);

  // General Fetching Logic based on User Role
  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchOrders();
      if (user.role === "admin") {
        fetchAdminData();
      }
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        handleLogout();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      let url = "/api/products";
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (locationFilter) params.append("location", locationFilter);
      if (searchQuery) params.append("search", searchQuery);
      
      const queryStr = params.toString();
      if (queryStr) url += `?${queryStr}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const [statsRes, usersRes, listingsRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/admin/users", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/admin/listings", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setAdminStats(await statsRes.json());
      if (usersRes.ok) setAdminUsers(await usersRes.json());
      if (listingsRes.ok) setAdminListings(await listingsRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Auth: Submit Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister 
      ? { 
          name: authName, 
          email: authEmail, 
          password: authPassword, 
          role: authRole, 
          phone: authPhone, 
          address: authAddress,
          citizenship_number: authRole === "farmer" ? authCitizenship : undefined
        }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        if (isRegister) {
          setAuthSuccess(lang === "en" ? "Registration completed! Please log in." : "दर्ता प्रक्रिया सफल भयो! कृपया लगइन गर्नुहोस्।");
          setIsRegister(false);
          setAuthPassword("");
        } else {
          localStorage.setItem("agribridge_token", data.access_token);
          setToken(data.access_token);
          setToast({
            type: "success",
            message: lang === "en" ? "Successfully logged in." : "सफलतापूर्वक लगइन भयो।"
          });
        }
      } else {
        setAuthError(data.detail || "Authentication request failed.");
      }
    } catch (err) {
      setAuthError("Server unavailable at the moment.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("agribridge_token");
    setToken(null);
    setUser(null);
    setProducts([]);
    setOrders([]);
    setToast({
      type: "success",
      message: lang === "en" ? "Logged out successfully." : "सफलतापूर्वक बाहिरिनुभयो।"
    });
  };

  // AI Pricing Suggestion trigger
  const handleAiPriceSuggestion = async () => {
    if (!newCropName || !marketRefPrice || !newQuantity) {
      setUploadError(lang === "en" ? "Please fill Crop name, Reference Price, and Quantity first" : "कृपया पहिले बालीको नाम, मानक बजार मूल्य र परिमाण भर्नुहोस्।");
      return;
    }
    setAiSuggesting(true);
    setUploadError("");

    try {
      const res = await fetch("/api/pricing/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          quantity: newQuantity,
          location: newLocation || user?.address || "Kavre, Panchkhal",
          price_market_ref: marketRefPrice,
          supply_demand_signal: supplyDemandIndex
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestedPrice(data.price_ai_suggested);
        setAiAnalysisNotes(data.notes);
        setFinalPrice(String(data.price_ai_suggested));
      } else {
        const err = await res.json();
        setUploadError(err.detail || "Failed to fetch AI pricing suggestion.");
      }
    } catch (e) {
      setUploadError("Could not connect to the Pricing Engine.");
    } finally {
      setAiSuggesting(false);
    }
  };

  // Farmer Publish Produce
  const handlePublishListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");

    if (!newCropName || !newQuantity || !finalPrice || !newLocation) {
      setUploadError(lang === "en" ? "Please fill all mandatory fields" : "कृपया सबै आवश्यक विवरणहरू भर्नुहोस्।");
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCropName,
          category: newCategory,
          quantity: newQuantity,
          unit: newUnit,
          price_market_ref: marketRefPrice || finalPrice,
          price_ai_suggested: aiSuggestedPrice || finalPrice,
          price_final: finalPrice,
          harvest_date: harvestDate,
          location: newLocation,
          images: cropImage
        })
      });

      if (res.ok) {
        setUploadSuccess(lang === "en" ? "Your crop listing is published on the marketplace!" : "तपाईंको बाली सफलतापूर्वक बजारमा राखिएको छ!");
        setNewCropName("");
        setNewQuantity("");
        setNewLocation("");
        setMarketRefPrice("");
        setFinalPrice("");
        setHarvestDate("");
        setCropImage("");
        setAiSuggestedPrice(null);
        setAiAnalysisNotes("");
        fetchProducts();
      } else {
        const err = await res.json();
        setUploadError(err.detail || "Listing submission failed.");
      }
    } catch (e) {
      setUploadError("Network error while submitting listing.");
    }
  };

  // Buyer: Purchase order placement
  const handleConfirmPurchase = async () => {
    if (!purchasingProduct) return;
    setPlacingOrder(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: purchasingProduct.id,
          quantity: orderQty,
          payment_method: payMethod
        })
      });

      if (res.ok) {
        setToast({
          type: "success",
          message: t.orderSuccess
        });
        setPurchasingProduct(null);
        setOrderQty(1);
        fetchProducts();
        fetchOrders();
      } else {
        const err = await res.json();
        setToast({
          type: "error",
          message: err.detail || t.orderError
        });
      }
    } catch (e) {
      setToast({
        type: "error",
        message: "Failed to place order due to a network issue."
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  // Farmer/Buyer: Update order lifecycle state
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status_update: status })
      });

      if (res.ok) {
        setToast({
          type: "success",
          message: lang === "en" ? `Order status updated to ${status}.` : `अर्डरको अवस्था हाल ${status} मा परिवर्तन भयो।`
        });
        fetchOrders();
        fetchProducts();
        if (user?.role === "admin") {
          fetchAdminData();
        }
      } else {
        const err = await res.json();
        setToast({ type: "error", message: err.detail || "Failed to update order status" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Feedback & Rating
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingOrder) return;
    setRatingError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: ratingOrder.id,
          rating: ratingValue,
          comment: ratingComment
        })
      });

      if (res.ok) {
        setToast({
          type: "success",
          message: t.ratingSubmitted
        });
        setRatingOrder(null);
        setRatingValue(5);
        setRatingComment("");
        fetchOrders();
        fetchProducts();
      } else {
        const err = await res.json();
        setRatingError(err.detail || "Could not save review.");
      }
    } catch (e) {
      setRatingError("Network failure sending rating.");
    }
  };

  // Admin: Approve/Block listing
  const handleAdminToggleListing = async (listingId: string, status: "active" | "unapproved") => {
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setToast({
          type: "success",
          message: lang === "en" ? `Listing status is now ${status}` : `उत्पादन अवस्था ${status} भयो`
        });
        fetchAdminData();
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin: Verify Farmer Citizenship
  const handleAdminVerifyUser = async (userId: string, verified: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify-citizenship`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ verified })
      });

      if (res.ok) {
        setToast({
          type: "success",
          message: lang === "en" ? "Citizenship status updated successfully." : "नागरिकता प्रमाणिकरण सफलतापूर्वक अद्यावधिक भयो।"
        });
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger search on inputs
  useEffect(() => {
    const handler = setTimeout(() => {
      if (user) {
        fetchProducts();
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedCategory, locationFilter]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app_root">
      {/* Toast notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl shadow-sm border flex items-center gap-3 ${
              toast.type === "success" 
                ? "bg-white text-slate-900 border-slate-200" 
                : "bg-white text-slate-900 border-rose-200"
            }`}
            id="toast_alert"
          >
            {toast.type === "success" ? <CheckCircle className="h-4.5 w-4.5 text-emerald-600" /> : <XCircle className="h-4.5 w-4.5 text-rose-600" />}
            <span className="font-semibold text-xs text-slate-800">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200" id="main_header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-emerald-700" id="brand_logo">
            <Sprout className="h-6 w-6 stroke-[2.5]" />
            <div>
              <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight flex items-baseline gap-1.5">
                <span>AgriBridge</span>
                <span className="text-emerald-700 text-xs font-semibold font-sans">एग्रिब्रिज</span>
              </h1>
            </div>
            <span className="ml-2 text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest hidden sm:inline-block">Prototype v1.0</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Toggle Switcher */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              id="lang_switch"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-600" />
              <span>{lang === "en" ? "नेपाली" : "English"}</span>
            </button>

            {user && (
              <div className="flex items-center gap-3 border-l pl-4 border-slate-200" id="user_profile_pill">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                    <span>{user.name}</span>
                    {user.role === "farmer" && user.citizenship_verified && (
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" title="Citizenship Verified" />
                    )}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {user.role === "farmer" ? t.farmer : user.role === "buyer" ? t.buyer : t.admin}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs" title={user.name}>
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>

                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  title={t.logout}
                  id="btn_logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main_content_container">
        {!user ? (
          /* Authentication Screen & Split Banner Showcase */
          <div className="grid lg:grid-cols-12 gap-8 items-center py-6" id="auth_view">
            {/* Brand Intro Card */}
            <div className="lg:col-span-7 space-y-6" id="brand_intro">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Smart Agriculture Nepal
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold font-display text-slate-900 tracking-tight leading-none">
                Direct trade, <span className="text-emerald-700">fairly priced</span> by artificial intelligence.
              </h2>
              <p className="text-base text-slate-500 leading-relaxed max-w-xl">
                {t.tagline}
              </p>

              {/* Bento Quick-stats */}
              <div className="grid sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{lang === "en" ? "Farmers Verified" : "प्रमाणित किसानहरू"}</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 font-display">120+ Farmers</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{lang === "en" ? "Crops Transacted" : "कुल बिक्री परिमाण"}</span>
                  <span className="text-xl font-bold text-emerald-700 mt-1 font-display">18,500+ KG</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{lang === "en" ? "Fair Price Lift" : "मूल्यमा सुधार"}</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 font-display">+22% Net</span>
                </div>
              </div>

              {/* Quick Login Assist Presets Panel */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3" id="quick_login_assist">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-emerald-600" /> Quick Sandbox Presets (लगइन सहयोग)
                </h4>
                <p className="text-xs text-slate-500">{lang === "en" ? "Use these instant accounts to check roles, AI Pricing listing, buying, and admin verification dashboard." : "विभिन्न भुमिकाहरू परीक्षण गर्न यी ईमेलहरू प्रयोग गर्नुहोस्।"}</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleQuickLogin("farmer@agribridge.com")} 
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Ram Bahadur (Farmer - Verified)
                  </button>
                  <button 
                    onClick={() => handleQuickLogin("buyer@agribridge.com")} 
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Sita Devi (Buyer)
                  </button>
                  <button 
                    onClick={() => handleQuickLogin("admin@agribridge.com")} 
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Platform Admin
                  </button>
                </div>
              </div>
            </div>

            {/* Auth Form Box */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-8" id="auth_card">
              <h3 className="text-xl font-bold font-display text-slate-900 mb-6" id="auth_card_title">
                {isRegister ? t.register : t.login}
              </h3>

              {authError && (
                <div className="mb-4 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg font-bold" id="auth_error">
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg font-bold" id="auth_success">
                  {authSuccess}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4" id="frm_auth">
                {isRegister && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.fullName}</label>
                      <input 
                        type="text" 
                        value={authName}
                        onChange={e => setAuthName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        placeholder="e.g. Ram Bahadur"
                        required
                        id="auth_input_name"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.phone}</label>
                      <input 
                        type="text" 
                        value={authPhone}
                        onChange={e => setAuthPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        placeholder="e.g. 9841234567"
                        required
                        id="auth_input_phone"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.address}</label>
                      <input 
                        type="text" 
                        value={authAddress}
                        onChange={e => setAuthAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        placeholder="e.g. Kavre, Panchkhal"
                        required
                        id="auth_input_address"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{t.role}</label>
                      <div className="grid grid-cols-2 gap-3" id="auth_role_selector">
                        <button
                           type="button"
                           onClick={() => setAuthRole("farmer")}
                           className={`py-2 px-4 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                             authRole === "farmer"
                               ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                               : "border-slate-200 text-slate-600 hover:bg-slate-50"
                           }`}
                        >
                          <Sprout className="h-4 w-4" />
                          <span>{t.farmer}</span>
                        </button>

                        <button
                           type="button"
                           onClick={() => setAuthRole("buyer")}
                           className={`py-2 px-4 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                             authRole === "buyer"
                               ? "bg-slate-950 border-slate-950 text-white"
                               : "border-slate-200 text-slate-600 hover:bg-slate-50"
                           }`}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          <span>{t.buyer}</span>
                        </button>
                      </div>
                    </div>

                    {authRole === "farmer" && (
                      <div id="citizenship_input_block">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          {t.citizenship} <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          value={authCitizenship}
                          onChange={e => setAuthCitizenship(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                          placeholder="e.g. 67-20-41-10492"
                          required={authRole === "farmer"}
                          id="auth_input_citizenship"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          {lang === "en" ? "Required for farmer certification to ensure marketplace safety." : "सुरक्षित बजारको सुनिश्चितताका लागि किसानको नागरिकता नम्बर आवश्यक छ।"}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.email}</label>
                  <input 
                    type="email" 
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    placeholder="e.g. farmer@agribridge.com"
                    required
                    id="auth_input_email"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.password}</label>
                  <input 
                    type="password" 
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    placeholder="••••••••"
                    required
                    id="auth_input_password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                  id="auth_btn_submit"
                >
                  {authLoading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{isRegister ? t.register : t.login}</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-slate-200 pt-5">
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-600 hover:underline transition cursor-pointer"
                  id="auth_toggle_register"
                >
                  {isRegister ? t.haveAccount : t.noAccount}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main Dashboard Workspaces */
          <div className="space-y-8" id="dashboard_view">
            
            {/* FARMER WORKSPACE */}
            {user.role === "farmer" && (
              <div className="grid lg:grid-cols-12 gap-8" id="farmer_workspace">
                
                {/* Farmer Left sidebar form & Profile info */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Farmer Verification Alert Badge Card */}
                  <div className={`p-6 rounded-2xl border ${
                    user.citizenship_verified 
                      ? "bg-emerald-50/20 border-emerald-100" 
                      : "bg-amber-50/50 border-amber-200"
                  }`} id="farmer_verification_card">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-xl text-white ${
                        user.citizenship_verified ? "bg-emerald-600" : "bg-amber-500"
                      }`}>
                        {user.citizenship_verified ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">
                          {user.citizenship_verified ? t.citizenshipVerified : t.citizenshipPending}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">
                          {t.citizenship}: {user.citizenship_number}
                        </p>
                        {!user.citizenship_verified && (
                          <p className="text-xs text-amber-800 font-medium leading-relaxed mt-2 bg-white p-3 rounded-lg border border-amber-200">
                            {t.citizenshipAlert}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Harvest Crop Lister Form */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" id="harvest_listing_card">
                    <h3 className="text-lg font-bold font-display text-slate-900 mb-5 flex items-center gap-2">
                      <PlusCircle className="h-5 w-5 text-emerald-600" />
                      <span>{t.addCrop}</span>
                    </h3>

                    {uploadError && (
                      <div className="mb-4 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg font-bold">
                        {uploadError}
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg font-bold">
                        {uploadSuccess}
                      </div>
                    )}

                    <form onSubmit={handlePublishListing} className="space-y-4" id="frm_list_crop">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.cropName}</label>
                        <input 
                          type="text" 
                          value={newCropName}
                          onChange={e => setNewCropName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                          placeholder="e.g. Red Organic Tomatoes (गोलभेडा)"
                          required
                          id="crop_input_name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.category}</label>
                          <select 
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                            id="crop_select_category"
                          >
                            <option value="Vegetables">{t.vegetables}</option>
                            <option value="Fruits">{t.fruits}</option>
                            <option value="Grains">{t.grains}</option>
                            <option value="Herbs">{t.herbs}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.location}</label>
                          <input 
                            type="text" 
                            value={newLocation}
                            onChange={e => setNewLocation(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                            placeholder="e.g. Kavre, Panchkhal"
                            required
                            id="crop_input_location"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.quantity}</label>
                          <input 
                            type="number" 
                            value={newQuantity}
                            onChange={e => setNewQuantity(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                            placeholder="e.g. 500"
                            required
                            min="1"
                            id="crop_input_qty"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.unit}</label>
                          <input 
                            type="text" 
                            value={newUnit}
                            onChange={e => setNewUnit(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                            placeholder="e.g. kg"
                            required
                            id="crop_input_unit"
                          />
                        </div>
                      </div>

                      {/* Reference Pricing Engine and AI Predictor Segment */}
                      <div className="p-4 bg-slate-950 text-white rounded-xl space-y-3" id="ai_pricing_panel">
                        <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-emerald-400" />
                          <span>AI FAIR-PRICING CORE MODULE</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.marketPriceRef}</label>
                            <input 
                              type="number" 
                              value={marketRefPrice}
                              onChange={e => setMarketRefPrice(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-850 text-xs font-bold bg-slate-900 text-white outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="e.g. 90 (NPR)"
                              id="crop_input_ref_price"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              {lang === "en" ? "Market Supply Index" : "बजार आपूर्ति सूचक"}
                            </label>
                            <select
                              value={supplyDemandIndex}
                              onChange={e => setSupplyDemandIndex(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-850 text-xs font-bold bg-slate-900 text-white outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                              id="crop_select_supply_index"
                            >
                              <option value="1.2">Low Supply / High Demand (1.2x)</option>
                              <option value="1.0">Standard Balanced Index (1.0x)</option>
                              <option value="0.85">High Surplus / High Supply (0.85x)</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAiPriceSuggestion}
                          disabled={aiSuggesting || !user.citizenship_verified}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          id="btn_get_ai_suggestion"
                        >
                          {aiSuggesting ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <TrendingUp className="h-4.5 w-4.5" />
                              <span>{t.aiSuggestButton}</span>
                            </>
                          )}
                        </button>

                        {aiSuggestedPrice !== null && (
                          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2 mt-2" id="ai_suggestion_result">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-400">{t.aiSuggestedPrice}:</span>
                              <span className="font-extrabold text-emerald-400 text-sm font-mono">NPR {aiSuggestedPrice} / {newUnit}</span>
                            </div>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium bg-slate-950 p-2 rounded border border-slate-850">
                              {aiAnalysisNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.finalPrice}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">NPR</span>
                          <input 
                            type="number" 
                            value={finalPrice}
                            onChange={e => setFinalPrice(e.target.value)}
                            className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition"
                            placeholder="e.g. 85"
                            required
                            id="crop_input_final_price"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.harvestDate}</label>
                          <input 
                            type="date" 
                            value={harvestDate}
                            onChange={e => setHarvestDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                            id="crop_input_harvest_date"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t.imagePlaceholder}</label>
                          <input 
                            type="text" 
                            value={cropImage}
                            onChange={e => setCropImage(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                            placeholder="Image URL"
                            id="crop_input_image"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!user.citizenship_verified}
                        className={`w-full py-2.5 text-xs text-white font-bold rounded-lg transition-all cursor-pointer ${
                          user.citizenship_verified 
                            ? "bg-emerald-600 hover:bg-emerald-500" 
                            : "bg-slate-300 cursor-not-allowed"
                        }`}
                        id="btn_publish_listing"
                      >
                        {t.publishListing}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Farmer Right columns (My listings & Buyer Orders) */}
                <div className="lg:col-span-7 space-y-8">
                  
                  {/* Farmer incoming orders */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" id="farmer_orders_box">
                    <h3 className="text-lg font-bold font-display text-slate-900 mb-4 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-emerald-600" />
                      <span>{lang === "en" ? "Incoming Buyer Orders" : "उपभोक्ताबाट आएका खरीद अर्डरहरू"} ({orders.length})</span>
                    </h3>

                    {loadingOrders ? (
                      <div className="py-8 text-center text-slate-400">Loading orders...</div>
                    ) : orders.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-medium">
                        {lang === "en" ? "No transaction orders yet." : "अहिलेसम्म कुनै खरीद अर्डर आएको छैन।"}
                      </div>
                    ) : (
                      <div className="space-y-4" id="farmer_orders_list">
                        {orders.map(order => (
                          <div key={order.id} className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-white" id={`farmer_order_${order.id}`}>
                            <div className="flex items-start justify-between flex-wrap gap-2">
                              <div>
                                <h4 className="font-bold text-slate-900 text-base">{order.product_name}</h4>
                                <p className="text-xs text-slate-400 font-medium font-mono mt-0.5">Order ID: {order.id}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                order.status === "pending" ? "bg-amber-50 text-amber-800 border border-amber-100" :
                                order.status === "accepted" ? "bg-indigo-50 text-indigo-800 border border-indigo-100" :
                                order.status === "out_for_delivery" ? "bg-blue-50 text-blue-800 border border-blue-100" :
                                order.status === "delivered" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                                "bg-rose-50 text-rose-800 border border-rose-100"
                              }`}>
                                {lang === "en" ? order.status : t[order.status]}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 border-t border-b border-slate-100 py-3 text-xs">
                              <div>
                                <span className="text-slate-400 block font-medium uppercase text-[9px] tracking-wider">{lang === "en" ? "Quantity" : "परिमाण"}</span>
                                <span className="font-bold text-slate-800">{order.quantity} {order.product_unit}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium uppercase text-[9px] tracking-wider">{lang === "en" ? "Total Revenue" : "कुल रकम"}</span>
                                <span className="font-extrabold text-emerald-700 font-mono">NPR {order.total_amount}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium uppercase text-[9px] tracking-wider">{lang === "en" ? "Buyer Contact" : "उपभोक्ताको विवरण"}</span>
                                <span className="font-bold text-slate-800 block">{order.buyer_name}</span>
                                <span className="text-[10px] text-slate-500 font-mono font-medium">{order.buyer_phone}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium uppercase text-[9px] tracking-wider">{lang === "en" ? "Payment Method" : "भुक्तानी विधि"}</span>
                                <span className="font-bold text-slate-700 block">{order.payment_method}</span>
                                <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">{order.payment_status}</span>
                              </div>
                            </div>

                            {/* Responsive order flow managers */}
                            <div className="mt-4 flex flex-wrap gap-2 justify-end">
                              {order.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                    className="px-3 py-1.5 bg-white text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg border border-rose-100 transition cursor-pointer"
                                  >
                                    {t.cancelOrder}
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, "accepted")}
                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
                                  >
                                    {t.acceptOrder}
                                  </button>
                                </>
                              )}

                              {order.status === "accepted" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "out_for_delivery")}
                                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                  <span>{t.dispatchOrder}</span>
                                </button>
                              )}

                              {order.status === "out_for_delivery" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span>{t.deliverOrder}</span>
                                </button>
                              )}

                              {order.status === "delivered" && (
                                <button
                                  onClick={() => setRatingOrder(order)}
                                  className="px-4 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
                                >
                                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                  <span>{t.rateBuyer}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Farmer listings list */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" id="farmer_listings_box">
                    <h3 className="text-lg font-bold font-display text-slate-900 mb-4 flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-emerald-600" />
                      <span>{t.myProducts}</span>
                    </h3>

                    {products.filter(p => p.farmer_id === user.id).length === 0 ? (
                      <div className="py-10 text-center text-slate-400 font-medium">
                        {lang === "en" ? "No crop listings registered." : "अहिलेसम्म बजारमा कुनै उत्पादन राखिएको छैन।"}
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4" id="farmer_listings_grid">
                        {products.filter(p => p.farmer_id === user.id).map(prod => (
                          <div key={prod.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all flex flex-col justify-between" id={`farmer_product_${prod.id}`}>
                            <div>
                              <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100 relative mb-3">
                                <img 
                                  src={prod.images} 
                                  alt={prod.name} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                                <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  prod.status === "active" ? "bg-emerald-600 text-white" : "bg-slate-400 text-white"
                                }`}>
                                  {prod.status}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm">{prod.name}</h4>
                              <p className="text-xs text-emerald-700 font-bold mt-1">NPR {prod.price_final} / {prod.unit}</p>
                            </div>

                            <div className="border-t border-slate-100 pt-2.5 mt-3 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                              <span>Stock: {prod.quantity} {prod.unit}</span>
                              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3 text-slate-400" /> {prod.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BUYER WORKSPACE (MARKETPLACE) */}
            {user.role === "buyer" && (
              <div className="space-y-8" id="buyer_workspace">
                
                {/* Filters, categories & search panel */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4" id="marketplace_filters">
                  <div className="grid md:grid-cols-12 gap-4">
                    {/* Search query input */}
                    <div className="md:col-span-5 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        placeholder={t.searchPlaceholder}
                        id="mkt_search"
                      />
                    </div>

                    {/* Regional location filter */}
                    <div className="md:col-span-4 relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input 
                        type="text" 
                        value={locationFilter}
                        onChange={e => setLocationFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        placeholder="Filter by harvest region..."
                        id="mkt_location_filter"
                      />
                    </div>

                    {/* Quick Category Tab Selection dropdown */}
                    <div className="md:col-span-3">
                      <select 
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                        id="mkt_category_select"
                      >
                        <option value="all">{t.allCategories}</option>
                        <option value="Vegetables">{t.vegetables}</option>
                        <option value="Fruits">{t.fruits}</option>
                        <option value="Grains">{t.grains}</option>
                        <option value="Herbs">{t.herbs}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Split Marketplace products vs My purchase history orders */}
                <div className="grid lg:grid-cols-12 gap-8">
                  {/* Active Produce Listing Grid */}
                  <div className="lg:col-span-8 space-y-6">
                    <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-emerald-600" />
                      <span>{t.marketplace} ({products.length})</span>
                    </h3>

                    {loadingProducts ? (
                      <div className="py-20 text-center text-slate-400">Loading products...</div>
                    ) : products.length === 0 ? (
                      <div className="py-24 bg-white rounded-xl border border-slate-200 text-center text-slate-400 font-semibold p-8">
                        No fresh crops found matching filter criteria.
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-6" id="buyer_crop_grid">
                        {products.map(prod => (
                          <div key={prod.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition flex flex-col justify-between" id={`buyer_product_${prod.id}`}>
                            <div>
                              {/* Product Crop Visual Hero Card */}
                              <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                                <img 
                                  src={prod.images} 
                                  alt={prod.name} 
                                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm border border-slate-200 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-slate-800 uppercase tracking-wider shadow-sm">
                                  {prod.category}
                                </span>

                                {prod.price_market_ref > prod.price_final && (
                                  <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                    {lang === "en" ? "Fair Buy" : "सुझाव लाभ"}
                                  </span>
                                )}
                              </div>

                              <div className="p-5 space-y-3">
                                <div>
                                  <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{prod.name}</h4>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{prod.location}</span>
                                  </div>
                                </div>

                                <div className="border-t border-b border-slate-100 py-2.5 flex items-center justify-between">
                                  <div className="text-xs">
                                    <span className="text-slate-400 block font-medium uppercase text-[9px] tracking-wider">{lang === "en" ? "Farmer" : "किसानको नाम"}</span>
                                    <span className="font-bold text-slate-800 block">{prod.farmer_name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs bg-amber-50 px-2 py-0.5 border border-amber-100 text-amber-800 rounded-full font-bold">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    <span>{prod.farmer_rating || "New"}</span>
                                  </div>
                                </div>

                                <div className="flex items-end justify-between pt-1">
                                  <div>
                                    <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">{lang === "en" ? "Direct Price" : "सीधा मूल्य"}</span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-base font-extrabold text-emerald-700 font-mono">NPR {prod.price_final}</span>
                                      <span className="text-xs text-slate-400 font-medium">/ {prod.unit}</span>
                                    </div>
                                  </div>

                                  <div className="text-right text-xs font-semibold text-slate-500">
                                    <span>{lang === "en" ? "Available Stock" : "कुल बाँकी"}:</span>
                                    <p className="font-bold text-slate-800">{prod.quantity} {prod.unit}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="px-5 pb-5 pt-1">
                              <button
                                onClick={() => {
                                  setPurchasingProduct(prod);
                                  setOrderQty(1);
                                }}
                                disabled={prod.status === "sold_out"}
                                className={`w-full py-2 rounded-lg font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  prod.status === "sold_out" 
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                }`}
                                id={`btn_buy_${prod.id}`}
                              >
                                <ShoppingBag className="h-4 w-4" />
                                <span>{prod.status === "sold_out" ? "SOLD OUT" : t.buyNow}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Buyer orders lists */}
                  <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-emerald-600" />
                      <span>{t.myOrders} ({orders.length})</span>
                    </h3>

                    {loadingOrders ? (
                      <div className="py-8 text-center text-slate-400">Loading orders...</div>
                    ) : orders.length === 0 ? (
                      <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-400 font-medium">
                        {lang === "en" ? "You haven't ordered yet." : "अहिलेसम्म कुनै खरीद अर्डर गर्नुभएको छैन।"}
                      </div>
                    ) : (
                      <div className="space-y-4" id="buyer_orders_list">
                        {orders.map(order => (
                          <div key={order.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3" id={`buyer_order_${order.id}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{order.product_name}</h4>
                                <span className="text-[10px] text-slate-400 font-mono font-medium block mt-0.5">{order.created_at.split("T")[0]}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                order.status === "pending" ? "bg-amber-50 text-amber-800 border border-amber-100" :
                                order.status === "accepted" ? "bg-indigo-50 text-indigo-800 border border-indigo-100" :
                                order.status === "out_for_delivery" ? "bg-blue-50 text-blue-800 border border-blue-100" :
                                order.status === "delivered" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                                "bg-rose-50 text-rose-800 border border-rose-100"
                              }`}>
                                {lang === "en" ? order.status : t[order.status]}
                              </span>
                            </div>

                            <div className="border-t border-b border-slate-100 py-2 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-slate-400 block text-[9px] font-bold uppercase">{lang === "en" ? "Volume" : "परिमाण"}</span>
                                <span className="font-bold text-slate-800">{order.quantity} {order.product_unit}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 block text-[9px] font-bold uppercase">{lang === "en" ? "Paid" : "कुल रकम"}</span>
                                <span className="font-extrabold text-emerald-700 font-mono">NPR {order.total_amount}</span>
                              </div>
                            </div>

                            <div className="text-xs bg-slate-50 p-2 rounded-lg space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">{lang === "en" ? "Farmer" : "किसान"}:</span>
                                <span className="font-bold text-slate-800">{order.farmer_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">{lang === "en" ? "Farmer Phone" : "किसान फोन"}:</span>
                                <span className="font-semibold text-slate-700 font-mono">{order.farmer_phone}</span>
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              {order.status === "pending" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                  className="px-3 py-1 bg-white text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg border border-rose-100 transition cursor-pointer"
                                >
                                  {t.cancelOrder}
                                </button>
                              )}

                              {order.status === "delivered" && (
                                <button
                                  onClick={() => setRatingOrder(order)}
                                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                                >
                                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                  <span>{t.rateFarmer}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PLATFORM ADMIN CONTROL SYSTEM */}
            {user.role === "admin" && (
              <div className="space-y-6" id="admin_workspace">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <span>{t.adminDashboard}</span>
                  </h3>

                  {/* Tabs switch */}
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-lg text-xs font-bold border border-slate-200" id="admin_tab_switch">
                    <button 
                      onClick={() => setAdminTab("stats")}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${adminTab === "stats" ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      {t.stats}
                    </button>
                    <button 
                      onClick={() => setAdminTab("citizenships")}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${adminTab === "citizenships" ? "bg-white text-slate-900 shadow-sm border border-slate-200/50 animate-pulse" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      <span>{lang === "en" ? "Farmer Citizenships" : "किसान नागरिकता"}</span>
                      {adminStats.pending_citizenships > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                          {adminStats.pending_citizenships}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => setAdminTab("listings")}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${adminTab === "listings" ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      {t.manageListings}
                    </button>
                  </div>
                </div>

                {/* TAB: STATS & SUMMARY METRICS */}
                {adminTab === "stats" && (
                  <div className="space-y-6" id="admin_tab_stats">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">{t.users}</span>
                        <span className="text-2xl font-extrabold text-slate-900 font-display">{adminStats.user_count}</span>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                        <Leaf className="h-5 w-5 text-emerald-600" />
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">{t.activeListings}</span>
                        <span className="text-2xl font-extrabold text-slate-900 font-display">{adminStats.product_count}</span>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">{t.totalOrders}</span>
                        <span className="text-2xl font-extrabold text-slate-900 font-display">{adminStats.order_count}</span>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">{t.totalRevenue}</span>
                        <span className="text-2xl font-extrabold text-slate-900 font-display font-mono">NPR {adminStats.total_revenue}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100/50 space-y-2">
                      <h4 className="font-bold text-emerald-800 text-sm">{lang === "en" ? "System Health & Core Verification Status" : "प्रणाली स्वास्थ्य र मुख्य प्रमाणीकरण स्थिति"}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                        AgriBridge runs an end-to-end sandbox. Farmers must submit their Nepalese Citizenship Card numbers to list products. Admin approvals update the file-system database instantly.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB: CITIZENSHIP VERIFICATIONS */}
                {adminTab === "citizenships" && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="admin_tab_citizenships">
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                      <h4 className="font-bold text-slate-900 text-sm">{lang === "en" ? "Nepalese Citizenships Review" : "नेपाली नागरिकता समीक्षा"}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="p-4">{t.fullName}</th>
                            <th className="p-4">{t.email}</th>
                            <th className="p-4">{t.phone}</th>
                            <th className="p-4">{t.citizenship}</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">{t.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {adminUsers.filter(u => u.role === "farmer").map(farmerUser => (
                            <tr key={farmerUser.id} className="hover:bg-slate-50/40 text-slate-700" id={`admin_user_${farmerUser.id}`}>
                              <td className="p-4 font-bold text-slate-900">{farmerUser.name}</td>
                              <td className="p-4">{farmerUser.email}</td>
                              <td className="p-4 font-mono">{farmerUser.phone}</td>
                              <td className="p-4 font-bold font-mono text-emerald-700">{farmerUser.citizenship_number || "N/A"}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                  farmerUser.citizenship_verified ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-amber-50 text-amber-800 border border-amber-100"
                                }`}>
                                  {farmerUser.citizenship_verified ? "Approved" : "Pending"}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {!farmerUser.citizenship_verified ? (
                                  <button
                                    onClick={() => handleAdminVerifyUser(farmerUser.id, true)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                                  >
                                    {t.verifyCitizenship}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAdminVerifyUser(farmerUser.id, false)}
                                    className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 text-[11px] font-bold rounded-lg border border-rose-100 transition cursor-pointer"
                                  >
                                    Revoke Status
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB: MANAGE LISTINGS */}
                {adminTab === "listings" && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="admin_tab_listings">
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                      <h4 className="font-bold text-slate-900 text-sm">{lang === "en" ? "Active Marketplace Crops Listings" : "सक्रिय बजार बाली सूचीहरू"}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="p-4">{lang === "en" ? "Crop Name" : "बालीको नाम"}</th>
                            <th className="p-4">{t.category}</th>
                            <th className="p-4">{t.location}</th>
                            <th className="p-4">{t.quantity}</th>
                            <th className="p-4">{t.finalPrice}</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">{t.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {adminListings.map(lst => (
                            <tr key={lst.id} className="hover:bg-slate-50/40 text-slate-700" id={`admin_listing_${lst.id}`}>
                              <td className="p-4 font-bold text-slate-900">{lst.name}</td>
                              <td className="p-4">{lst.category}</td>
                              <td className="p-4">{lst.location}</td>
                              <td className="p-4 font-mono">{lst.quantity} {lst.unit}</td>
                              <td className="p-4 font-bold text-emerald-700 font-mono font-bold">NPR {lst.price_final}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                  lst.status === "active" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                                  lst.status === "sold_out" ? "bg-slate-100 text-slate-500 border border-slate-200" :
                                  "bg-rose-50 text-rose-800 border border-rose-100"
                                }`}>
                                  {lst.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {lst.status === "active" ? (
                                  <button
                                    onClick={() => handleAdminToggleListing(lst.id, "unapproved")}
                                    className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 text-[11px] font-bold rounded-lg border border-rose-100 transition cursor-pointer"
                                  >
                                    {t.blockListing}
                                  </button>
                                ) : lst.status === "unapproved" ? (
                                  <button
                                    onClick={() => handleAdminToggleListing(lst.id, "active")}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                                  >
                                    {t.unblockListing}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 italic font-medium">Sold Out</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200/60 bg-white py-6" id="main_footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
          <p>© {new Date().getFullYear()} AgriBridge Nepal. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><HeartHandshake className="h-4 w-4 text-emerald-500" /> {lang === "en" ? "Bilingual English-Nepali Edition" : "द्विभाषी संस्करण"}</span>
          </div>
        </div>
      </footer>

      {/* BUYER PURCHASE QUANTITY MODAL */}
      <AnimatePresence>
        {purchasingProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" id="purchase_modal">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-lg p-6 relative space-y-5"
            >
              <button 
                onClick={() => setPurchasingProduct(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                title={t.close}
              >
                <XCircle className="h-5 w-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full tracking-wide">
                  {purchasingProduct.category}
                </span>
                <h3 className="text-lg font-bold font-display text-slate-900 pr-6">{purchasingProduct.name}</h3>
                <p className="text-xs text-slate-400 font-medium">Farmer: {purchasingProduct.farmer_name} • Rating: {purchasingProduct.farmer_rating || "New"}</p>
              </div>

              <div className="space-y-4">
                {/* Quantity selector counter */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                    <span>{t.orderQuantity} ({purchasingProduct.unit})</span>
                    <span>Max {purchasingProduct.quantity} {purchasingProduct.unit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setOrderQty(q => Math.max(1, q - 1))}
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 rounded-lg cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={orderQty}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 1;
                        setOrderQty(Math.min(purchasingProduct.quantity, Math.max(1, val)));
                      }}
                      className="w-full text-center px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold outline-none"
                    />
                    <button
                      onClick={() => setOrderQty(q => Math.min(purchasingProduct.quantity, q + 1))}
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 rounded-lg cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Payment Selection Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">{t.paymentMethod}</label>
                  <div className="grid grid-cols-2 gap-3" id="modal_payment_methods">
                    <button
                      onClick={() => setPayMethod("COD")}
                      className={`p-3 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                        payMethod === "COD" ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t.cashOnDelivery}
                    </button>
                    <button
                      onClick={() => setPayMethod("Mobile Wallet")}
                      className={`p-3 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                        payMethod === "Mobile Wallet" ? "bg-indigo-50 border-indigo-500 text-indigo-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t.mobileWallet}
                    </button>
                  </div>
                </div>

                {/* Subtotal Calculation */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="text-slate-700">NPR {purchasingProduct.price_final} x {orderQty}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Local Delivery:</span>
                    <span className="text-slate-700">NPR 45</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold text-xs">
                    <span className="text-slate-850">Total Bill Amount:</span>
                    <span className="text-emerald-700 font-mono font-extrabold">NPR {purchasingProduct.price_final * orderQty + 45}</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmPurchase}
                  disabled={placingOrder}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
                  id="btn_confirm_purchase"
                >
                  {placingOrder ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{t.placeOrderButton}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FEEDBACK RATING AND REVIEW MODAL */}
      <AnimatePresence>
        {ratingOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" id="rating_modal">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-lg p-6 relative space-y-5"
            >
              <button 
                onClick={() => setRatingOrder(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                title={t.close}
              >
                <XCircle className="h-5 w-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-base font-bold font-display text-slate-900">
                  {user.role === "buyer" ? t.rateFarmer : t.rateBuyer}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Leave feedback for Order transaction: #{ratingOrder.id}</p>
              </div>

              {ratingError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg font-medium">
                  {ratingError}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4" id="frm_rating_review">
                {/* Star rating selector widget */}
                <div className="flex items-center gap-2 justify-center py-2" id="star_rating_widget">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className="p-1 cursor-pointer transition transform hover:scale-110"
                    >
                      <Star className={`h-8 w-8 ${
                        star <= ratingValue ? "text-amber-400 fill-amber-400" : "text-slate-200"
                      }`} />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Your Comment / Feedback</label>
                  <textarea
                    rows={3}
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-emerald-500 transition outline-none"
                    placeholder={t.feedbackPlaceholder}
                    id="rating_input_comment"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition cursor-pointer text-xs"
                  id="btn_submit_review"
                >
                  {t.submit}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
