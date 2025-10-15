import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, AlertCircle, CheckCircle, Images, Trash2, Save, FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ImageUpload from '@/components/admin/ImageUpload';

interface BulkProductUploadProps {
  onProductsProcessed: () => void;
}

interface ProcessResult {
  success: number;
  errors: string[];
  updated: number;
  created: number;
}

type CategoryRow = {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
  is_active: boolean | null;
};

interface ParsedProduct {
  sku: string;
  name: string;
  description?: string;
  price: number | null;
  original_price?: number | null;
  categoryName?: string;
  parentCategoryName?: string;
  legacyCategories?: string[];
  is_new?: boolean;
  is_on_sale?: boolean;
  stock_count?: number;
  features?: string[];
  console?: string; // derived from categories or provided
  selectedParentCategoryId?: string;
  selectedChildCategoryId?: string;
}

const BulkProductUpload = ({ onProductsProcessed }: BulkProductUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [imagesBySku, setImagesBySku] = useState<Record<string, string[]>>({});
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const normalize = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

  const categoriesById = useMemo(() => {
    const map = new Map<string, CategoryRow>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const categoriesByName = useMemo(() => {
    const map = new Map<string, CategoryRow>();
    categories.forEach((c) => map.set(normalize(c.name), c));
    return map;
  }, [categories, normalize]);

  const parentCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);

  const childCategoriesByParent = useMemo(() => {
    const map = new Map<string, CategoryRow[]>();
    categories.forEach((category) => {
      if (!category.parent_id) return;
      if (!map.has(category.parent_id)) {
        map.set(category.parent_id, []);
      }
      map.get(category.parent_id)!.push(category);
    });
    return map;
  }, [categories]);

  useEffect(() => {
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
  }, []);

  const downloadTemplate = () => {
    const headers = [
      'sku',
      'name',
      'description', 
      'price',
      'original_price',
      'console',
      'is_new',
      'is_on_sale',
      'stock_count',
      'features'
    ];
    
    const csvContent = headers.join(',') + '\n' +
      'EXAMPLE-001,"Ejemplo Producto","Descripción del producto",29.99,39.99,"PlayStation 5",true,false,10,"Gráficos impresionantes|Historia envolvente|Multijugador online"';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productos_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = async () => {
    // Dynamic import to ensure browser-friendly build
    const Excel = await import('exceljs');

    const consoles = [
      'Nintendo Switch',
      'PlayStation 5',
      'PlayStation 4',
      'Xbox Series X',
      'Xbox One',
      'PC'
    ];

    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet('Template');
    const lists = workbook.addWorksheet('Listas');

    // Write lists
    lists.getCell('A1').value = 'Consolas';
    consoles.forEach((c, i) => lists.getCell(`A${i + 2}`).value = c);

    workbook.definedNames.add('ConsolasLista', `Listas!$A$2:$A$${consoles.length + 1}`);

    const headers = [
      'sku','name','description','price','original_price','console','is_new','is_on_sale','stock_count','features'
    ];
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };

    sheet.addRow([
      'EXAMPLE-001', 'Ejemplo Producto', 'Descripción del producto', 29.99, 39.99,
      'PlayStation 5', true, false, 10,
      'Gráficos impresionantes|Historia envolvente|Multijugador online'
    ]);

    const widths = [16,28,36,12,14,18,12,12,12,36];
    widths.forEach((w, i) => sheet.getColumn(i + 1).width = w);

    // Data validations
    const dv = (sheet as any).dataValidations;
    dv.add('F2:F1000', { type: 'list', allowBlank: false, formulae: ['=ConsolasLista'] });

    const notesRow = sheet.addRow([
      'Notas:',
      'Las categorías padre e hija se seleccionan directamente en el panel después de cargar el archivo. Puedes subir este template en formato XLSX o exportarlo como CSV si lo prefieres.',
      '', '', '', '', '', '', '', ''
    ]);
    notesRow.getCell(2).alignment = { wrapText: true };
    sheet.mergeCells(`B${notesRow.number}:J${notesRow.number}`);

    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productos_template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const buildProductFromRecord = (headers: string[], values: string[]): ParsedProduct => {
    const draft: ParsedProduct & { legacy?: string[] } = {
      sku: '',
      name: '',
      price: null,
      legacy: []
    };

    headers.forEach((header, index) => {
      const rawHeader = (header ?? '').toString().trim();
      if (!rawHeader) return;

      let value = (values[index] ?? '').toString().trim();
      value = value.replace(/^"|"$/g, '');
      const lower = rawHeader.toLowerCase();

      if (lower === 'sku') draft.sku = value;
      else if (lower === 'name') draft.name = value;
      else if (lower === 'description') draft.description = value;
      else if (lower === 'price' || lower === 'original_price') {
        (draft as any)[lower] = value ? parseFloat(value) : null;
      } else if (lower === 'stock_count') {
        draft.stock_count = value ? parseInt(value, 10) : 0;
      } else if (lower === 'is_new' || lower === 'is_on_sale') {
        (draft as any)[lower] = value.toLowerCase() === 'true';
      } else if (lower === 'features') {
        draft.features = value ? value.split('|').map((item: string) => item.trim()).filter(Boolean) : [];
      } else if (lower === 'console') {
        draft.console = value;
      } else if (lower === 'parent_category' || lower === 'parent_category_name') {
        draft.parentCategoryName = value;
      } else if (lower === 'category' || lower === 'category_name') {
        draft.categoryName = value;
      } else if (lower === 'categories' || lower === 'categories_1' || lower === 'categories_2' || lower === 'categories_3') {
        if (value) draft.legacy?.push(value);
      }
    });

    const merged = Array.from(new Set([
      draft.categoryName,
      draft.parentCategoryName,
      ...(draft.legacy || [])
    ].filter(Boolean) as string[]));

    if (!draft.categoryName && merged.length > 0) {
      draft.categoryName = merged[0];
    }

    return {
      sku: draft.sku.trim(),
      name: draft.name.trim(),
      description: draft.description,
      price: draft.price,
      original_price: draft.original_price,
      categoryName: draft.categoryName?.trim(),
      parentCategoryName: draft.parentCategoryName?.trim(),
      legacyCategories: merged,
      is_new: draft.is_new,
      is_on_sale: draft.is_on_sale,
      stock_count: draft.stock_count,
      features: draft.features,
      console: draft.console?.trim()
    } as ParsedProduct;
  };

  const parseCSV = (text: string): ParsedProduct[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    return lines.slice(1)
      .map((line) => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        return values;
      })
      .filter((values) => values.some((value) => value.trim().length > 0))
      .map((values) => buildProductFromRecord(headers, values));
  };

  const parseXLSX = async (file: File): Promise<ParsedProduct[]> => {
    const Excel = await import('exceljs');
    const workbook = new Excel.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    const headerRow = sheet.getRow(1);
    const headerValues = Array.isArray(headerRow.values) ? headerRow.values : [];
    const headers = headerValues
      .slice(1)
      .map((cell: any) => {
        if (cell == null) return '';
        if (typeof cell === 'object' && 'text' in cell) return String(cell.text || '').trim();
        return String(cell).trim();
      }) || [];

    const records: ParsedProduct[] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
  const rowValues = Array.isArray(row.values) ? row.values : [];
  const rawValues = rowValues.slice(1);
      const normalizedValues = headers.map((_, index) => {
        const cell = rawValues[index];
        if (cell == null) return '';
        if (typeof cell === 'object' && 'text' in cell) return String(cell.text || '').trim();
        if (typeof cell === 'number') return Number.isFinite(cell) ? cell.toString() : '';
        if (typeof cell === 'boolean') return cell ? 'true' : 'false';
        return String(cell).trim();
      });

      if (normalizedValues.every((value) => value === '')) return;
      records.push(buildProductFromRecord(headers, normalizedValues));
    });

    return records;
  };

  const applyInitialCategorySelections = (products: ParsedProduct[], sourceCategories: CategoryRow[]): ParsedProduct[] => {
    if (sourceCategories.length === 0) return products;

    const byId = new Map(sourceCategories.map((cat) => [cat.id, cat] as const));
    const byName = new Map(sourceCategories.map((cat) => [normalize(cat.name), cat] as const));

    return products.map((product) => {
      let selectedParentCategoryId = product.selectedParentCategoryId;
      let selectedChildCategoryId = product.selectedChildCategoryId;

      const hintLabels = [
        product.categoryName,
        product.parentCategoryName,
        ...(product.legacyCategories || [])
      ].filter(Boolean) as string[];

      for (const label of hintLabels) {
        const candidate = byName.get(normalize(label));
        if (!candidate) continue;

        if (candidate.parent_id) {
          selectedChildCategoryId = candidate.id;
          selectedParentCategoryId = candidate.parent_id;
          break;
        }

        if (!candidate.parent_id && !selectedParentCategoryId) {
          selectedParentCategoryId = candidate.id;
        }
      }

      if (selectedChildCategoryId) {
        const child = byId.get(selectedChildCategoryId);
        if (!child) {
          selectedChildCategoryId = undefined;
        } else if (child.parent_id && child.parent_id !== selectedParentCategoryId) {
          selectedParentCategoryId = child.parent_id;
        }
      }

      if (!selectedParentCategoryId && selectedChildCategoryId) {
        const child = byId.get(selectedChildCategoryId);
        if (child) {
          selectedParentCategoryId = child.parent_id ?? child.id;
        }
      }

      if (!selectedChildCategoryId && selectedParentCategoryId) {
        const children = sourceCategories.filter((cat) => cat.parent_id === selectedParentCategoryId);
        if (children.length === 1) {
          selectedChildCategoryId = children[0].id;
        }
      }

      return {
        ...product,
        selectedParentCategoryId,
        selectedChildCategoryId
      };
    });
  };

  const collectCategoryLabels = (product: ParsedProduct): string[] => {
    const set = new Set<string>();
    if (product.selectedParentCategoryId) {
      const parent = categoriesById.get(product.selectedParentCategoryId);
      if (parent) set.add(parent.name);
    }
    if (product.selectedChildCategoryId) {
      const child = categoriesById.get(product.selectedChildCategoryId);
      if (child) set.add(child.name);
    }
    if (product.parentCategoryName) set.add(product.parentCategoryName);
    if (product.categoryName) set.add(product.categoryName);
    (product.legacyCategories || []).forEach((label) => set.add(label));
    return Array.from(set);
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

  const handleParse = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResult(null);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let products: ParsedProduct[] = [];

      if (extension === 'xlsx') {
        products = await parseXLSX(file);
      } else {
        const text = await file.text();
        products = parseCSV(text);
      }

      let sourceCategories = categories;
      if (sourceCategories.length === 0) {
        const { data } = await supabase
          .from('categories')
          .select('id,name,slug,parent_id,is_active')
          .eq('is_active', true)
          .order('parent_id', { ascending: true })
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });
        if (data) {
          sourceCategories = data as CategoryRow[];
          setCategories(sourceCategories);
        }
      }

      const productsWithSelections = applyInitialCategorySelections(products, sourceCategories);

      setParsedProducts(productsWithSelections);
      // Initialize empty images per SKU
      const imageState: Record<string, string[]> = {};
      productsWithSelections.forEach(p => { imageState[p.sku] = imagesBySku[p.sku] || []; });
      setImagesBySku(imageState);
    } catch (error) {
      console.error('Error parsing file:', error);
      setResult({ success: 0, errors: ['Error al procesar el archivo. Asegúrate de usar un CSV o Excel válido.'], created: 0, updated: 0 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParentSelect = (sku: string, parentId: string) => {
    setParsedProducts((prev) =>
      prev.map((product) => {
        if (product.sku !== sku) return product;
        const childOptions = childCategoriesByParent.get(parentId) || [];
        const childIsValid = childOptions.some((child) => child.id === product.selectedChildCategoryId);
        return {
          ...product,
          selectedParentCategoryId: parentId,
          selectedChildCategoryId: childIsValid ? product.selectedChildCategoryId : undefined
        };
      })
    );
  };

  const handleChildSelect = (sku: string, childId: string) => {
    setParsedProducts((prev) =>
      prev.map((product) => {
        if (product.sku !== sku) return product;
        const child = categoriesById.get(childId);
        return {
          ...product,
          selectedChildCategoryId: childId,
          selectedParentCategoryId: child?.parent_id ?? product.selectedParentCategoryId
        };
      })
    );
  };

  const saveProduct = async (product: ParsedProduct, images: string[]) => {
    if (categories.length === 0) {
      const { data } = await supabase
        .from('categories')
        .select('id,name,slug,parent_id,is_active')
        .eq('is_active', true);
      if (data) {
        setCategories(data as CategoryRow[]);
      }
    }

    if (!product.sku || !product.name || !product.price) {
      throw new Error(`Producto con SKU "${product.sku || 'sin SKU'}" tiene campos requeridos vacíos`);
    }
    if (!images || images.length === 0) {
      throw new Error(`Producto con SKU "${product.sku}": debe tener al menos una imagen`);
    }

    let categoryIdLookup = categoriesById;

    if (categoryIdLookup.size === 0) {
      const { data } = await supabase
        .from('categories')
        .select('id,name,slug,parent_id,is_active')
        .eq('is_active', true);
      if (data) {
        const fetched = data as CategoryRow[];
        setCategories(fetched);
        categoryIdLookup = new Map(fetched.map((c) => [c.id, c]));
      }
    }

    if (!product.selectedParentCategoryId) {
      throw new Error(`Producto con SKU "${product.sku}": selecciona una categoría padre.`);
    }

    if (!product.selectedChildCategoryId) {
      throw new Error(`Producto con SKU "${product.sku}": selecciona una categoría hija.`);
    }

    const resolvedParent = categoryIdLookup.get(product.selectedParentCategoryId);
    if (!resolvedParent) {
      throw new Error(`La categoría padre seleccionada no existe o no está activa para el SKU ${product.sku}.`);
    }

    const resolvedChild = categoryIdLookup.get(product.selectedChildCategoryId);
    if (!resolvedChild) {
      throw new Error(`La categoría hija seleccionada no existe o no está activa para el SKU ${product.sku}.`);
    }

    if (resolvedChild.parent_id) {
      if (resolvedChild.parent_id !== resolvedParent.id) {
        throw new Error(`La categoría hija ${resolvedChild.name} no pertenece a la categoría padre ${resolvedParent.name}.`);
      }
    } else if (resolvedChild.id !== resolvedParent.id) {
      throw new Error(`La categoría seleccionada (${resolvedChild.name}) no coincide con la jerarquía esperada.`);
    }

    const hints = Array.from(new Set([...collectCategoryLabels(product), resolvedParent.name, resolvedChild.name]));

    const primaryConsole = (product.console || '').trim() || getPrimaryConsole(hints);

    const { data: existing } = await supabase
      .from('products')
      .select('id, likes_count, rating, review_count')
      .eq('sku', product.sku)
      .maybeSingle();

    const stockCount = product.stock_count ?? 0;
    const productData = {
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price,
      original_price: product.original_price ?? null,
      console: primaryConsole,
      category_id: resolvedChild.id,
      parent_category_id: resolvedParent.id,
      is_new: product.is_new ?? false,
      is_on_sale: product.is_on_sale ?? false,
      stock_count: stockCount,
      in_stock: stockCount > 0,
      image_urls: images,
      features: product.features || [],
      updated_at: new Date().toISOString()
    };

    if (existing) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existing.id);
      if (error) throw error;
      return 'updated' as const;
    }

    const { error: insertErr } = await supabase
      .from('products')
      .insert({
        ...productData,
        likes_count: 0,
        rating: existing?.rating ?? 0,
        review_count: existing?.review_count ?? 0
      });
    if (insertErr) throw insertErr;

    return 'created' as const;
  };

  const processAll = async () => {
    if (parsedProducts.length === 0) return;
    setIsProcessing(true);
    setResult(null);
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const product of parsedProducts) {
      const images = imagesBySku[product.sku] || [];
      try {
    const status = await saveProduct(product, images);
        if (status === 'created') created++; else updated++;
      } catch (err) {
        console.error('Error processing product:', err);
        errors.push(err instanceof Error ? err.message : `Error desconocido en SKU ${product.sku}`);
      }
    }

    setResult({ success: created + updated, created, updated, errors });
    setIsProcessing(false);
    if (created + updated > 0) onProductsProcessed();
  };

  const saveSingle = async (sku: string) => {
    const product = parsedProducts.find(p => p.sku === sku);
    if (!product) return;
    setIsProcessing(true);
    try {
      const status = await saveProduct(product, imagesBySku[sku] || []);
      setResult({
        success: 1,
        created: status === 'created' ? 1 : 0,
        updated: status === 'updated' ? 1 : 0,
        errors: []
      });
      // Remove saved row from preview to avoid duplicates
      setParsedProducts(prev => prev.filter(p => p.sku !== sku));
      setImagesBySku(prev => {
        const { [sku]: _, ...rest } = prev; return rest;
      });
      onProductsProcessed();
    } catch (err) {
      setResult({ success: 0, created: 0, updated: 0, errors: [err instanceof Error ? err.message : 'Error desconocido'] });
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteRow = (sku: string) => {
    setParsedProducts(prev => prev.filter(p => p.sku !== sku));
    setImagesBySku(prev => { const { [sku]: _, ...rest } = prev; return rest; });
    if (expandedSku === sku) setExpandedSku(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Carga Masiva de Productos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={downloadExcelTemplate}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Descargar Template Excel
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="csv-file" className="text-sm font-medium">Seleccionar Archivo</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="csv-file" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full sm:w-auto cursor-pointer">
              <Upload className="h-4 w-4" />
              Elegir Archivo CSV o Excel
            </label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>
          {file && (
            <p className="text-sm text-green-600 font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Archivo seleccionado: {file.name}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            onClick={handleParse}
            disabled={!file || isProcessing}
            className="w-full"
            variant="secondary"
          >
            {isProcessing ? 'Procesando...' : 'Cargar y previsualizar'}
          </Button>
          <Button
            onClick={processAll}
            disabled={parsedProducts.length === 0 || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Procesando...' : 'Procesar todos'}
          </Button>
        </div>
        
        {parsedProducts.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecciona la categoría padre y luego la categoría hija correspondiente para cada fila antes de guardar.
            </p>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría Padre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría Hija</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imágenes</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedProducts.map((p) => {
                    const imgs = imagesBySku[p.sku] || [];
                    const childOptions = p.selectedParentCategoryId ? childCategoriesByParent.get(p.selectedParentCategoryId) || [] : [];
                    const hasCategorySelection = Boolean(p.selectedParentCategoryId && p.selectedChildCategoryId);
                    const hasErrors = !p.sku || !p.name || !p.price || !hasCategorySelection;
                    const imageError = imgs.length === 0;
                    return (
                      <React.Fragment key={p.sku}>
                        <tr className={hasErrors || imageError ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2 text-sm">{p.sku}</td>
                          <td className="px-4 py-2 text-sm">{p.name}</td>
                          <td className="px-4 py-2 text-sm">{p.price ?? '-'}</td>
                          <td className="px-4 py-2 text-sm min-w-[160px]">
                            <Select
                              value={p.selectedParentCategoryId || undefined}
                              onValueChange={(value) => handleParentSelect(p.sku, value)}
                            >
                              <SelectTrigger className={`w-[160px] text-xs ${!p.selectedParentCategoryId ? 'border-red-300' : ''}`}>
                                <SelectValue placeholder="Categoría padre" />
                              </SelectTrigger>
                              <SelectContent className="bg-white max-h-72">
                                {parentCategories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-2 text-sm min-w-[160px]">
                            <Select
                              value={p.selectedChildCategoryId || undefined}
                              onValueChange={(value) => handleChildSelect(p.sku, value)}
                              disabled={!p.selectedParentCategoryId || childOptions.length === 0}
                            >
                              <SelectTrigger className={`w-[160px] text-xs ${!p.selectedChildCategoryId ? 'border-red-300' : ''}`}>
                                <SelectValue
                                  placeholder={
                                    !p.selectedParentCategoryId
                                      ? 'Categoría padre primero'
                                      : childOptions.length === 0
                                        ? 'Sin subcategorías'
                                        : 'Categoría hija'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="bg-white max-h-72">
                                {childOptions.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-2 text-sm">{p.stock_count ?? 0}</td>
                          <td className="px-4 py-2 text-sm">{imgs.length} {imgs.length === 1 ? 'imagen' : 'imágenes'}</td>
                          <td className="px-4 py-2 text-sm whitespace-nowrap flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setExpandedSku(expandedSku === p.sku ? null : p.sku)}
                              className="flex items-center gap-2"
                            >
                              <Images className="h-4 w-4" />
                              Subir imágenes
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => saveSingle(p.sku)}
                              disabled={hasErrors || imageError || isProcessing}
                              className="flex items-center gap-2"
                            >
                              <Save className="h-4 w-4" />
                              Guardar
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => deleteRow(p.sku)}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                        {expandedSku === p.sku && (
                          <tr>
                            <td colSpan={8} className="px-4 py-4 bg-gray-50">
                              <ImageUpload
                                images={imagesBySku[p.sku] || []}
                                onImagesChange={(images) => setImagesBySku(prev => ({ ...prev, [p.sku]: images }))}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">Nota: Se requiere al menos una imagen por producto antes de guardar.</p>
          </div>
        )}
        
        {result && (
          <div className="space-y-2">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Procesamiento completado: {result.created} productos creados, {result.updated} productos actualizados
              </AlertDescription>
            </Alert>
            
            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>Errores encontrados:</div>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="text-sm break-words">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkProductUpload;
