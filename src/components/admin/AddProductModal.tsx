import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUpload from './ImageUpload';
import BulkProductUpload from './BulkProductUpload';

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
    console: '',
    category: '',
    isNew: false,
    isOnSale: false,
    stockCount: '',
    features: ''
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const featuresArray = formData.features
        .split('\n')
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0);

      const { error } = await supabase
        .from('products')
        .insert({
          sku: formData.sku,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          console: formData.console,
          category: formData.category,
          is_new: formData.isNew,
          is_on_sale: formData.isOnSale,
          stock_count: parseInt(formData.stockCount),
          in_stock: parseInt(formData.stockCount) > 0,
          image_urls: imageUrls,
          features: featuresArray,
          rating: 0,
          review_count: 0
        });

      if (error) throw error;

      onProductAdded();
      onClose();
      
      // Reset form
      setFormData({
        sku: '',
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        console: '',
        category: '',
        isNew: false,
        isOnSale: false,
        stockCount: '',
        features: ''
      });
      setImageUrls([]);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al agregar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="console">Consola</Label>
                  <Select value={formData.console} onValueChange={(value) => setFormData({...formData, console: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar consola" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PlayStation 5">PlayStation 5</SelectItem>
                      <SelectItem value="PlayStation 4">PlayStation 4</SelectItem>
                      <SelectItem value="Xbox Series X">Xbox Series X</SelectItem>
                      <SelectItem value="Xbox One">Xbox One</SelectItem>
                      <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                      <SelectItem value="PC">PC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PlayStation">PlayStation</SelectItem>
                      <SelectItem value="Xbox">Xbox</SelectItem>
                      <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                      <SelectItem value="PC">PC</SelectItem>
                      <SelectItem value="Accesorios">Accesorios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
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
