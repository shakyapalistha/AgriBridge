import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Ensure data folder or db.json exists
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to load environment variables for local testing if not injected
import dotenv from "dotenv";
dotenv.config();

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: "farmer" | "buyer" | "admin";
  phone: string;
  address: string;
  password_hash: string;
  avg_rating: number;
  citizenship_number: string;
  citizenship_verified: boolean;
  created_at: string;
}

interface Product {
  id: string;
  farmer_id: string;
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
  farmer_id: string;
  product_id: string;
  quantity: number;
  status: "pending" | "accepted" | "out_for_delivery" | "delivered" | "cancelled";
  payment_method: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface DB {
  users: User[];
  products: Product[];
  orders: Order[];
  payments: Payment[];
  reviews: Review[];
}

// Security secret
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_agribridge_12345";

// Password Hashing
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Self-contained Lightweight JWT implementation
function generateToken(user: { id: string; email: string; role: string }): string {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 24 * 3600 * 1000 // 24 hours expiry
  });
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + signature;
}

function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const payload = Buffer.from(parts[0], "base64").toString("utf-8");
    const signature = parts[1];
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
    if (signature !== expectedSignature) return null;
    const data = JSON.parse(payload);
    if (data.exp < Date.now()) return null; // Expired
    return data;
  } catch (e) {
    return null;
  }
}

// Database Operations
function readDb(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Failed to read DB, resetting to empty schema:", e);
  }
  return { users: [], products: [], orders: [], payments: [], reviews: [] };
}

function writeDb(db: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write DB:", e);
  }
}

