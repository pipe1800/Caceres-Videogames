import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DashboardMetrics } from '@/lib/dashboardMetrics';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Bar,
} from 'recharts';

const currencyFormatter = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const revenueChartConfig = {
  revenue: {
    label: 'Ingresos',
    color: '#3bc8da',
  },
  orders: {
    label: 'Órdenes',
    color: '#3fdb70',
  },
};

interface RevenueTrendCardProps {
  metrics: DashboardMetrics;
}

const RevenueTrendCard = ({ metrics }: RevenueTrendCardProps) => {
  const data = metrics.revenueTrend.map((item) => ({
    ...item,
    revenue: Number(item.revenue.toFixed(2)),
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Tendencia de ingresos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Evolución mensual de ingresos y órdenes completadas.
        </p>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ChartContainer config={revenueChartConfig} className="h-full w-full">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} interval={0} angle={-20} dy={16} />
            <YAxis
              yAxisId="revenue"
              tickFormatter={(value) => currencyFormatter.format(value)}
              width={90}
            />
            <YAxis yAxisId="orders" orientation="right" width={50} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === 'revenue') {
                      return [currencyFormatter.format(value as number), 'Ingresos'];
                    }
                    if (name === 'orders') {
                      return [`${value} órdenes`, 'Órdenes'];
                    }
                    return [value, name];
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              yAxisId="orders"
              dataKey="orders"
              fill="var(--color-orders)"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueTrendCard;
