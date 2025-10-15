import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardMetrics } from '@/lib/dashboardMetrics';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

const currencyFormatter = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const chartConfig = {
  revenue: {
    label: 'Ingresos',
    color: '#3bc8da',
  },
};

interface CategorySalesCardProps {
  metrics: DashboardMetrics;
}

const CategorySalesCard = ({ metrics }: CategorySalesCardProps) => {
  const categories = metrics.salesByCategory.slice(0, 10).map((item) => ({
    name: item.category,
    revenue: Number(item.revenue.toFixed(2)),
    orders: item.orders,
    quantity: item.quantity,
  }));

  const subcategories = metrics.salesBySubcategory
    .slice(0, 10)
    .map((item) => ({
      name: `${item.parentCategory} › ${item.category}`,
      revenue: Number(item.revenue.toFixed(2)),
      orders: item.orders,
      quantity: item.quantity,
    }));

  const renderChart = (data: typeof categories) => (
    <ChartContainer config={chartConfig} className="h-[280px]">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} dy={14} height={80} />
        <YAxis tickFormatter={(value) => currencyFormatter.format(value)} width={90} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, payload) => {
                if (name === 'revenue') {
                  return [currencyFormatter.format(value as number), 'Ingresos'];
                }
                return [value, name];
              }}
              labelFormatter={(label, items) => {
                const item = (items?.[0] as any) ?? {};
                const orders = item?.payload?.orders ?? 0;
                const quantity = item?.payload?.quantity ?? 0;
                return (
                  <div className="space-y-1">
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {orders} órdenes · {quantity} unidades
                    </p>
                  </div>
                );
              }}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Ventas por categoría</CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualiza las categorías y subcategorías con mejores ventas.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="categories" className="flex-1">
              Categorías
            </TabsTrigger>
            <TabsTrigger value="subcategories" className="flex-1">
              Subcategorías
            </TabsTrigger>
          </TabsList>
          <TabsContent value="categories">
            {categories.length > 0 ? (
              renderChart(categories)
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay datos suficientes para mostrar.
              </p>
            )}
          </TabsContent>
          <TabsContent value="subcategories">
            {subcategories.length > 0 ? (
              renderChart(subcategories)
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay datos suficientes para mostrar.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CategorySalesCard;
