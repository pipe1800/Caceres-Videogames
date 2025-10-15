import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Category, Product as DBProduct } from '@/types/supabase';

export type DashboardOrder = {
  id: string;
  product_id: string;
  total_amount: number;
  quantity: number;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string;
};

export type ProductWithRelations = DBProduct & {
  childCategory?: Category | null;
  parentCategory?: Category | null;
};

export type RevenuePoint = {
  key: string;
  period: string;
  revenue: number;
  orders: number;
};

export type CategoryBreakdown = {
  category: string;
  revenue: number;
  orders: number;
  quantity: number;
};

export type SubcategoryBreakdown = CategoryBreakdown & {
  parentCategory: string;
};

export type PaymentBreakdown = {
  method: string;
  label: string;
  revenue: number;
  orders: number;
};

export type TopProduct = {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  quantity: number;
  categoryLabel: string;
  stockCount?: number;
  inStock?: boolean;
};

export type InventorySummary = {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  lowStockProducts: TopProduct[];
};

export type DashboardSummary = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  pendingOrders: number;
  cancelledOrders: number;
};

export type DashboardMetrics = {
  summary: DashboardSummary;
  revenueTrend: RevenuePoint[];
  salesByCategory: CategoryBreakdown[];
  salesBySubcategory: SubcategoryBreakdown[];
  paymentBreakdown: PaymentBreakdown[];
  topProducts: TopProduct[];
  inventory: InventorySummary;
};

const LOW_STOCK_THRESHOLD = 5;
const PAID_PAYMENT_STATUSES = new Set(['APPROVED', 'PAID', 'COMPLETED']);
const COMPLETED_ORDER_STATUSES = new Set(['completada', 'enviada', 'completado']);

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  'credit-debit': 'Tarjeta',
  cash: 'Contra Entrega',
};

const normalizePaymentMethod = (method: string | null) => {
  if (!method) return 'other';
  if (method === 'credit' || method === 'credit-debit') return 'credit-debit';
  if (method === 'cash' || method === 'contra-entrega') return 'cash';
  return method.toLowerCase();
};

const formatCategoryLabel = (product: ProductWithRelations) => {
  if (
    product.parentCategory &&
    product.childCategory &&
    product.parentCategory.id !== product.childCategory.id
  ) {
    return `${product.parentCategory.name} / ${product.childCategory.name}`;
  }
  return (
    product.childCategory?.name || product.parentCategory?.name || product.console
  );
};

const isOrderPaid = (order: DashboardOrder) => {
  const paymentStatus = order.payment_status?.toUpperCase() ?? '';
  const orderStatus = order.status?.toLowerCase() ?? '';
  return (
    PAID_PAYMENT_STATUSES.has(paymentStatus) ||
    COMPLETED_ORDER_STATUSES.has(orderStatus)
  );
};

const getPeriodKey = (dateIso: string) => {
  try {
    const parsed = parseISO(dateIso);
    return format(parsed, 'yyyy-MM');
  } catch (error) {
    console.warn('Failed to parse date for dashboard metric', { dateIso, error });
    return 'unknown';
  }
};

const readablePeriod = (periodKey: string) => {
  if (periodKey === 'unknown') return 'Sin Fecha';
  const [year, month] = periodKey.split('-').map(Number);
  if (!year || !month) return periodKey;
  const date = new Date(year, month - 1, 1);
  return format(date, "LLLL yyyy", { locale: es });
};

