import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface ParsedProduct {
  sku: string;
  name: string;
  description?: string;
  price: number | null;
  original_price?: number | null;
  categories: string[];
  is_new?: boolean;
  is_on_sale?: boolean;
  stock_count?: number;
  features?: string[];
  console?: string;
  category?: string;
}

const BulkProductUpload = ({ onProductsProcessed }: BulkProductUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [imagesBySku, setImagesBySku] = useState<Record<string, string[]>>({});
  const [expandedSku, setExpandedSku] = useState<string | null>(null);

  const downloadTemplate = () => {
    const headers = [
      'sku',
      'name',
      'description', 
      'price',
      'original_price',
      'console',
      'category',
      'categories_1',
      'categories_2',
      'categories_3',
      'is_new',
      'is_on_sale',
      'stock_count',
      'features'
    ];
    
    const csvContent = headers.join(',') + '\n' +
      'EXAMPLE-001,"Ejemplo Producto","Descripción del producto",29.99,39.99,"PlayStation 5","Juegos de Acción","PlayStation 5","Juegos",,"true",false,10,"Gráficos impresionantes|Historia envolvente|Multijugador online"';
    
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

    // Fetch categories from DB to populate the validation list
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    const categoryNames = (categoriesData || []).map(c => c.name);

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
    lists.getCell('B1').value = 'Categorias';
    categoryNames.forEach((c, i) => lists.getCell(`B${i + 2}`).value = c);

    // Define named ranges for validation (ExcelJS API uses .add)
    workbook.definedNames.add('ConsolasLista', `Listas!$A$2:$A$${consoles.length + 1}`);
    workbook.definedNames.add('CategoriasLista', `Listas!$B$2:$B$${categoryNames.length + 1}`);

    // Headers
    const headers = [
      'sku','name','description','price','original_price','console','category','categories_1','categories_2','categories_3','is_new','is_on_sale','stock_count','features'
    ];
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };

    // Example row
    sheet.addRow([
      'EXAMPLE-001', 'Ejemplo Producto', 'Descripción del producto', 29.99, 39.99,
      'PlayStation 5', 'Juegos de Acción', 'PlayStation 5', 'Juegos', '', true, false, 10,
      'Gráficos impresionantes|Historia envolvente|Multijugador online'
    ]);

    // Column widths
    const widths = [16,28,36,12,14,16,20,16,16,16,10,12,12,36];
    widths.forEach((w, i) => sheet.getColumn(i + 1).width = w);

    // Data validation for console (F) and category (G)
    // @ts-ignore - dataValidations is available at runtime but missing in types
    (sheet as any).dataValidations.add('F2:F1000', {
      type: 'list', allowBlank: false, formulae: ['=ConsolasLista']
    });
    // @ts-ignore - dataValidations is available at runtime but missing in types
    (sheet as any).dataValidations.add('G2:G1000', {
      type: 'list', allowBlank: false, formulae: ['=CategoriasLista']
    });

    // Data validation for categories_1..3 (H..J)
    ;['H','I','J'].forEach(col => {
      // @ts-ignore - dataValidations is available at runtime but missing in types
      (sheet as any).dataValidations.add(`${col}2:${col}1000`, {
        type: 'list', allowBlank: true, formulae: ['=CategoriasLista']
      });
    });

    // Notes row
    const notesRow = sheet.addRow([
      'Notas:','Use las listas desplegables para consola y categoría. Para múltiples categorías, use categories_1..3. Exportar como CSV antes de subir.',
      '', '', '', '', '', '', '', '', '', '', '', ''
    ]);
    notesRow.getCell(2).alignment = { wrapText: true };
    sheet.mergeCells(`B${notesRow.number}:N${notesRow.number}`);

    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productos_template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ParsedProduct[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
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
      
      const obj: any = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        value = value.replace(/^"|"$/g, '');
        
        if (header === 'price' || header === 'original_price') {
          obj[header] = value ? parseFloat(value) : null;
        } else if (header === 'stock_count') {
          obj[header] = value ? parseInt(value) : 0;
        } else if (header === 'is_new' || header === 'is_on_sale') {
          obj[header] = value.toLowerCase() === 'true';
        } else if (header === 'features') {
          obj[header] = value ? value.split('|').map((item: string) => item.trim()).filter(Boolean) : [];
        } else if (header === 'categories') { // legacy single column
          obj['categories'] = value ? value.split('|').map((item: string) => item.trim()).filter(Boolean) : [];
        } else if (header === 'categories_1' || header === 'categories_2' || header === 'categories_3') {
          obj[header] = value;
        } else {
          obj[header] = value;
        }
      });

      // Merge categories_1..3 into categories array if present
      const catCols = ['categories_1','categories_2','categories_3'] as const;
      const catList = catCols.map(c => (obj[c] as string)?.trim()).filter(Boolean);
      if (catList.length > 0) {
        obj.categories = [...new Set([...(obj.categories || []), ...catList])];
      }
      return obj as ParsedProduct;
    });
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

  const handleParse = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResult(null);
    try {
      const text = await file.text();
      const products = parseCSV(text);
      setParsedProducts(products);
      // Initialize empty images per SKU
      const imageState: Record<string, string[]> = {};
      products.forEach(p => { imageState[p.sku] = imagesBySku[p.sku] || []; });
      setImagesBySku(imageState);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setResult({ success: 0, errors: ['Error al procesar el archivo CSV'], created: 0, updated: 0 });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveProduct = async (product: ParsedProduct, images: string[]) => {
    if (!product.sku || !product.name || !product.price || !product.categories || product.categories.length === 0) {
      throw new Error(`Producto con SKU "${product.sku || 'sin SKU'}" tiene campos requeridos vacíos`);
    }
    if (!images || images.length === 0) {
      throw new Error(`Producto con SKU "${product.sku}": debe tener al menos una imagen`);
    }

    // Check if product exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', product.sku)
      .maybeSingle();

    const primaryConsole = (product.console || '').trim() || getPrimaryConsole(product.categories);
    const primaryCategory = (product.category || '').trim() || getPrimaryCategory(product.categories);

    const productData = {
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price,
      original_price: product.original_price,
      console: primaryConsole,
      category: primaryCategory,
      categories: product.categories,
      is_new: product.is_new || false,
      is_on_sale: product.is_on_sale || false,
      stock_count: product.stock_count || 0,
      in_stock: (product.stock_count || 0) > 0,
      image_urls: images,
      features: product.features || [],
      rating: 0,
      review_count: 0
    };

    if (existing) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('sku', product.sku);
      if (error) throw error;
      return 'updated' as const;
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData);
      if (error) throw error;
      return 'created' as const;
    }
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
        
        <div>
          <Label htmlFor="csv-file">Archivo CSV</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
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
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorías</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consola</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imágenes</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedProducts.map((p) => {
                    const imgs = imagesBySku[p.sku] || [];
                    const consoleName = getPrimaryConsole(p.categories);
                    const categoryName = getPrimaryCategory(p.categories);
                    const hasErrors = !p.sku || !p.name || !p.price || !p.categories?.length;
                    const imageError = imgs.length === 0;
                    return (
                      <React.Fragment key={p.sku}>
                        <tr className={hasErrors || imageError ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2 text-sm">{p.sku}</td>
                          <td className="px-4 py-2 text-sm">{p.name}</td>
                          <td className="px-4 py-2 text-sm">{p.price ?? '-'}</td>
                          <td className="px-4 py-2 text-sm">{p.categories?.join(' | ')}</td>
                          <td className="px-4 py-2 text-sm">{p.stock_count ?? 0}</td>
                          <td className="px-4 py-2 text-sm">{consoleName || '-'}</td>
                          <td className="px-4 py-2 text-sm">{categoryName || '-'}</td>
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
                            <td colSpan={9} className="px-4 py-4 bg-gray-50">
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
        
        <div className="text-sm text-gray-600">
          <p><strong>Instrucciones:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Descarga el template CSV y úsalo como guía</li>
            <li>Los campos requeridos son: sku, name, price, categories</li>
            <li>Para features y categories, separa los valores con "|"</li>
            <li>Primero carga y previsualiza, luego sube imágenes por producto</li>
            <li>Debes subir al menos una imagen por producto antes de guardar</li>
            <li>Puedes guardar cada fila o usar "Procesar todos"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkProductUpload;
