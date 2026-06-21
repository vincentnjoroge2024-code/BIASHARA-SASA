/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubscriptionPlan = 'Basic' | 'Pro' | 'Enterprise';
export type TraderStatus = 'active' | 'pending' | 'inactive';
export type UserRole = 'back-office' | 'trader';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  traderId?: number; // Linked trader ID if the role is 'trader'
}

export interface Trader {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  plan: SubscriptionPlan;
  status: TraderStatus;
  createdAt: string;
}

export interface TraderStats {
  total: number;
  active: number;
  pending: number;
  subscribedTotal: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  createdAt: string;
}

export interface StockLog {
  id: number;
  productId: number;
  productName?: string;
  change: number;
  reason: string;
  createdAt: string;
}

export interface POSOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface POSOrder {
  id: number;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  items: POSOrderItem[];
  createdAt: string;
}

export interface Invoice {
  id: string;
  traderName: string;
  traderEmail: string;
  plan: SubscriptionPlan;
  amount: number;
  date: string;
  dueDate: string;
  status: 'unpaid' | 'paid';
}