export const computeDashboardMetrics = (
  orders: DashboardOrder[],
  products: ProductWithRelations[]
): DashboardMetrics => {
  const productMap = new Map<string, ProductWithRelations>();
  for (const product of products) {
    productMap.set(product.id, product);
  }

  const paidOrders = orders.filter(isOrderPaid);
  const pendingOrders = orders.filter(
    (order) => (order.status?.toLowerCase() ?? '') === 'pendiente'
  );
  const cancelledOrders = orders.filter((order) => {
    const status = order.status?.toLowerCase() ?? '';
    return status === 'cancelada' || status === 'cancelado';
  });

  const summary = paidOrders.reduce(
    (acc, order) => {
      acc.totalRevenue += order.total_amount ?? 0;
      acc.totalOrders += 1;
      return acc;
    },
    {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,
    } satisfies DashboardSummary
  );

  summary.avgOrderValue = summary.totalOrders
    ? summary.totalRevenue / summary.totalOrders
    : 0;

  const revenueTrendMap = new Map<string, RevenuePoint>();
  const categoryMap = new Map<string, CategoryBreakdown>();
  const subcategoryMap = new Map<string, SubcategoryBreakdown>();
  const paymentMap = new Map<string, PaymentBreakdown>();
  const productSalesMap = new Map<string, TopProduct>();

  for (const order of paidOrders) {
    const product = productMap.get(order.product_id);
    const periodKey = getPeriodKey(order.created_at);
    const periodLabel = readablePeriod(periodKey);

    if (!revenueTrendMap.has(periodKey)) {
      revenueTrendMap.set(periodKey, {
        key: periodKey,
        period: periodLabel,
        revenue: 0,
        orders: 0,
      });
    }

    const trendEntry = revenueTrendMap.get(periodKey)!;
    trendEntry.revenue += order.total_amount ?? 0;
    trendEntry.orders += 1;

    if (product) {
      const categoryName = product.parentCategory?.name || 'Sin categoría';
      const subcategoryName = product.childCategory?.name || categoryName;
      const catKey = categoryName.toLowerCase();
      const subcatKey = `${categoryName.toLowerCase()}::${subcategoryName.toLowerCase()}`;

      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          category: categoryName,
          revenue: 0,
          orders: 0,
          quantity: 0,
        });
      }
      if (!subcategoryMap.has(subcatKey)) {
        subcategoryMap.set(subcatKey, {
          category: subcategoryName,
          parentCategory: categoryName,
          revenue: 0,
          orders: 0,
          quantity: 0,
        });
      }

      const categoryEntry = categoryMap.get(catKey)!;
      categoryEntry.revenue += order.total_amount ?? 0;
      categoryEntry.orders += 1;
      categoryEntry.quantity += order.quantity ?? 0;

      const subcategoryEntry = subcategoryMap.get(subcatKey)!;
      subcategoryEntry.revenue += order.total_amount ?? 0;
      subcategoryEntry.orders += 1;
      subcategoryEntry.quantity += order.quantity ?? 0;

      const productKey = product.id;
      if (!productSalesMap.has(productKey)) {
        productSalesMap.set(productKey, {
          id: product.id,
          name: product.name,
          revenue: 0,
          orders: 0,
          quantity: 0,
          categoryLabel: formatCategoryLabel(product),
        });
      }

      const productEntry = productSalesMap.get(productKey)!;
      productEntry.revenue += order.total_amount ?? 0;
      productEntry.orders += 1;
      productEntry.quantity += order.quantity ?? 0;
    }

    const normalizedMethod = normalizePaymentMethod(order.payment_method);
    const label = PAYMENT_METHOD_LABELS[normalizedMethod] ?? order.payment_method ?? 'Otros';
    if (!paymentMap.has(normalizedMethod)) {
      paymentMap.set(normalizedMethod, {
        method: normalizedMethod,
        label,
        revenue: 0,
        orders: 0,
      });
    }

    const paymentEntry = paymentMap.get(normalizedMethod)!;
    paymentEntry.revenue += order.total_amount ?? 0;
    paymentEntry.orders += 1;
  }

  const lowStockProducts = products
    .filter((product) => {
      const stock = product.stock_count ?? 0;
      const inStock = product.in_stock ?? false;
      return !inStock || stock <= LOW_STOCK_THRESHOLD;
    })
    .map((product) => {
      const sales = productSalesMap.get(product.id);
      return {
        id: product.id,
        name: product.name,
        revenue: sales?.revenue ?? 0,
        orders: sales?.orders ?? 0,
        quantity: sales?.quantity ?? 0,
        categoryLabel: formatCategoryLabel(product),
        stockCount: product.stock_count ?? 0,
        inStock: product.in_stock ?? false,
      } satisfies TopProduct;
    })
    .sort((a, b) => {
      const stockDiff = (a.stockCount ?? 0) - (b.stockCount ?? 0);
      if (stockDiff !== 0) return stockDiff;
      return (a.revenue ?? 0) - (b.revenue ?? 0);
    });

  const inventorySummary: InventorySummary = {
    totalSkus: products.length,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: products.filter((product) => (product.stock_count ?? 0) === 0).length,
    totalInventoryValue: products.reduce((acc, product) => {
      const stock = product.stock_count ?? 0;
      return acc + stock * product.price;
    }, 0),
    lowStockProducts: lowStockProducts.slice(0, 10),
  };

  const revenueTrend = Array.from(revenueTrendMap.values()).sort((a, b) => {
    return a.key.localeCompare(b.key);
  });

  const salesByCategory = Array.from(categoryMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  const salesBySubcategory = Array.from(subcategoryMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  const paymentBreakdown = Array.from(paymentMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  const topProducts = Array.from(productSalesMap.values()).map((product) => {
    const source = productMap.get(product.id);
    return {
      ...product,
      stockCount: source?.stock_count ?? 0,
      inStock: source?.in_stock ?? false,
    } satisfies TopProduct;
  }).sort((a, b) => b.revenue - a.revenue);

  return {
    summary,
    revenueTrend,
    salesByCategory,
    salesBySubcategory,
    paymentBreakdown,
    topProducts: topProducts.slice(0, 8),
    inventory: inventorySummary,
  } satisfies DashboardMetrics;
};
