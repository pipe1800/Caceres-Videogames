import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUpload from './ImageUpload';
import BulkProductUpload from './BulkProductUpload';
import CategoriesSelector from './CategoriesSelector';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

const AddProductModal = ({ isOpen, onClose, onProductAdded }: AddProductModalProps) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    categories: '' as any,
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

      if (categoriesArray.length === 0) throw new Error('Debe seleccionar al menos una categoría');

      // Fetch category ids by name
      const { data: catRows, error: catErr } = await supabase
        .from('categories')
        .select('id,name')
        .in('name', categoriesArray);
      if (catErr) throw catErr;
      const catIdByName: Record<string,string> = {};
      (catRows||[]).forEach(c=>{catIdByName[c.name]=c.id});

      const primaryConsole = getPrimaryConsole(categoriesArray);

      // Insert product first (without legacy category columns)
      const { data: inserted, error: prodErr } = await supabase
        .from('products')
        .insert({
          sku: formData.sku,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          console: primaryConsole,
          // Legacy placeholders until types updated
          category: '',
          categories: [],
          is_new: formData.isNew,
          is_on_sale: formData.isOnSale,
          stock_count: parseInt(formData.stockCount),
          in_stock: parseInt(formData.stockCount) > 0,
          image_urls: imageUrls,
          features: featuresArray,
          rating: 0,
          review_count: 0
        })
        .select('id')
        .single();
      if (prodErr) throw prodErr;

      const productId = inserted.id;

      // Build product_categories rows
      const productCategoriesPayload = categoriesArray
        .map(name => catIdByName[name])
        .filter(Boolean)
        .map(category_id => ({ product_id: productId, category_id }));

      if (productCategoriesPayload.length === 0) throw new Error('No se pudieron resolver los IDs de categorías');

      const { error: pcErr } = await supabase
        .from('product_categories')
        .insert(productCategoriesPayload);
      if (pcErr) throw pcErr;

      onProductAdded();
      onClose();
      // Reset form
      setFormData({
        sku: '',
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        categories: '' as any,
        isNew: false,
        isOnSale: false,
        stockCount: '',
        features: ''
      });
      setSelectedCategories([]);
      setImageUrls([]);
    } catch (error) {
      console.error('Error adding product:', error);
      alert((error as Error).message || 'Error al agregar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Productos</DialogTitle>
          <DialogDescription>
            Agrega productos individualmente o en lote usando un archivo CSV
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Producto Individual</TabsTrigger>
            <TabsTrigger value="bulk">Carga Masiva (CSV)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Precio ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">Precio Original ($)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                  />
                </div>
              </div>

              <CategoriesSelector
                label="Categorías"
                selected={selectedCategories}
                onChange={setSelectedCategories}
              />

              <div>
                <Label htmlFor="stockCount">Cantidad en Stock</Label>
                <Input
                  id="stockCount"
                  type="number"
                  value={formData.stockCount}
                  onChange={(e) => setFormData({...formData, stockCount: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isNew"
                    checked={formData.isNew}
                    onCheckedChange={(checked) => setFormData({...formData, isNew: checked})}
                  />
                  <Label htmlFor="isNew">Producto Nuevo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isOnSale"
                    checked={formData.isOnSale}
                    onCheckedChange={(checked) => setFormData({...formData, isOnSale: checked})}
                  />
                  <Label htmlFor="isOnSale">En Oferta</Label>
                </div>
              </div>

              <ImageUpload 
                images={imageUrls}
                onImagesChange={setImageUrls}
              />

              <div>
                <Label htmlFor="features">Características (una por línea)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                  placeholder="Gráficos impresionantes&#10;Historia envolvente&#10;Multijugador online"
                  rows={3}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? 'Agregando...' : 'Agregar Producto'}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="bulk">
            <BulkProductUpload onProductsProcessed={onProductAdded} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
