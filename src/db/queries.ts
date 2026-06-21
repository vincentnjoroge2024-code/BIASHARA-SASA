import { db } from './index.ts';
import { users, traders, products, stockLogs, posOrders, posOrderItems } from './schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    // Check if user exists
    const existingUsers = await db.select().from(users).limit(1);
    const isFirstUser = existingUsers.length === 0;

    // Check if email matches a trader
    const matchingTrader = await db.select()
      .from(traders)
      .where(eq(traders.email, email))
      .limit(1);

    const isSpecialAdmin = email.toLowerCase() === 'njoroge@biasharasasa.com';
    const initialRole = (isFirstUser || isSpecialAdmin) ? 'back-office' : (matchingTrader.length > 0 ? 'trader' : 'trader');
    const traderId = matchingTrader.length > 0 ? matchingTrader[0].id : null;

    const result = await db.insert(users)
      .values({ 
        uid, 
        email, 
        role: initialRole as any,
        traderId: traderId as any
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: isSpecialAdmin ? { 
          email,
          role: 'back-office' as any,
          traderId: traderId as any
        } : {
          email,
          traderId: traderId as any
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database query failed (getOrCreateUser):", error);
    throw new Error("Database error occurred while sync user profile.", { cause: error });
  }
}

// Trader Queries
export async function getUserTraders(userId: number) {
  try {
    return await db.select()
      .from(traders)
      .where(eq(traders.userId, userId))
      .orderBy(desc(traders.createdAt));
  } catch (error) {
    console.error("Database query failed (getUserTraders):", error);
    throw new Error("Failed to fetch traders.", { cause: error });
  }
}

export async function createTrader(userId: number, data: { fullName: string; email: string; phone?: string; location?: string; plan: string; status: string }) {
  try {
    const result = await db.insert(traders)
      .values({ 
        userId, 
        fullName: data.fullName, 
        email: data.email, 
        phone: data.phone, 
        location: data.location, 
        plan: data.plan as any, 
        status: data.status as any 
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database query failed (createTrader):", error);
    throw new Error("Failed to onboard trader.", { cause: error });
  }
}

export async function deleteTrader(userId: number, traderId: number) {
    try {
      return await db.delete(traders)
        .where(and(eq(traders.id, traderId), eq(traders.userId, userId)))
        .returning();
    } catch (error) {
      console.error("Database query failed (deleteTrader):", error);
      throw new Error("Failed to delete trader record.", { cause: error });
    }
  }

// Product & Inventory Queries
export async function getUserProducts(userId: number) {
  const existing = await db.select()
    .from(products)
    .where(eq(products.userId, userId))
    .orderBy(products.name);

  // List of standard products requested by the user to add to stock
  const defaultProducts = [
    // Soaps
    { name: "Omo", sku: "SOP-OMO", price: 150, stock: 100, category: "Soaps" },
    { name: "Bar soap", sku: "SOP-BAR", price: 100, stock: 200, category: "Soaps" },
    { name: "Detergent", sku: "SOP-DET", price: 350, stock: 500, category: "Soaps" },
    { name: "Rexona", sku: "SOP-REX", price: 240, stock: 240, category: "Soaps" },
    { name: "Geisha", sku: "SOP-GEI", price: 120, stock: 300, category: "Soaps" },
    { name: "Blue soap", sku: "SOP-BLU", price: 110, stock: 150, category: "Soaps" },

    // Juices
    { name: "Embe Juice", sku: "JUC-EMB", price: 120, stock: 50, category: "Juices" },
    { name: "Kevian Juice", sku: "JUC-KEV", price: 150, stock: 100, category: "Juices" },
    { name: "Delmonte", sku: "JUC-DEL", price: 250, stock: 300, category: "Juices" },
    { name: "Ginger flavour", sku: "JUC-GIN", price: 180, stock: 250, category: "Juices" },

    // Soda
    { name: "Fanta", sku: "SDA-FAN", price: 80, stock: 80, category: "Soda" },
    { name: "Coke", sku: "SDA-COK", price: 80, stock: 80, category: "Soda" },
    { name: "Sprite", sku: "SDA-SPR", price: 80, stock: 80, category: "Soda" },
    { name: "Krest", sku: "SDA-KRE", price: 80, stock: 80, category: "Soda" },

    // Oils
    { name: "Elianto Oil", sku: "OIL-ELI", price: 300, stock: 120, category: "Oils" },
    { name: "Jamia Oil", sku: "OIL-JAM", price: 280, stock: 125, category: "Oils" },
    { name: "Salama Oil", sku: "OIL-SAL", price: 290, stock: 130, category: "Oils" },
    { name: "Raha Oil", sku: "OIL-RAH", price: 270, stock: 120, category: "Oils" }
  ];

  let addedNew = false;
  for (const item of defaultProducts) {
    const isMissing = !existing.some(p => p.sku === item.sku || p.name.toLowerCase() === item.name.toLowerCase());
    if (isMissing) {
      try {
        const [product] = await db.insert(products)
          .values({
            userId,
            name: item.name,
            sku: item.sku,
            price: item.price,
            stock: item.stock,
            category: item.category
          })
          .returning();

        await db.insert(stockLogs)
          .values({
            userId,
            productId: product.id,
            change: item.stock,
            reason: 'Initial opening stock',
          });
        addedNew = true;
      } catch (err) {
        console.error(`Failed to auto-seed product ${item.name}:`, err);
      }
    }
  }

  if (addedNew) {
    return await db.select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(products.name);
  }

  return existing;
}

export async function createProduct(userId: number, data: { name: string; sku: string; price: number; category: string; initialStock: number }) {
  return await db.transaction(async (tx) => {
    const [product] = await tx.insert(products)
      .values({
        userId,
        name: data.name,
        sku: data.sku,
        price: data.price,
        stock: data.initialStock,
        category: data.category,
      })
      .returning();

    if (data.initialStock > 0) {
      await tx.insert(stockLogs)
        .values({
          userId,
          productId: product.id,
          change: data.initialStock,
          reason: 'Initial stock',
        });
    }

    return product;
  });
}

export async function adjustStock(userId: number, productId: number, change: number, reason: string) {
  return await db.transaction(async (tx) => {
    const [product] = await tx.select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.userId, userId)));

    if (!product) throw new Error("Product not found");

    const newStock = product.stock + change;
    if (newStock < 0) throw new Error("Insufficient stock");

    await tx.update(products)
      .set({ stock: newStock })
      .where(eq(products.id, productId));

    await tx.insert(stockLogs)
      .values({
        userId,
        productId,
        change,
        reason,
      });

    return { ...product, stock: newStock };
  });
}

