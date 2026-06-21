import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role', { enum: ['back-office', 'trader'] }).notNull().default('trader'),
  traderId: integer('trader_id'), // Link to traders table if specific trader
  createdAt: timestamp('created_at').defaultNow(),
});

export const traders = pgTable('traders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  location: text('location'),
  plan: text('plan', { enum: ['Basic', 'Pro', 'Enterprise'] }).notNull().default('Basic'),
  status: text('status', { enum: ['active', 'pending', 'inactive'] }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  price: integer('price').notNull(), // price in cents
  stock: integer('stock').notNull().default(0),
  category: text('category').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stockLogs = pgTable('stock_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  change: integer('change').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posOrders = pgTable('pos_orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  orderNumber: text('order_number').notNull(),
  totalAmount: integer('total_amount').notNull(),
  paymentMethod: text('payment_method', { enum: ['cash', 'card', 'mobile'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posOrderItems = pgTable('pos_order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => posOrders.id)
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  totalPrice: integer('total_price').notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  traders: many(traders, { relationName: 'userTraders' }),
  products: many(products),
  posOrders: many(posOrders, { relationName: 'userOrders' }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  owner: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  logs: many(stockLogs),
  orderItems: many(posOrderItems),
}));

export const stockLogsRelations = relations(stockLogs, ({ one }) => ({
  user: one(users, {
    fields: [stockLogs.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [stockLogs.productId],
    references: [products.id],
  }),
}));

export const posOrdersRelations = relations(posOrders, ({ one, many }) => ({
  owner: one(users, {
    fields: [posOrders.userId],
    references: [users.id],
    relationName: 'userOrders',
  }),
  items: many(posOrderItems, { relationName: 'orderItems' }),
}));

export const posOrderItemsRelations = relations(posOrderItems, ({ one }) => ({
  order: one(posOrders, {
    fields: [posOrderItems.orderId],
    references: [posOrders.id],
    relationName: 'orderItems',
  }),
  product: one(products, {
    fields: [posOrderItems.productId],
    references: [products.id],
  }),
}));

export const tradersRelations = relations(traders, ({ one }) => ({
  owner: one(users, {
    fields: [traders.userId],
    references: [users.id],
    relationName: 'userTraders',
  }),
}));

