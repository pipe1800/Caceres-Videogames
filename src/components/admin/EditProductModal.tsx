
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_urls: string[];
  console: string;
  category: string;
  is_new: boolean;
  is_on_sale: boolean;
  in_stock: boolean;
  stock_count: number;
  features: string[];
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
  product: Product;
}

const EditProductModal = ({ isOpen, onClose, onProductUpdated, product }: EditProductModalProps) => {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    if (product && isOpen) {
      setFormData(product);
      setImages(product.image_urls || []);
      setFeaturesText(product.features?.join('\n') || '');
    }
  }, [product, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const features = featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const updatedProduct = {
        ...formData,
        image_urls: images,
        features,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', product.id);

      if (error) throw error;

      onProductUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Editar Producto
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku || ''}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="console">Consola</Label>
                <Select 
                  value={formData.console || ''} 
                  onValueChange={(value) => handleInputChange('console', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar consola" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                    <SelectItem value="PlayStation 5">PlayStation 5</SelectItem>
                    <SelectItem value="PlayStation 4">PlayStation 4</SelectItem>
                    <SelectItem value="Xbox Series X">Xbox Series X</SelectItem>
                    <SelectItem value="Xbox One">Xbox One</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="original_price">Precio Original (opcional)</Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  value={formData.original_price || ''}
                  onChange={(e) => handleInputChange('original_price', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>

              <div>
                <Label htmlFor="stock_count">Cantidad en Stock</Label>
                <Input
                  id="stock_count"
                  type="number"
                  value={formData.stock_count || 0}
                  onChange={(e) => handleInputChange('stock_count', parseInt(e.target.value))}
                  required
                />
              </div>

              {/* Switches */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="in_stock"
                    checked={formData.in_stock || false}
                    onCheckedChange={(checked) => handleInputChange('in_stock', checked)}
                  />
                  <Label htmlFor="in_stock">En Stock</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_new"
                    checked={formData.is_new || false}
                    onCheckedChange={(checked) => handleInputChange('is_new', checked)}
                  />
                  <Label htmlFor="is_new">Producto Nuevo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_on_sale"
                    checked={formData.is_on_sale || false}
                    onCheckedChange={(checked) => handleInputChange('is_on_sale', checked)}
                  />
                  <Label htmlFor="is_on_sale">En Oferta</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <Label htmlFor="features">Características (una por línea)</Label>
            <Textarea
              id="features"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={4}
              placeholder="Característica 1&#10;Característica 2&#10;Característica 3"
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Imágenes del Producto</Label>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Actualizar Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;
