import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import ImageUpload from './ImageUpload';
import CategoriesSelector from './CategoriesSelector';

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
  categories?: string[];
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
  const [categoriesText, setCategoriesText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (product && isOpen) {
      setFormData(product);
      setImages(product.image_urls || []);
      setFeaturesText(product.features?.join('\n') || '');
      const initialCats = product.categories && product.categories.length
        ? product.categories
        : Array.from(new Set([product.console, product.category].filter(Boolean)));
      setCategoriesText(initialCats.join(', '));
      setSelectedCategories(initialCats);
    }
  }, [product, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
      const features = featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const categories = selectedCategories;

      const updatedProduct = {
        ...formData,
        // ensure numeric types
        price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price,
        original_price: typeof formData.original_price === 'string' ? parseFloat(formData.original_price as any) : formData.original_price,
        stock_count: typeof formData.stock_count === 'string' ? parseInt(formData.stock_count as any) : formData.stock_count,
        image_urls: images,
        features,
        categories,
        // legacy compatibility fields
        console: getPrimaryConsole(categories),
        category: getPrimaryCategory(categories),
        updated_at: new Date().toISOString()
      } as any;

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
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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

              <CategoriesSelector
                label="Categorías"
                selected={selectedCategories}
                onChange={setSelectedCategories}
              />
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
                  onChange={(e) => handleInputChange('price', e.target.value)}
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
                  onChange={(e) => handleInputChange('original_price', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="stock_count">Cantidad en Stock</Label>
                <Input
                  id="stock_count"
                  type="number"
                  value={formData.stock_count || 0}
                  onChange={(e) => handleInputChange('stock_count', e.target.value)}
                  required
                />
              </div>

              {/* Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="in_stock">En Stock</Label>
                  <Switch
                    id="in_stock"
                    checked={formData.in_stock || false}
                    onCheckedChange={(checked) => handleInputChange('in_stock', checked)}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="is_new">Producto Nuevo</Label>
                  <Switch
                    id="is_new"
                    checked={formData.is_new || false}
                    onCheckedChange={(checked) => handleInputChange('is_new', checked)}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="is_on_sale">En Oferta</Label>
                  <Switch
                    id="is_on_sale"
                    checked={formData.is_on_sale || false}
                    onCheckedChange={(checked) => handleInputChange('is_on_sale', checked)}
                  />
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
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Actualizando...' : 'Actualizar Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;
