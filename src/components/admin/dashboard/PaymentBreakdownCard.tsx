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
import { DashboardMetrics } from '@/lib/dashboardMetrics';
import { Badge } from '@/components/ui/badge';
import { Cell, Pie, PieChart } from 'recharts';

const COLORS = ['#3bc8da', '#3fdb70', '#f3cb49', '#d93d34', '#8b5cf6'];

interface PaymentBreakdownCardProps {
  metrics: DashboardMetrics;
}

const PaymentBreakdownCard = ({ metrics }: PaymentBreakdownCardProps) => {
  const data = metrics.paymentBreakdown.map((item, index) => ({
    ...item,
    value: Number(item.revenue.toFixed(2)),
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Métodos de pago</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribución de ingresos por método de pago registrado.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row items-center gap-6">
        <ChartContainer config={{ revenue: { label: 'Ingresos' } }} className="h-[240px] w-full lg:w-1/2">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
            >
              {data.map((entry) => (
                <Cell key={entry.method} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, payload) => {
                    const item = payload?.payload as (typeof data)[number];
                    return [
                      new Intl.NumberFormat('es-SV', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(value as number),
                      `${name} · ${item?.orders ?? 0} órdenes`,
                    ];
                  }}
                />
              }
            />
          </PieChart>
        </ChartContainer>
        <div className="flex-1 space-y-3 w-full">
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay transacciones registradas con estado completado.
            </p>
          )}
          {data.map((item) => (
            <div key={item.method} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.label}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {new Intl.NumberFormat('es-SV', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(item.value)}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {item.orders} órdenes
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentBreakdownCard;
