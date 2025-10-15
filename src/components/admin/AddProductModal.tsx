import React, { useEffect, useMemo, useState } from 'react';
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

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

type CategoryRow = {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
};

const AddProductModal = ({ isOpen, onClose, onProductAdded }: AddProductModalProps) => {
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [childCategoryId, setChildCategoryId] = useState('');

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
      if (!error && data) {
        setCategories(data as CategoryRow[]);
      }
    };
    loadCategories();
  }, [isOpen]);

  const parentOptions = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  );

  const childOptions = useMemo(
    () => categories.filter((c) => c.parent_id === parentCategoryId),
    [categories, parentCategoryId]
  );

  const parentCategory = useMemo(
    () => categories.find((c) => c.id === parentCategoryId) || null,
    [categories, parentCategoryId]
  );

  const childCategory = useMemo(
    () => categories.find((c) => c.id === childCategoryId) || null,
    [categories, childCategoryId]
  );

  const handleSelectParent = (value: string) => {
    setParentCategoryId(value);
    setChildCategoryId('');
  };

  const handleSelectChild = (value: string) => {
    setChildCategoryId(value);
  };

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
    return found || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!childCategoryId) {
        throw new Error('Selecciona una categoría hija para el producto.');
      }
      const resolvedChild = categories.find((c) => c.id === childCategoryId);
      if (!resolvedChild) throw new Error('No se encontró la categoría hija seleccionada.');
      const resolvedParentId = resolvedChild.parent_id;
      if (!resolvedParentId) {
        throw new Error('La categoría hija seleccionada no tiene una categoría padre.');
      }

      const resolvedParent = categories.find((c) => c.id === resolvedParentId);
      if (!resolvedParent) throw new Error('No se encontró la categoría padre correspondiente.');

      const featuresArray = formData.features
        .split('\n')
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0);

      if (imageUrls.length === 0) {
        throw new Error('Debes subir al menos una imagen.');
      }

      const priceValue = parseFloat(formData.price || '0');
      if (Number.isNaN(priceValue) || priceValue <= 0) {
        throw new Error('Ingresa un precio válido.');
      }

      const originalPriceValue = formData.originalPrice
        ? parseFloat(formData.originalPrice)
        : null;
      if (formData.originalPrice && Number.isNaN(originalPriceValue || undefined)) {
        throw new Error('Ingresa un precio original válido.');
      }

      const stockValue = parseInt(formData.stockCount || '0', 10);
      if (Number.isNaN(stockValue) || stockValue < 0) {
        throw new Error('Ingresa una cantidad de stock válida.');
      }

      const categoryLabels = [resolvedParent.name, resolvedChild.name];
      const primaryConsole = getPrimaryConsole(categoryLabels);

      const { error } = await supabase
        .from('products')
        .insert({
          sku: formData.sku,
          name: formData.name,
          description: formData.description,
          price: priceValue,
          original_price: originalPriceValue,
          console: primaryConsole,
          category_id: resolvedChild.id,
          parent_category_id: resolvedParent.id,
          is_new: formData.isNew,
          is_on_sale: formData.isOnSale,
          stock_count: stockValue,
          in_stock: stockValue > 0,
          image_urls: imageUrls,
          features: featuresArray,
          rating: 0,
          review_count: 0,
          likes_count: 0
        });

      if (error) throw error;

      onProductAdded();
      onClose();
      setFormData({
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
      setImageUrls([]);
      setParentCategoryId('');
      setChildCategoryId('');
    } catch (err) {
      console.error('Error adding product:', err);
      alert(err instanceof Error ? err.message : 'Error al agregar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  const childSelectDisabled = !parentCategoryId;

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
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentCategory">Categoría Padre</Label>
                  <select
                    id="parentCategory"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={parentCategoryId}
                    onChange={(e) => handleSelectParent(e.target.value)}
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
                    onChange={(e) => handleSelectChild(e.target.value)}
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

              <div>
                <Label htmlFor="stockCount">Cantidad en Stock</Label>
                <Input
                  id="stockCount"
                  type="number"
                  value={formData.stockCount}
                  onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isNew"
                    checked={formData.isNew}
                    onCheckedChange={(checked) => setFormData({ ...formData, isNew: checked })}
                  />
                  <Label htmlFor="isNew">Producto Nuevo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isOnSale"
                    checked={formData.isOnSale}
                    onCheckedChange={(checked) => setFormData({ ...formData, isOnSale: checked })}
                  />
                  <Label htmlFor="isOnSale">En Oferta</Label>
                </div>
              </div>

              <ImageUpload images={imageUrls} onImagesChange={setImageUrls} />

              <div>
                <Label htmlFor="features">Características (una por línea)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder={'Gráficos impresionantes\nHistoria envolvente\nMultijugador online'}
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
