import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Package, ShoppingCart, Plus, Edit } from 'lucide-react';
import AddProductModal from '@/components/admin/AddProductModal';
import EditProductModal from '@/components/admin/EditProductModal';

// Add order status types and options
type OrderStatus = 'pendiente' | 'enviada' | 'completada' | 'cancelada';

const orderStatusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-500' },
  { value: 'enviada', label: 'Enviada', color: 'bg-blue-500' },
  { value: 'completada', label: 'Completada', color: 'bg-green-500' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-500' }
];

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  products: {
    name: string;
  };
  quantity: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  console: string;
  category: string;
  in_stock: boolean;
  stock_count: number;
  created_at: string;
  description?: string;
  original_price?: number;
  image_urls: string[];
  is_new: boolean;
  is_on_sale: boolean;
  features: string[];
}

const AdminDashboard = () => {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (!admin) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [admin, navigate]);

  const fetchData = async () => {
    try {
      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select<any>(`
          id,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          total_amount,
          status,
          payment_method,
          payment_status,
          created_at,
          quantity,
          products (name)
        `)
        .order('created_at', { ascending: false });

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      setOrders((ordersData as Order[]) || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `La orden ha sido marcada como ${orderStatusOptions.find(s => s.value === newStatus)?.label}`,
      });

      // Refresh the orders list
      await fetchData();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la orden",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditProduct(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Dashboard - Cáceres Video Games
              </h1>
              <p className="text-sm text-gray-600">Bienvenido, {admin?.email}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter(order => order.status === 'pendiente').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos Sin Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.filter(product => !product.in_stock || product.stock_count === 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="orders">Órdenes</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Órdenes</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="min-w-[720px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden md:table-cell">Producto</TableHead>
                        <TableHead className="hidden lg:table-cell">Cantidad</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="hidden sm:table-cell">Método de Pago</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="hidden md:table-cell">Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="hidden sm:table-cell">{order.customer_name}</TableCell>
                          <TableCell className="text-xs sm:text-sm truncate max-w-[140px]">{order.customer_email}</TableCell>
                          <TableCell className="hidden md:table-cell">{order.products?.name}</TableCell>
                          <TableCell className="hidden lg:table-cell">{order.quantity}</TableCell>
                          <TableCell>${order.total_amount}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={order.payment_method === 'credit-debit' ? 'default' : 'secondary'}>
                              {order.payment_method === 'credit-debit' ? 'Tarjeta' : 'Contra Entrega'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={order.status} 
                              onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                            >
                              <SelectTrigger className="w-[120px] sm:w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {orderStatusOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${option.color}`} />
                                      {option.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              Ver detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestión de Productos</CardTitle>
                <Button 
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden sm:table-cell">SKU</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="hidden md:table-cell">Consola</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="hidden md:table-cell">Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm hidden sm:table-cell">{product.sku}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>€{product.price}</TableCell>
                          <TableCell className="hidden md:table-cell">{product.console}</TableCell>
                          <TableCell>{product.stock_count}</TableCell>
                          <TableCell>
                            <Badge variant={product.in_stock ? 'default' : 'destructive'}>
                              {product.in_stock ? 'En Stock' : 'Sin Stock'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {new Date(product.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProduct(product)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {showAddProduct && (
        <AddProductModal
          isOpen={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          onProductAdded={fetchData}
        />
      )}

      {showEditProduct && selectedProduct && (
        <EditProductModal
          isOpen={showEditProduct}
          onClose={() => {
            setShowEditProduct(false);
            setSelectedProduct(null);
          }}
          onProductUpdated={fetchData}
          product={selectedProduct}
        />
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Cliente</h3>
                  <p>{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Email</h3>
                  <p>{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Teléfono</h3>
                  <p>{selectedOrder.customer_phone || 'No proporcionado'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Dirección de Entrega</h3>
                  <p>{selectedOrder.customer_address || 'No proporcionada'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Método de Pago</h3>
                  <Badge variant={selectedOrder.payment_method === 'credit-debit' ? 'default' : 'secondary'}>
                    {selectedOrder.payment_method === 'credit-debit' ? 'Tarjeta de Crédito/Débito' : 'Contra Entrega'}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Estado del Pago</h3>
                  <p>{selectedOrder.payment_status}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Total</h3>
                  <p className="text-lg font-bold">${selectedOrder.total_amount}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Fecha de Orden</h3>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Cambiar Estado</h3>
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={async (value) => {
                    await updateOrderStatus(selectedOrder.id, value as OrderStatus);
                    setSelectedOrder(null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
