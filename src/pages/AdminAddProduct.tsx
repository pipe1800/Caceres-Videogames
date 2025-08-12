import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUpload from '@/components/admin/ImageUpload';
import BulkProductUpload from '@/components/admin/BulkProductUpload';
import CategoriesSelector from '@/components/admin/CategoriesSelector';
import { ArrowLeft } from 'lucide-react';

const AdminAddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { admin } = useAdmin();

  useEffect(() => {
    if (!admin) navigate('/admin');
  }, [admin, navigate]);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    isNew: false,
    isOnSale: false,
    stockCount: '',
    features: ''
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getPrimaryConsole = (cats: string[]): string => {
    const consoles = [
      'Nintendo Switch',
      'PlayStation 5',
      'PlayStation 4',
      'Xbox Series X',
      'Xbox One',
      'PC'
    ];
    const found = cats.find(c => consoles.includes(c));
    return found || '';
  };

  const getPrimaryCategory = (cats: string[]): string => {
    const generic = [
      'PlayStation',
      'Xbox',
      'Nintendo Switch',
      'PC',
      'Accesorios'
    ];
    const found = cats.find(c => generic.includes(c));
    return found || cats[0] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const featuresArray = formData.features
        .split('\n')
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0);

      const categoriesArray = selectedCategories;

      if (imageUrls.length === 0) {
        alert('Debes subir al menos una imagen');
        setIsLoading(false);
        return;
      }

      const primaryConsole = getPrimaryConsole(categoriesArray);
      const primaryCategory = getPrimaryCategory(categoriesArray);

      const { error } = await supabase
        .from('products')
        .insert({
          sku: formData.sku,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          console: primaryConsole,
          category: primaryCategory,
          categories: categoriesArray,
          is_new: formData.isNew,
          is_on_sale: formData.isOnSale,
          stock_count: parseInt(formData.stockCount || '0', 10),
          in_stock: parseInt(formData.stockCount || '0', 10) > 0,
          image_urls: imageUrls,
          features: featuresArray,
          rating: 0,
          review_count: 0
        });

      if (error) throw error;

      // On success, go back to products tab
      navigate('/admin/dashboard?tab=products');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al agregar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/admin/dashboard?tab=products')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-lg font-semibold">Agregar Productos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Agregar Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual">Producto Individual</TabsTrigger>
                <TabsTrigger value="bulk">Carga Masiva (CSV/Excel)</TabsTrigger>
              </TabsList>

              <TabsContent value="individual">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
                    </div>
                    <div>
                      <Label htmlFor="name">Nombre</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Precio ($)</Label>
                      <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                    </div>
                    <div>
                      <Label htmlFor="originalPrice">Precio Original ($)</Label>
                      <Input id="originalPrice" type="number" step="0.01" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} />
                    </div>
                  </div>

                  <CategoriesSelector label="Categorías" selected={selectedCategories} onChange={setSelectedCategories} />

                  <div>
                    <Label htmlFor="stockCount">Cantidad en Stock</Label>
                    <Input id="stockCount" type="number" value={formData.stockCount} onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })} required />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="isNew" checked={formData.isNew} onCheckedChange={(checked) => setFormData({ ...formData, isNew: checked })} />
                      <Label htmlFor="isNew">Producto Nuevo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="isOnSale" checked={formData.isOnSale} onCheckedChange={(checked) => setFormData({ ...formData, isOnSale: checked })} />
                      <Label htmlFor="isOnSale">En Oferta</Label>
                    </div>
                  </div>

                  <ImageUpload images={imageUrls} onImagesChange={setImageUrls} />

                  <div>
                    <Label htmlFor="features">Características (una por línea)</Label>
                    <Textarea id="features" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} placeholder={'Gráficos impresionantes\nHistoria envolvente\nMultijugador online'} rows={3} />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard?tab=products')} className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                      {isLoading ? 'Agregando...' : 'Agregar Producto'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="bulk">
                <BulkProductUpload onProductsProcessed={() => navigate('/admin/dashboard?tab=products')} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminAddProduct;
