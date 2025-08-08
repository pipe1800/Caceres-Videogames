
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkProductUploadProps {
  onProductsProcessed: () => void;
}

interface ProcessResult {
  success: number;
  errors: string[];
  updated: number;
  created: number;
}

const BulkProductUpload = ({ onProductsProcessed }: BulkProductUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const downloadTemplate = () => {
    const headers = [
      'sku',
      'name',
      'description', 
      'price',
      'original_price',
      'console',
      'category',
      'is_new',
      'is_on_sale',
      'stock_count',
      'features',
      'image_urls'
    ];
    
    const csvContent = headers.join(',') + '\n' +
      'EXAMPLE-001,"Ejemplo Producto","Descripción del producto",29.99,39.99,"PlayStation 5","PlayStation",true,false,10,"Gráficos impresionantes|Historia envolvente|Multijugador online","https://example.com/image1.jpg|https://example.com/image2.jpg"';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productos_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = [];
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
        } else if (header === 'features' || header === 'image_urls') {
          obj[header] = value ? value.split('|').map(item => item.trim()) : [];
        } else {
          obj[header] = value;
        }
      });
      
      return obj;
    });
  };

  const processCSV = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const text = await file.text();
      const products = parseCSV(text);
      
      let created = 0;
      let updated = 0;
      const errors: string[] = [];
      
      for (const product of products) {
        try {
          if (!product.sku || !product.name || !product.price || !product.console || !product.category) {
            errors.push(`Producto con SKU "${product.sku || 'sin SKU'}" tiene campos requeridos vacíos`);
            continue;
          }
          
          // Check if product exists
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('sku', product.sku)
            .single();
          
          const productData = {
            sku: product.sku,
            name: product.name,
            description: product.description || '',
            price: product.price,
            original_price: product.original_price,
            console: product.console,
            category: product.category,
            is_new: product.is_new || false,
            is_on_sale: product.is_on_sale || false,
            stock_count: product.stock_count || 0,
            in_stock: (product.stock_count || 0) > 0,
            image_urls: product.image_urls || [],
            features: product.features || [],
            rating: 0,
            review_count: 0
          };
          
          if (existing) {
            // Update existing product
            const { error } = await supabase
              .from('products')
              .update(productData)
              .eq('sku', product.sku);
              
            if (error) throw error;
            updated++;
          } else {
            // Create new product
            const { error } = await supabase
              .from('products')
              .insert(productData);
              
            if (error) throw error;
            created++;
          }
        } catch (error) {
          console.error('Error processing product:', error);
          errors.push(`Error procesando SKU "${product.sku}": ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
      
      setResult({
        success: created + updated,
        errors,
        created,
        updated
      });
      
      onProductsProcessed();
    } catch (error) {
      console.error('Error processing CSV:', error);
      setResult({
        success: 0,
        errors: ['Error al procesar el archivo CSV'],
        created: 0,
        updated: 0
      });
    } finally {
      setIsProcessing(false);
    }
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
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar Template CSV
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
        
        <Button
          onClick={processCSV}
          disabled={!file || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Procesando...' : 'Procesar CSV'}
        </Button>
        
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
                  <ul className="list-disc pl-5 mt-2">
                    {result.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
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
            <li>Los campos requeridos son: sku, name, price, console, category</li>
            <li>Para features e image_urls, separa los valores con "|"</li>
            <li>Los productos con SKU existente serán actualizados</li>
            <li>Los productos con SKU nuevo serán creados</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkProductUpload;
