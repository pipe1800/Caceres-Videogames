import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import ImageUpload from './ImageUpload';

import { Product as DBProduct, Category as DBCategory } from '@/types/supabase';

interface Product extends DBProduct {
  childCategory?: DBCategory | null;
  parentCategory?: DBCategory | null;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
  product: Product;
}

type CategoryRow = {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
};

const EditProductModal = ({ isOpen, onClose, onProductUpdated, product }: EditProductModalProps) => {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [featuresText, setFeaturesText] = useState('');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [childCategoryId, setChildCategoryId] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [originalPriceInput, setOriginalPriceInput] = useState('');
  const [stockInput, setStockInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,slug,parent_id,is_active')
        .eq('is_active', true)
        .order('parent_id', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (!error && data) setCategories(data as CategoryRow[]);
    };
    loadCategories();
  }, [isOpen]);

  useEffect(() => {
    if (product && isOpen) {
      setFormData(product);
      setImages(product.image_urls || []);
      setFeaturesText((product.features || []).join('\n'));
  setChildCategoryId(product.category_id);
  setParentCategoryId(product.parent_category_id);
  setPriceInput(product.price?.toString() ?? '');
  setOriginalPriceInput(product.original_price?.toString() ?? '');
  setStockInput(product.stock_count?.toString() ?? '');
    }
  }, [product, isOpen]);

  const parentOptions = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const childOptions = useMemo(
    () => categories.filter((c) => c.parent_id === parentCategoryId),
    [categories, parentCategoryId]
  );

  useEffect(() => {
    if (!parentCategoryId && childCategoryId) {
      const child = categories.find((c) => c.id === childCategoryId);
      if (child?.parent_id) setParentCategoryId(child.parent_id);
    }
  }, [categories, childCategoryId, parentCategoryId]);

  const getPrimaryConsole = (labels: string[]): string => {
    const consoles = [
      'Nintendo Switch',
      'PlayStation 5',
      'PlayStation 4',
      'Xbox Series X',
      'Xbox One',
      'PC'
    ];
    const found = labels.find((label) => consoles.includes(label));
    return found || formData.console || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!childCategoryId) throw new Error('Selecciona una categoría hija válida.');
      const resolvedChild = categories.find((c) => c.id === childCategoryId);
      if (!resolvedChild) throw new Error('No se encontró la categoría hija seleccionada.');
      const resolvedParentId = resolvedChild.parent_id;
      if (!resolvedParentId) throw new Error('La categoría hija seleccionada no tiene una categoría padre.');
      const resolvedParent = categories.find((c) => c.id === resolvedParentId);
      if (!resolvedParent) throw new Error('No se encontró la categoría padre correspondiente.');

      if (images.length === 0) throw new Error('Debes mantener al menos una imagen.');

      const priceValue = parseFloat(priceInput || '0');
      if (!priceValue || Number.isNaN(priceValue) || priceValue <= 0) throw new Error('Ingresa un precio válido.');

      const originalPriceValue = originalPriceInput ? parseFloat(originalPriceInput) : null;
      if (originalPriceInput && Number.isNaN(originalPriceValue || undefined)) {
        throw new Error('Ingresa un precio original válido.');
      }

      const stockValue = parseInt(stockInput || '0', 10);
      if (Number.isNaN(stockValue) || stockValue < 0) throw new Error('Ingresa una cantidad de stock válida.');

      const features = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const categoryLabels = [resolvedParent.name, resolvedChild.name];
      const primaryConsole = getPrimaryConsole(categoryLabels);

      const payload: Partial<Product> = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
  price: priceValue,
  original_price: originalPriceValue,
        console: primaryConsole,
        category_id: resolvedChild.id,
        parent_category_id: resolvedParent.id,
        is_new: formData.is_new ?? false,
        is_on_sale: formData.is_on_sale ?? false,
  stock_count: stockValue,
        in_stock: stockValue > 0,
        image_urls: images,
        features,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', product.id);

      if (error) throw error;

      onProductUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating product:', err);
      alert(err instanceof Error ? err.message : 'Error al actualizar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  const childSelectDisabled = !parentCategoryId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar Producto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentCategory">Categoría Padre</Label>
                  <select
                    id="parentCategory"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={parentCategoryId}
                    onChange={(e) => {
                      setParentCategoryId(e.target.value);
                      setChildCategoryId('');
                    }}
                    required
                  >
                    <option value="">Selecciona una categoría padre</option>
                    {parentOptions.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="childCategory">Categoría Hija</Label>
                  <select
                    id="childCategory"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={childCategoryId}
                    onChange={(e) => setChildCategoryId(e.target.value)}
                    required
                    disabled={childSelectDisabled}
                  >
                    <option value="">{childSelectDisabled ? 'Selecciona primero una categoría padre' : 'Selecciona una categoría hija'}</option>
                    {childOptions.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="original_price">Precio Original (opcional)</Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  value={originalPriceInput}
                  onChange={(e) => setOriginalPriceInput(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="stock_count">Cantidad en Stock</Label>
                <Input
                  id="stock_count"
                  type="number"
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="is_new">Producto Nuevo</Label>
                  <Switch
                    id="is_new"
                    checked={formData.is_new ?? false}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_new: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="is_on_sale">En Oferta</Label>
                  <Switch
                    id="is_on_sale"
                    checked={formData.is_on_sale ?? false}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_on_sale: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="features">Características (una por línea)</Label>
            <Textarea
              id="features"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={3}
            />
          </div>

          <ImageUpload images={images} onImagesChange={setImages} />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;
