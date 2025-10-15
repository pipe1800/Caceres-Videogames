import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardMetrics } from '@/lib/dashboardMetrics';
import { Badge } from '@/components/ui/badge';

const currencyFormatter = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const LowStockCard = ({ metrics }: { metrics: DashboardMetrics }) => {
  const lowStock = metrics.inventory.lowStockProducts.slice(0, 8);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Alerta de inventario</CardTitle>
        <p className="text-sm text-muted-foreground">
          Productos con pocas unidades o fuera de stock.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Excelente. No hay productos en riesgo de agotarse.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="hidden xl:table-cell">Categoría</TableHead>
                  <TableHead className="w-24 text-right">Stock</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.orders} órdenes · {item.quantity} unidades vendidas
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {item.categoryLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={item.inStock ? 'secondary' : 'destructive'}>
                        {item.stockCount ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-sm text-muted-foreground">
                      {currencyFormatter.format(item.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockCard;
