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

const currencyFormatter = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const TopProductsCard = ({ metrics }: { metrics: DashboardMetrics }) => {
  const products = metrics.topProducts.slice(0, 8);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top productos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Productos con mayores ventas por ingresos generados.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay ventas registradas.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="hidden xl:table-cell">Categoría</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Órdenes</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Unidades</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.categoryLabel}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {product.categoryLabel}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {currencyFormatter.format(product.revenue)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right text-sm text-muted-foreground">
                      {product.orders}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right text-sm text-muted-foreground">
                      {product.quantity}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-sm text-muted-foreground">
                      {product.stockCount ?? 0}
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

export default TopProductsCard;
