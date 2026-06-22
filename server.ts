import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware
  const { requireAuth } = await import("./src/middleware/auth.ts");
  const { 
    getOrCreateUser, 
    getUserTraders, 
    createTrader, 
    deleteTrader, 
    getUserProducts, 
    createProduct, 
    createProductsBulk,
    adjustStock, 
    deleteProduct, 
    createPOSOrder, 
    getUserOrders,
    getAllOrders,
    getAllUsers,
    updateUserRole,
    updateTraderSubscription
  } = await import("./src/db/queries.ts");

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/me", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/traders", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      if (user.role !== 'back-office') {
        return res.status(403).json({ error: "Only back-office users can view traders list." });
      }
      const list = await getUserTraders(user.id);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/traders", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      if (user.role !== 'back-office') {
        return res.status(403).json({ error: "Only back-office users can onboard traders." });
      }
      const trader = await createTrader(user.id, req.body);
      res.json(trader);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/traders/:id", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      if (user.role !== 'back-office') {
        return res.status(403).json({ error: "Only back-office users can delete traders." });
      }
      await deleteTrader(user.id, parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/traders/:id/subscription", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const traderId = parseInt(req.params.id);
      const { plan, status } = req.body;
      
      // Admin can update any trader subscription; a trader can only update their own linked subscription
      if (user.role !== 'back-office' && user.traderId !== traderId) {
        return res.status(403).json({ error: "Access denied. You can only manage your own subscription plan." });
      }

      if (plan !== 'Basic' && plan !== 'Pro' && plan !== 'Enterprise') {
        return res.status(400).json({ error: "Invalid subscription plan specified." });
      }

      if (status !== 'active' && status !== 'pending' && status !== 'inactive') {
        return res.status(400).json({ error: "Invalid subscription status specified." });
      }

      const updated = await updateTraderSubscription(traderId, plan, status);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Management Roles API
  app.get("/api/users", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      if (user.role !== 'back-office') {
        return res.status(403).json({ error: "Only back-office users can view the users list." });
      }
      const list = await getAllUsers();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id/role", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      if (user.role !== 'back-office') {
        return res.status(403).json({ error: "Only back-office users can update user roles." });
      }
      const targetUserId = parseInt(req.params.id);
      if (targetUserId === user.id) {
        return res.status(400).json({ error: "You cannot change your own role to prevent lockout." });
      }
      const { role } = req.body;
      if (role !== 'back-office' && role !== 'trader') {
        return res.status(400).json({ error: "Invalid role specified." });
      }
      const updated = await updateUserRole(targetUserId, role);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Product & Inventory API
  app.get("/api/products", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const list = await getUserProducts(user.id);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/products", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const product = await createProduct(user.id, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/products/bulk", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid payload format. Expected an array of products." });
      }
      const list = await createProductsBulk(user.id, items);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/products/:id/stock", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const { change, reason } = req.body;
      const updated = await adjustStock(user.id, parseInt(req.params.id), change, reason);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      await deleteProduct(user.id, parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POS API
  app.get("/api/pos/orders", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      let orders;
      if (user.role === 'back-office') {
        orders = await getAllOrders();
      } else {
        orders = await getUserOrders(user.id);
      }
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/pos/checkout", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const order = await createPOSOrder(user.id, req.body);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/pos/orders/sync", requireAuth, async (req: any, res) => {
    try {
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const { orders } = req.body;
      if (!Array.isArray(orders)) {
        return res.status(400).json({ error: "Invalid payload format. Expected an array of orders." });
      }

      const results = [];
      const { createPOSOrder: createOrderFunc } = await import("./src/db/queries.ts");
      for (const orderData of orders) {
        try {
          const created = await createOrderFunc(user.id, {
            totalAmount: orderData.totalAmount,
            paymentMethod: orderData.paymentMethod || 'cash',
            items: orderData.items || []
          });
          results.push({ orderNumber: created.orderNumber, success: true });
        } catch (itemErr: any) {
          results.push({ success: false, error: itemErr.message });
        }
      }
      res.json({ success: true, processed: results.length, details: results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