// Seed Database if empty
function seedDatabase() {
  const db = readDb();
  let updated = false;

  if (db.users.length === 0) {
    console.log("Seeding initial database...");
    
    const farmerPasswordHash = hashPassword("farmer123");
    const buyerPasswordHash = hashPassword("buyer123");
    const adminPasswordHash = hashPassword("admin123");

    const seedUsers: User[] = [
      {
        id: "usr_farmer_1",
        name: "Ram Bahadur",
        email: "farmer@agribridge.com",
        role: "farmer",
        phone: "9841234567",
        address: "Kavre, Panchkhal",
        password_hash: farmerPasswordHash,
        avg_rating: 4.8,
        citizenship_number: "67-20-41-10492",
        citizenship_verified: true,
        created_at: new Date().toISOString()
      },
      {
        id: "usr_buyer_1",
        name: "Sita Devi",
        email: "buyer@agribridge.com",
        role: "buyer",
        phone: "9801234567",
        address: "Kathmandu, Baneshwor",
        password_hash: buyerPasswordHash,
        avg_rating: 4.5,
        citizenship_number: "45-01-72-30291",
        citizenship_verified: true,
        created_at: new Date().toISOString()
      },
      {
        id: "usr_admin_1",
        name: "AgriBridge Admin",
        email: "admin@agribridge.com",
        role: "admin",
        phone: "9851234567",
        address: "Kathmandu, Nepal",
        password_hash: adminPasswordHash,
        avg_rating: 5.0,
        citizenship_number: "01-10-99-99999",
        citizenship_verified: true,
        created_at: new Date().toISOString()
      }
    ];

    db.users = seedUsers;
    updated = true;
  }

  if (db.products.length === 0 && db.users.length > 0) {
    const seedProducts: Product[] = [
      {
        id: "prod_1",
        farmer_id: "usr_farmer_1",
        name: "Fresh Red Organic Tomatoes",
        category: "Vegetables",
        quantity: 350,
        unit: "kg",
        price_market_ref: 95,
        price_ai_suggested: 88,
        price_final: 85,
        harvest_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
        location: "Kavre, Panchkhal",
        images: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400",
        status: "active",
        created_at: new Date().toISOString()
      },
      {
        id: "prod_2",
        farmer_id: "usr_farmer_1",
        name: "Premium Mustang Apples",
        category: "Fruits",
        quantity: 150,
        unit: "kg",
        price_market_ref: 240,
        price_ai_suggested: 220,
        price_final: 215,
        harvest_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
        location: "Mustang, Jomsom",
        images: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400",
        status: "active",
        created_at: new Date().toISOString()
      },
      {
        id: "prod_3",
        farmer_id: "usr_farmer_1",
        name: "Organic Basmati Rice",
        category: "Grains",
        quantity: 500,
        unit: "kg",
        price_market_ref: 120,
        price_ai_suggested: 110,
        price_final: 110,
        harvest_date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
        location: "Chitwan",
        images: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400",
        status: "active",
        created_at: new Date().toISOString()
      }
    ];

    db.products = seedProducts;
    updated = true;
  }

  if (updated) {
    writeDb(db);
  }
}

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Server side Gemini API client initialized successfully.");
  } catch (e) {
    console.error("Failed to initialize Gemini API client:", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize and seed database
  seedDatabase();

  // Middleware: Auth Token Verification
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ detail: "Authentication token missing" });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(403).json({ detail: "Invalid or expired token" });
    }

    req.user = payload;
    next();
  };

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role, phone, address, citizenship_number } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ detail: "Missing required fields (name, email, password, role)" });
    }

    if (!["farmer", "buyer", "admin"].includes(role)) {
      return res.status(400).json({ detail: "Invalid role specified" });
    }

    if (role === "farmer" && !citizenship_number) {
      return res.status(400).json({ detail: "Citizenship number is required for Farmer registration" });
    }

    const db = readDb();
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ detail: "Email address is already registered" });
    }

    const newUser: User = {
      id: "usr_" + crypto.randomUUID(),
      name,
      email,
      role,
      phone: phone || "",
      address: address || "",
      password_hash: hashPassword(password),
      avg_rating: 0,
      citizenship_number: citizenship_number || "",
      // Auto verify for demo/easy testing unless admin blocks/verifies
      citizenship_verified: role === "farmer" ? false : true,
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    // Return the user without the password hash
    const { password_hash, ...userResponse } = newUser;
    res.status(201).json(userResponse);
  });

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: "Email and password are required" });
    }

    const db = readDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(400).json({ detail: "Invalid email or password" });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const { password_hash, ...userResponse } = user;

    res.json({
      access_token: token,
      token_type: "bearer",
      user: userResponse
    });
  });

  // Auth: Get Profile
  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const db = readDb();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }
    const { password_hash, ...userResponse } = user;
    res.json(userResponse);
  });

  // Pricing: Get Suggestion
  app.post("/api/pricing/suggest", async (req, res) => {
    const { category, quantity, location, price_market_ref, supply_demand_signal } = req.body;
    
    if (!category || !quantity || !location || !price_market_ref) {
      return res.status(400).json({ detail: "Missing parameter fields for pricing simulation" });
    }

    const sSignal = supply_demand_signal !== undefined ? parseFloat(supply_demand_signal) : 1.0;
    const qtyNum = parseFloat(quantity);
    const refPrice = parseFloat(price_market_ref);

    let price_ai_suggested = refPrice * sSignal;
    let notes = "Suggested price calculated from local supply & demand index.";

    // Volume discount
    const discount = Math.min(0.15, (qtyNum / 2000) * 0.15);
    if (discount > 0) {
      price_ai_suggested *= (1.0 - discount);
      notes += ` Volume discount of ${(discount * 100).toFixed(1)}% applied for higher volume list size.`;
    }

    // Regional transport modifier
    const lowLoc = location.toLowerCase();
    if (lowLoc.includes("mustang") || lowLoc.includes("jomsom") || lowLoc.includes("remote")) {
      price_ai_suggested *= 1.08;
      notes += " Adjusted upwards by 8% due to remote mountain transport overhead.";
    } else if (lowLoc.includes("kathmandu") || lowLoc.includes("lalitpur") || lowLoc.includes("bhaktapur")) {
      price_ai_suggested *= 0.96;
      notes += " Adjusted downwards by 4% due to proximity to primary urban retail networks.";
    }

    price_ai_suggested = Math.round(price_ai_suggested * 100) / 100;

    // Call Gemini API if key is set
    if (aiClient) {
      try {
        const prompt = `You are AgriBridge's smart agricultural pricing advisor for Nepalese local markets.
        Calculate a fair-trade target suggested price (in NPR per Unit) for the following product crop:
        - Category: ${category}
        - Quantity: ${quantity} units
        - Location: ${location}
        - Current baseline Market Reference price: NPR ${price_market_ref}
        - Supply/Demand Signal Factor: ${sSignal} (e.g. 1.0 is standard, >1.0 is low supply/high demand, <1.0 is surplus supply)

        Evaluate logistics, seasonal supply, region transport costs and fair trade criteria.
        Format your response strictly as a JSON object containing EXACTLY:
        {
          "suggested_price": <number>,
          "analysis": "<short 1-2 sentence explanation of your fair price pricing logic>"
        }`;

        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const textResponse = response.text?.trim() || "";
        if (textResponse) {
          const result = JSON.parse(textResponse);
          if (result.suggested_price && typeof result.suggested_price === "number") {
            price_ai_suggested = result.suggested_price;
            notes = result.analysis || notes;
          }
        }
      } catch (geminiError) {
        console.warn("Gemini pricing generation failed, using rule-based formula:", geminiError);
      }
    }

    res.json({
      price_market_ref: refPrice,
      price_ai_suggested,
      supply_demand_signal: sSignal,
      notes
    });
  });

  // Products: Get List
  app.get("/api/products", (req, res) => {
    const { category, location, search } = req.query;
    const db = readDb();
    
    let filtered = db.products.filter(p => p.status === "active" || p.status === "sold_out");

    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }

    if (location) {
      filtered = filtered.filter(p => p.location.toLowerCase().includes(String(location).toLowerCase()));
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    }

    // Attach farmer names and ratings
    const productsWithFarmers = filtered.map(p => {
      const farmer = db.users.find(u => u.id === p.farmer_id);
      return {
        ...p,
        farmer_name: farmer ? farmer.name : "Unknown Farmer",
        farmer_rating: farmer ? farmer.avg_rating : 0
      };
    });

    res.json(productsWithFarmers);
  });

  // Products: Get Single Details
  app.get("/api/products/:id", (req, res) => {
    const db = readDb();
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ detail: "Product crop not found" });
    }

    const farmer = db.users.find(u => u.id === product.farmer_id);
    res.json({
      ...product,
      farmer_name: farmer ? farmer.name : "Unknown Farmer",
      farmer_rating: farmer ? farmer.avg_rating : 0,
      farmer_phone: farmer ? farmer.phone : ""
    });
  });

  // Products: Create Product
  app.post("/api/products", authenticateToken, (req: any, res) => {
    if (req.user.role !== "farmer") {
      return res.status(403).json({ detail: "Only registered farmers can upload products" });
    }

    const db = readDb();
    const farmer = db.users.find(u => u.id === req.user.id);
    if (!farmer) {
      return res.status(404).json({ detail: "Farmer profile not found" });
    }

    if (!farmer.citizenship_verified) {
      return res.status(403).json({ detail: "Your registration citizenship details must be approved by an administrator before listing products." });
    }

    const { name, category, quantity, unit, price_market_ref, price_ai_suggested, price_final, harvest_date, location, images } = req.body;
    
    if (!name || !category || !quantity || !unit || !price_final || !location) {
      return res.status(400).json({ detail: "Missing product details (name, category, quantity, unit, price_final, location)" });
    }

    const newProduct: Product = {
      id: "prod_" + crypto.randomUUID(),
      farmer_id: req.user.id,
      name,
      category,
      quantity: parseFloat(quantity),
      unit,
      price_market_ref: parseFloat(price_market_ref || price_final),
      price_ai_suggested: parseFloat(price_ai_suggested || price_final),
      price_final: parseFloat(price_final),
      harvest_date: harvest_date || new Date().toISOString().split("T")[0],
      location,
      images: images || "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400",
      status: "active",
      created_at: new Date().toISOString()
    };

    db.products.push(newProduct);
    writeDb(db);

    res.status(201).json(newProduct);
  });

  // Orders: Create Order (Buy)
  app.post("/api/orders", authenticateToken, (req: any, res) => {
    if (req.user.role !== "buyer") {
      return res.status(403).json({ detail: "Only buyers can place purchase orders" });
    }

    const { product_id, quantity, payment_method } = req.body;
    if (!product_id || !quantity || !payment_method) {
      return res.status(400).json({ detail: "Missing required order details" });
    }

    const db = readDb();
    const product = db.products.find(p => p.id === product_id);
    if (!product) {
      return res.status(404).json({ detail: "Product not found" });
    }

    if (product.status !== "active") {
      return res.status(400).json({ detail: "Product is no longer available" });
    }

    const orderQty = parseFloat(quantity);
    if (product.quantity < orderQty) {
      return res.status(400).json({ detail: `Insufficient stock. Only ${product.quantity} ${product.unit} available.` });
    }

    // Deduct quantity
    product.quantity -= orderQty;
    if (product.quantity <= 0) {
      product.status = "sold_out";
    }

    const total_amount = product.price_final * orderQty;
    const orderId = "ord_" + crypto.randomUUID();

    const newOrder: Order = {
      id: orderId,
      buyer_id: req.user.id,
      farmer_id: product.farmer_id,
      product_id: product.id,
      quantity: orderQty,
      status: "pending",
      payment_method,
      total_amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newPayment: Payment = {
      id: "pay_" + crypto.randomUUID(),
      order_id: orderId,
      amount: total_amount,
      method: payment_method,
      status: payment_method === "COD" ? "pending" : "completed", // Wallets auto succeed
      created_at: new Date().toISOString()
    };

    db.orders.push(newOrder);
    db.payments.push(newPayment);
    writeDb(db);

    console.log(`[ORDER CREATED] Order ${orderId} placed for product ${product.id}. [PAYMENT STUB - Method: ${payment_method}]`);

    res.status(201).json(newOrder);
  });

  // Orders: Get Current User's Orders
  app.get("/api/orders", authenticateToken, (req: any, res) => {
    const db = readDb();
    let userOrders: Order[] = [];

    if (req.user.role === "farmer") {
      userOrders = db.orders.filter(o => o.farmer_id === req.user.id);
    } else if (req.user.role === "buyer") {
      userOrders = db.orders.filter(o => o.buyer_id === req.user.id);
    } else if (req.user.role === "admin") {
      userOrders = db.orders;
    }

    // Expand products & counterparties
    const expanded = userOrders.map(o => {
      const product = db.products.find(p => p.id === o.product_id);
      const buyer = db.users.find(u => u.id === o.buyer_id);
      const farmer = db.users.find(u => u.id === o.farmer_id);
      const payment = db.payments.find(p => p.order_id === o.id);
      
      return {
        ...o,
        product_name: product ? product.name : "Deleted Crop",
        product_unit: product ? product.unit : "kg",
        buyer_name: buyer ? buyer.name : "Unknown Buyer",
        buyer_phone: buyer ? buyer.phone : "",
        farmer_name: farmer ? farmer.name : "Unknown Farmer",
        farmer_phone: farmer ? farmer.phone : "",
        payment_status: payment ? payment.status : "pending"
      };
    });

    res.json(expanded);
  });

  // Orders: Update status (accepted, out_for_delivery, delivered, cancelled)
  app.put("/api/orders/:id/status", authenticateToken, (req: any, res) => {
    const { status_update } = req.body;
    if (!status_update) {
      return res.status(400).json({ detail: "Missing 'status_update' property in payload" });
    }

    const validStatuses = ["pending", "accepted", "out_for_delivery", "delivered", "cancelled"];
    if (!validStatuses.includes(status_update)) {
      return res.status(400).json({ detail: "Invalid status update value" });
    }

    const db = readDb();
    const orderIndex = db.orders.findIndex(o => o.id === req.params.id);
    if (orderIndex === -1) {
      return res.status(404).json({ detail: "Order not found" });
    }

    const order = db.orders[orderIndex];

    // Access control
    if (req.user.role === "farmer" && order.farmer_id !== req.user.id) {
      return res.status(403).json({ detail: "You are not authorized to modify this order" });
    }
    if (req.user.role === "buyer" && order.buyer_id !== req.user.id) {
      return res.status(403).json({ detail: "You are not authorized to modify this order" });
    }

    // Buyers can only cancel pending orders
    if (req.user.role === "buyer" && status_update !== "cancelled") {
      return res.status(403).json({ detail: "Buyers can only cancel pending orders" });
    }

    // Restore stock if cancelled
    if (status_update === "cancelled" && order.status !== "cancelled") {
      const product = db.products.find(p => p.id === order.product_id);
      if (product) {
        product.quantity += order.quantity;
        if (product.status === "sold_out") {
          product.status = "active";
        }
      }
    }

    // Payment auto-completes on delivery for COD
    if (status_update === "delivered") {
      const payment = db.payments.find(p => p.order_id === order.id);
      if (payment) {
        payment.status = "completed";
      }
    }

    order.status = status_update;
    order.updated_at = new Date().toISOString();

    writeDb(db);

    console.log(`[ORDER UPDATED] Order ${order.id} status changed to ${status_update}. [NOTIFICATIONS STUB - Dispatched notification log]`);

    res.json(order);
  });

  // Reviews: Create Two-Way Review
  app.post("/api/reviews", authenticateToken, (req: any, res) => {
    const { order_id, rating, comment } = req.body;
    
    if (!order_id || !rating) {
      return res.status(400).json({ detail: "Missing order_id or rating" });
    }

    const db = readDb();
    const order = db.orders.find(o => o.id === order_id);
    if (!order) {
      return res.status(404).json({ detail: "Order not found" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ detail: "Reviews can only be left for delivered/completed orders" });
    }

    // Check if user is counterpart
    let reviewee_id = "";
    if (req.user.id === order.buyer_id) {
      reviewee_id = order.farmer_id;
    } else if (req.user.id === order.farmer_id) {
      reviewee_id = order.buyer_id;
    } else {
      return res.status(403).json({ detail: "You are not part of this order transaction" });
    }

    // Avoid multiple reviews
    const alreadyReviewed = db.reviews.some(r => r.order_id === order_id && r.reviewer_id === req.user.id);
    if (alreadyReviewed) {
      return res.status(400).json({ detail: "You have already submitted a rating review for this order transaction" });
    }

    const newReview: Review = {
      id: "rev_" + crypto.randomUUID(),
      order_id,
      reviewer_id: req.user.id,
      reviewee_id,
      rating: parseFloat(rating),
      comment: comment || "",
      created_at: new Date().toISOString()
    };

    db.reviews.push(newReview);

    // Roll up average rating for reviewee
    const allReviewsForUser = db.reviews.filter(r => r.reviewee_id === reviewee_id);
    const sum = allReviewsForUser.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / allReviewsForUser.length;

    const user = db.users.find(u => u.id === reviewee_id);
    if (user) {
      user.avg_rating = Math.round(avg * 10) / 10;
    }

    writeDb(db);
    res.status(201).json(newReview);
  });

  // Reviews: Get received reviews
  app.get("/api/reviews/user/:userId", (req, res) => {
    const db = readDb();
    const userReviews = db.reviews.filter(r => r.reviewee_id === req.params.userId);
    
    // Attach reviewer name
    const enriched = userReviews.map(r => {
      const reviewer = db.users.find(u => u.id === r.reviewer_id);
      return {
        ...r,
        reviewer_name: reviewer ? reviewer.name : "Anonymous User"
      };
    });

    res.json(enriched);
  });

  // --- ADMIN ROUTES ---

  // Admin stats
  app.get("/api/admin/stats", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ detail: "Admin privileges required" });
    }

    const db = readDb();
    const user_count = db.users.length;
    const product_count = db.products.filter(p => p.status === "active").length;
    const order_count = db.orders.length;
    
    // Total revenue from completed payments
    const completedPayments = db.payments.filter(p => p.status === "completed");
    const total_revenue = completedPayments.reduce((acc, p) => acc + p.amount, 0);

    const pending_citizenships = db.users.filter(u => u.role === "farmer" && !u.citizenship_verified).length;

    res.json({
      user_count,
      product_count,
      order_count,
      total_revenue,
      pending_citizenships
    });
  });

  // Admin list users
  app.get("/api/admin/users", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ detail: "Admin privileges required" });
    }
    const db = readDb();
    res.json(db.users.map(({ password_hash, ...u }) => u));
  });

  // Admin list all listings
  app.get("/api/admin/listings", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ detail: "Admin privileges required" });
    }
    const db = readDb();
    res.json(db.products);
  });

  // Admin approve/unapprove listing
  app.put("/api/admin/listings/:id/approve", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ detail: "Admin privileges required" });
    }

    const { status } = req.body;
    if (!status || !["active", "unapproved"].includes(status)) {
      return res.status(400).json({ detail: "Invalid approval status" });
    }

    const db = readDb();
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ detail: "Product not found" });
    }

    product.status = status as any;
    writeDb(db);

    res.json(product);
  });

  // Admin verify citizenship
  app.put("/api/admin/users/:id/verify-citizenship", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ detail: "Admin privileges required" });
    }

    const { verified } = req.body;
    if (verified === undefined) {
      return res.status(400).json({ detail: "Missing 'verified' flag" });
    }

    const db = readDb();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    user.citizenship_verified = !!verified;
    writeDb(db);

    res.json({ id: user.id, name: user.name, citizenship_verified: user.citizenship_verified });
  });

  // --- VITE DEV SERVER & STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
