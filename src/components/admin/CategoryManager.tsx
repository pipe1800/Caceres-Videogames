import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, ChevronRight, Plus, RefreshCcw, Trash2, EyeOff, Eye, AlertTriangle, Pencil } from 'lucide-react';

interface CategoryRow {
  id: string; name: string; slug: string | null; parent_id: string | null; is_active: boolean | null; created_at: string; sort_order: number | null;
}

interface EnrichedCategory extends CategoryRow {
  productCount: number;
  childCount: number;
}

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<EnrichedCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState('');
  const [newParent, setNewParent] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<EnrichedCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EnrichedCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editParent, setEditParent] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cats, error } = await supabase
        .from('categories')
        .select('id,name,slug,parent_id,is_active,created_at,sort_order')
        .order('parent_id', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      const catList: CategoryRow[] = cats || [];

      const { data: productRows, error: productErr } = await supabase
        .from('products')
        .select('id,category_id,parent_category_id');
      if (productErr) throw productErr;

      const directProductCount: Record<string, number> = {};
      (productRows || []).forEach((row) => {
        if (row.category_id) {
          directProductCount[row.category_id] = (directProductCount[row.category_id] || 0) + 1;
        }
      });

      const childrenByParent: Record<string, CategoryRow[]> = {};
      catList.forEach((c) => {
        if (c.parent_id) {
          (childrenByParent[c.parent_id] ||= []).push(c);
        }
      });

      const aggregatedCache = new Map<string, number>();
      const computeAggregate = (id: string): number => {
        if (aggregatedCache.has(id)) return aggregatedCache.get(id)!;
        let total = directProductCount[id] || 0;
        const kids = childrenByParent[id] || [];
        kids.forEach((child) => { total += computeAggregate(child.id); });
        aggregatedCache.set(id, total);
        return total;
      };

      const enriched: EnrichedCategory[] = catList.map((c) => ({
        ...c,
        productCount: computeAggregate(c.id),
        childCount: (childrenByParent[c.id] || []).length
      }));
      setCategories(enriched);
    } catch (e) {
      console.error('Error fetching categories', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const roots = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const children = useCallback((id: string) => categories.filter(c => c.parent_id === id), [categories]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { error } = await supabase.from('categories').insert({ name, slug, parent_id: newParent || null, is_active: true });
      if (error) throw error;
      setNewName(''); setNewParent('');
      await fetchData();
    } catch (e) {
      console.error('Error adding category', e);
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (cat: EnrichedCategory) => {
    try {
      const { error } = await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
      if (error) throw error;
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !cat.is_active } : c));
    } catch (e) { console.error('Error toggling active', e); }
  };

  const canHardDelete = (cat: EnrichedCategory) => cat.childCount === 0 && cat.productCount === 0;

  const performDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (canHardDelete(confirmDelete)) {
        const { error } = await supabase.from('categories').delete().eq('id', confirmDelete.id);
        if (error) throw error;
      } else {
        // soft delete
        const { error } = await supabase.from('categories').update({ is_active: false }).eq('id', confirmDelete.id);
        if (error) throw error;
      }
      setConfirmDelete(null);
      await fetchData();
    } catch (e) {
      console.error('Error deleting category', e);
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = (cat: EnrichedCategory) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditParent(cat.parent_id || '');
  };

  const updateCategory = async () => {
    if (!editingCategory || !editName.trim()) return;
    setUpdating(true);
    try {
      const slug = editName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { error } = await supabase
        .from('categories')
        .update({ 
          name: editName.trim(), 
          slug,
          parent_id: editParent || null 
        })
        .eq('id', editingCategory.id);
      if (error) throw error;
      setEditingCategory(null);
      setEditName('');
      setEditParent('');
      await fetchData();
    } catch (e) {
      console.error('Error updating category', e);
    } finally {
      setUpdating(false);
    }
  };

  const Row: React.FC<{ cat: EnrichedCategory; depth: number }> = ({ cat, depth }) => {
    const kids = children(cat.id);
    const expandedRow = expanded.has(cat.id);
    return (
      <div className={`border rounded-md p-2 bg-white ${!cat.is_active ? 'opacity-50' : ''}`}>        
        <div className="flex items-center gap-2">
          <div style={{ paddingLeft: depth * 12 }} className="flex items-center gap-1 flex-1">
            {kids.length > 0 && (
              <button type="button" onClick={() => toggleExpand(cat.id)} className="text-gray-600 hover:text-gray-900">
                {expandedRow ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            {kids.length === 0 && <span className="w-4" />}
            <span className="font-medium truncate max-w-[180px]" title={cat.name}>{cat.name}</span>
            <Badge variant={cat.productCount ? 'secondary' : 'outline'} className="ml-2">{cat.productCount} prod</Badge>
            {cat.childCount > 0 && <Badge variant="outline">{cat.childCount} sub</Badge>}
            {!cat.is_active && <Badge variant="destructive">inactiva</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEditDialog(cat)} title="Editar categoría">
              <Pencil className="w-4 h-4 text-blue-600" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => toggleActive(cat)} title={cat.is_active ? 'Desactivar (soft delete)' : 'Reactivar'}>
              {cat.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(cat)} title={canHardDelete(cat) ? 'Eliminar definitivamente' : 'Desactivar / eliminar lógico'}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
        {expandedRow && kids.length > 0 && (
          <div className="mt-2 space-y-2">
            {kids.map(k => <Row key={k.id} cat={k as EnrichedCategory} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Nueva categoría</label>
          <div className="flex gap-2">
            <Input placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} />
            <select className="border rounded-md px-2 text-sm" value={newParent} onChange={e => setNewParent(e.target.value)}>
              <option value="">(Raíz)</option>
              {categories.filter(c => !c.parent_id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <Button type="button" onClick={addCategory} disabled={adding || !newName.trim()}> <Plus className="w-4 h-4" /> </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={fetchData} disabled={loading} className="flex items-center gap-2">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {loading && <div className="text-sm text-gray-500">Cargando categorías...</div>}
        {!loading && roots.length === 0 && <div className="text-sm text-gray-500">No hay categorías.</div>}
        {!loading && roots.map(r => <Row key={r.id} cat={r} depth={0} />)}
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={() => !deleting && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar {confirmDelete && canHardDelete(confirmDelete) ? 'eliminación' : 'desactivación'}</DialogTitle>
          </DialogHeader>
          {confirmDelete && (
            <div className="space-y-4 text-sm">
              {canHardDelete(confirmDelete) ? (
                <p>Esta categoría no tiene subcategorías ni productos asociados. Se eliminará permanentemente.</p>
              ) : (
                <div className="flex gap-2 items-start text-amber-600">
                  <AlertTriangle className="w-5 h-5 mt-0.5" />
                  <p>La categoría tiene {confirmDelete.childCount} subcategorías o {confirmDelete.productCount} productos. Se marcará como inactiva (soft delete) y dejará de mostrarse en el sitio.</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={deleting} onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                <Button type="button" variant="destructive" disabled={deleting} onClick={performDelete}>
                  {deleting ? 'Procesando...' : (canHardDelete(confirmDelete) ? 'Eliminar' : 'Desactivar')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCategory} onOpenChange={() => !updating && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la categoría</label>
                <Input 
                  placeholder="Nombre" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)}
                  disabled={updating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría padre (opcional)</label>
                <select 
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={editParent} 
                  onChange={e => setEditParent(e.target.value)}
                  disabled={updating}
                >
                  <option value="">(Raíz - Sin padre)</option>
                  {categories
                    .filter(c => !c.parent_id && c.id !== editingCategory.id)
                    .map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                  }
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={updating} onClick={() => setEditingCategory(null)}>
                  Cancelar
                </Button>
                <Button type="button" disabled={updating || !editName.trim()} onClick={updateCategory}>
                  {updating ? 'Actualizando...' : 'Actualizar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManager;
