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
    // Groceries (Fruits & Veggies)
    { name: "Tomatoes (1kg)", sku: "VEG-TOM", price: 12000, stock: 100, category: "Produce" },
    { name: "Onions (1kg)", sku: "VEG-ONN", price: 10000, stock: 150, category: "Produce" },
    { name: "Potatoes (1kg)", sku: "VEG-POT", price: 15000, stock: 200, category: "Produce" },
    { name: "Cabbage (per head)", sku: "VEG-CAB", price: 8000, stock: 80, category: "Produce" },
    { name: "Carrots (1kg)", sku: "VEG-CAR", price: 9000, stock: 120, category: "Produce" },
    { name: "Bananas (bunch)", sku: "FRU-BAN", price: 25000, stock: 50, category: "Produce" },

    // Dairy & Bakery
    { name: "Milk 1L (Fresh)", sku: "DAY-MLK-1L", price: 16000, stock: 60, category: "Dairy" },
    { name: "White Bread (400g)", sku: "BAK-BRD-SLC", price: 6500, stock: 40, category: "Bakery" },
    { name: "Eggs (Tray of 30)", sku: "DAY-EGG-TR", price: 45000, stock: 30, category: "Dairy" },

    // Pantry Essentials
    { name: "Elianto Oil 2L", sku: "OIL-ELI-2L", price: 65000, stock: 50, category: "Pantry" },
    { name: "Sugar 1kg", sku: "PAN-SUG-1K", price: 18000, stock: 100, category: "Pantry" },
    { name: "Rice 1kg (Basmati)", sku: "PAN-RIC-1K", price: 24000, stock: 80, category: "Pantry" },
    { name: "Wheat Flour 2kg", sku: "PAN-WHT-2K", price: 19500, stock: 120, category: "Pantry" },

    // Beverages
    { name: "Coke 500ml", sku: "SDA-COK-500", price: 8000, stock: 200, category: "Soda" },
    { name: "Fanta Orange 500ml", sku: "SDA-FAN-500", price: 8000, stock: 150, category: "Soda" },
    { name: "Drinking Water 1.5L", sku: "BEV-WAT-15", price: 6000, stock: 100, category: "Water" }
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
  try {
    const orders = await db.query.posOrders.findMany({
      where: eq(posOrders.userId, userId),
      with: {
        items: true,
        owner: {
          with: {
            traders: true
          }
        }
      },
      orderBy: [desc(posOrders.createdAt)],
    });

    return orders.map(order => ({
      ...order,
      sellerEmail: order.owner?.email,
      sellerName: order.owner?.traders?.[0]?.fullName
    }));
  } catch (error) {
    console.error("Database query failed (getUserOrders):", error);
    throw new Error("Failed to fetch user orders.", { cause: error });
  }
}

export async function getAllOrders() {
  try {
    const orders = await db.query.posOrders.findMany({
      with: {
        items: true,
        owner: {
          with: {
            traders: true
          }
        }
      },
      orderBy: [desc(posOrders.createdAt)],
    });

    return orders.map(order => ({
      ...order,
      sellerEmail: order.owner?.email,
      sellerName: order.owner?.traders?.[0]?.fullName
    }));
  } catch (error) {
    console.error("Database query failed (getAllOrders):", error);
    throw new Error("Failed to fetch all orders.", { cause: error });
  }
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