export async function deleteProduct(userId: number, productId: number) {
    // Delete logs first
    await db.delete(stockLogs).where(eq(stockLogs.productId, productId));
    return await db.delete(products)
      .where(and(eq(products.id, productId), eq(products.userId, userId)))
      .returning();
}

// POS Queries
export async function createPOSOrder(userId: number, data: { totalAmount: number; paymentMethod: string; items: any[] }) {
  return await db.transaction(async (tx) => {
    const orderNumber = `BS-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const [order] = await tx.insert(posOrders)
      .values({
        userId,
        orderNumber,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod as any,
      })
      .returning();

    for (const item of data.items) {
      await tx.insert(posOrderItems)
        .values({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });

      // Adjust stock
      const [product] = await tx.select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (product) {
        await tx.update(products)
          .set({ stock: product.stock - item.quantity })
          .where(eq(products.id, item.productId));

        await tx.insert(stockLogs)
          .values({
            userId,
            productId: item.productId,
            change: -item.quantity,
            reason: `Order ${orderNumber}`,
          });
      }
    }

    return { ...order, items: data.items };
  });
}

export async function getUserOrders(userId: number) {
    return await db.select({
      id: posOrders.id,
      userId: posOrders.userId,
      orderNumber: posOrders.orderNumber,
      totalAmount: posOrders.totalAmount,
      paymentMethod: posOrders.paymentMethod,
      createdAt: posOrders.createdAt,
      sellerEmail: users.email,
      sellerName: traders.fullName,
    })
      .from(posOrders)
      .where(eq(posOrders.userId, userId))
      .leftJoin(users, eq(posOrders.userId, users.id))
      .leftJoin(traders, eq(users.traderId, traders.id))
      .orderBy(desc(posOrders.createdAt));
}

export async function getAllOrders() {
    return await db.select({
      id: posOrders.id,
      userId: posOrders.userId,
      orderNumber: posOrders.orderNumber,
      totalAmount: posOrders.totalAmount,
      paymentMethod: posOrders.paymentMethod,
      createdAt: posOrders.createdAt,
      sellerEmail: users.email,
      sellerName: traders.fullName,
    })
      .from(posOrders)
      .leftJoin(users, eq(posOrders.userId, users.id))
      .leftJoin(traders, eq(users.traderId, traders.id))
      .orderBy(desc(posOrders.createdAt));
}

export async function getAllUsers() {
  try {
    return await db.select()
      .from(users)
      .orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("Database query failed (getAllUsers):", error);
    throw new Error("Failed to fetch registered users.", { cause: error });
  }
}

export async function updateUserRole(userId: number, role: 'back-office' | 'trader') {
  try {
    const result = await db.update(users)
      .set({ role: role as any })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database query failed (updateUserRole):", error);
    throw new Error("Failed to update user role.", { cause: error });
  }
}

export async function updateTraderSubscription(traderId: number, plan: 'Basic' | 'Pro' | 'Enterprise', status: 'active' | 'pending' | 'inactive') {
  try {
    const result = await db.update(traders)
      .set({ plan: plan as any, status: status as any })
      .where(eq(traders.id, traderId))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database query failed (updateTraderSubscription):", error);
    throw new Error("Failed to update trader subscription.", { cause: error });
  }
}

export async function createProductsBulk(userId: number, items: Array<{ name: string; sku: string; price: number; category: string; initialStock: number }>) {
  return await db.transaction(async (tx) => {
    const inserted = [];
    for (const item of items) {
      const [product] = await tx.insert(products)
        .values({
          userId,
          name: item.name,
          sku: item.sku,
          price: item.price,
          stock: item.initialStock,
          category: item.category,
        })
        .returning();

      if (item.initialStock > 0) {
        await tx.insert(stockLogs)
          .values({
            userId,
            productId: product.id,
            change: item.initialStock,
            reason: 'Bulk stock upload',
          });
      }
      inserted.push(product);
    }
    return inserted;
  });
}



