import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogOut, Package, ShoppingCart, Plus, Edit, Trash2, LayoutDashboard, FolderTree } from 'lucide-react';
import { Product as DBProduct, Category as DBCategory } from '@/types/supabase';
import EditProductModal from '@/components/admin/EditProductModal';
import CategoryManager from '@/components/admin/CategoryManager';

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

interface Product extends DBProduct {
  childCategory?: DBCategory | null;
  parentCategory?: DBCategory | null;
}

const AdminDashboard = () => {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'orders' | 'products' | 'categories'>('dashboard');

  useEffect(() => {
    if (!admin) {
      navigate('/admin');
      return;
    }
    fetchData();
    
    // Set initial view from URL
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'orders' || tab === 'products' || tab === 'categories') {
      setActiveView(tab);
    }
  }, [admin, navigate, location.search]);

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

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id,name,slug,parent_id,sort_order,is_active');
      if (categoriesError) throw categoriesError;
      const categoryMap = Object.fromEntries(
        (categoriesData || []).map((c) => [c.id, c as DBCategory])
      );

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (productsError) throw productsError;

      const normalizedProducts = (productsData || []).map((p) => {
        const base: any = { ...p };
        if (Array.isArray(base.categories)) delete base.categories;
        if (typeof base.category === 'string') delete base.category;
        const child = p.category_id ? categoryMap[p.category_id] || null : null;
        const parent = p.parent_category_id ? categoryMap[p.parent_category_id] || null : null;
        return { ...base, childCategory: child, parentCategory: parent } as Product;
      });

      setOrders(((ordersData ?? []) as any));
      setProducts(normalizedProducts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCategoryLabel = (product: Product) => {
    if (product.parentCategory && product.childCategory && product.parentCategory.id !== product.childCategory.id) {
      return `${product.parentCategory.name} / ${product.childCategory.name}`;
    }
    return product.childCategory?.name || product.parentCategory?.name || product.console;
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

  const deleteProduct = async (productId: string) => {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        // Likely FK violation due to orders referencing this product
        console.error('Error deleting product:', error);
        toast({
          title: 'No se pudo eliminar',
          description: 'Este producto tiene órdenes asociadas. No puede ser eliminado. Podemos desactivarlo si lo prefieres.',
          variant: 'destructive'
        });
        return;
      }

      toast({ title: 'Producto eliminado' });
      await fetchData();
    } catch (err) {
      console.error('Error deleting product:', err);
      toast({ title: 'Error', description: 'No se pudo eliminar el producto', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders' as const, label: 'Órdenes', icon: ShoppingCart },
    { id: 'products' as const, label: 'Productos', icon: Package },
    { id: 'categories' as const, label: 'Categorías', icon: FolderTree }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
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

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Left Navigation */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeView === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            </div>
          )}

          {/* Orders View */}
          {activeView === 'orders' && (
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Órdenes</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile list (no horizontal scroll) */}
                <div className="md:hidden space-y-3">
                  {orders.length === 0 && (
                    <div className="text-sm text-gray-500">No hay órdenes aún.</div>
                  )}
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[220px]">
                            {order.customer_name || order.customer_email}
                          </p>
                          <p className="text-xs text-gray-600 truncate max-w-[220px]">
                            {order.customer_email}
                          </p>
                        </div>
                        <Badge variant={order.payment_method === 'credit-debit' ? 'default' : 'secondary'}>
                          {order.payment_method === 'credit-debit' ? 'Tarjeta' : 'Contra Entrega'}
                        </Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Producto</p>
                          <p className="font-medium truncate">{order.products?.name || '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Cantidad</p>
                          <p className="font-medium">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total</p>
                          <p className="font-semibold">${order.total_amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Fecha</p>
                          <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col gap-2">
                        <Select 
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Estado" />
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedOrder(order)}
                        >
                          Ver detalles
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden lg:table-cell">Cliente</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden xl:table-cell">Producto</TableHead>
                        <TableHead className="hidden xl:table-cell">Cantidad</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="hidden lg:table-cell">Método de Pago</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="hidden lg:table-cell">{order.customer_name}</TableCell>
                          <TableCell className="text-sm truncate max-w-[220px]">{order.customer_email}</TableCell>
                          <TableCell className="hidden xl:table-cell">{order.products?.name}</TableCell>
                          <TableCell className="hidden xl:table-cell">{order.quantity}</TableCell>
                          <TableCell>${order.total_amount}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant={order.payment_method === 'credit-debit' ? 'default' : 'secondary'}>
                              {order.payment_method === 'credit-debit' ? 'Tarjeta' : 'Contra Entrega'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={order.status} 
                              onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                            >
                              <SelectTrigger className="w-[140px]">
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
                          <TableCell className="hidden lg:table-cell">
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
          )}

          {/* Products View */}
          {activeView === 'products' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestión de Productos</CardTitle>
                <Button 
                  onClick={() => navigate('/admin/add')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </Button>
              </CardHeader>
              <CardContent>
                {/* Mobile list */}
                <div className="md:hidden space-y-3">
                  {products.length === 0 && (
                    <div className="text-sm text-gray-500">No hay productos aún.</div>
                  )}
                  {products.map((product) => (
                    <div key={product.id} className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[220px]">{product.name}</p>
                          <p className="text-xs text-gray-600">SKU: <span className="font-mono">{product.sku}</span></p>
                        </div>
                        <Badge variant={product.in_stock ? 'default' : 'destructive'}>
                          {product.in_stock ? 'En Stock' : 'Sin Stock'}
                        </Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Precio</p>
                          <p className="font-semibold">{'$'}{product.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Stock</p>
                          <p className="font-medium">{product.stock_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Categorías</p>
                          <p className="font-medium">{formatCategoryLabel(product)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Fecha</p>
                          <p className="font-medium">{new Date(product.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-4 justify-end">
                        <Edit 
                          className="h-5 w-5 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors" 
                          onClick={() => handleEditProduct(product)}
                        />
                        <Trash2 
                          className="h-5 w-5 text-red-600 hover:text-red-800 cursor-pointer transition-colors" 
                          onClick={() => deleteProduct(product.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden lg:table-cell">SKU</TableHead>
                        <TableHead className="w-[20%]">Nombre</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="hidden xl:table-cell">Categorías</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="hidden xl:table-cell">Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm hidden lg:table-cell">{product.sku}</TableCell>
                          <TableCell className="w-[20%] max-w-[200px] truncate">{product.name}</TableCell>
                          <TableCell>{'$'}{product.price.toFixed(2)}</TableCell>
                          <TableCell className="hidden xl:table-cell">{formatCategoryLabel(product)}</TableCell>
                          <TableCell>{product.stock_count}</TableCell>
                          <TableCell>
                            <Badge variant={product.in_stock ? 'default' : 'destructive'}>
                              {product.in_stock ? 'En Stock' : 'Sin Stock'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {new Date(product.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-3">
                              <Edit 
                                className="h-4 w-4 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors" 
                                onClick={() => handleEditProduct(product)}
                              />
                              <Trash2 
                                className="h-4 w-4 text-red-600 hover:text-red-800 cursor-pointer transition-colors" 
                                onClick={() => deleteProduct(product.id)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories View */}
          {activeView === 'categories' && (
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Categorías</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryManager />
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {showEditProduct && selectedProduct && (
        <EditProductModal
          isOpen={showEditProduct}
          onClose={() => {
            setShowEditProduct(false);
            setSelectedProduct(null);
            fetchData();
          }}
          onProductUpdated={fetchData}
          product={selectedProduct}
        />
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Cliente</h3>
                  <p>{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Email</h3>
                  <p className="break-all">{selectedOrder.customer_email}</p>
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
