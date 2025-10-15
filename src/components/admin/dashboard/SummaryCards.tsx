import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardMetrics } from '@/lib/dashboardMetrics';
import { AlertTriangle, Clock, DollarSign, PiggyBank, Receipt, ShoppingBag } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const formatCurrency = (value: number) => currencyFormatter.format(value ?? 0);

interface SummaryCardsProps {
  metrics: DashboardMetrics;
}

const SummaryCards = ({ metrics }: SummaryCardsProps) => {
  const items = [
    {
      label: 'Ingresos Totales',
      value: formatCurrency(metrics.summary.totalRevenue),
      icon: DollarSign,
      helper: `${metrics.summary.totalOrders} órdenes pagadas`,
    },
    {
      label: 'Órdenes Pagadas',
      value: metrics.summary.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      helper: `${metrics.summary.pendingOrders} pendientes · ${metrics.summary.cancelledOrders} canceladas`,
    },
    {
      label: 'Ticket Promedio',
      value: formatCurrency(metrics.summary.avgOrderValue),
      icon: Receipt,
      helper: 'Promedio por orden completada',
    },
    {
      label: 'Órdenes Pendientes',
      value: metrics.summary.pendingOrders.toLocaleString(),
      icon: Clock,
      helper: 'Asegura seguimiento oportuno',
    },
    {
      label: 'Productos en Riesgo',
      value: metrics.inventory.lowStockCount.toLocaleString(),
      icon: AlertTriangle,
      helper: `${metrics.inventory.outOfStockCount} agotados`,
    },
    {
      label: 'Valor de Inventario',
      value: formatCurrency(metrics.inventory.totalInventoryValue),
      icon: PiggyBank,
      helper: `${metrics.inventory.totalSkus} SKUs activos`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {items.map(({ label, value, icon: Icon, helper }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
            {helper && (
              <p className="text-xs text-muted-foreground mt-2">{helper}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;
