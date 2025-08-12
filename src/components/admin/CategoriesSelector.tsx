import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';

interface CategoriesSelectorProps {
  label?: string;
  selected: string[]; // category names
  onChange: (categories: string[]) => void;
}

type CategoryRow = {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
};

const CategoriesSelector: React.FC<CategoriesSelectorProps> = ({ label = 'Categorías', selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('id,name,slug,parent_id').order('name');
    if (!error) setAllCategories(data || []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleCategory = (name: string) => {
    if (selected.includes(name)) onChange(selected.filter((c) => c !== name));
    else onChange([...selected, name]);
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    setAdding(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { error } = await supabase.from('categories').insert({ name, slug });
      if (error) throw error;
      setNewCategory('');
      await fetchCategories();
      if (!selected.includes(name)) onChange([...selected, name]);
    } catch (e) {
      console.error('Error adding category', e);
    } finally {
      setAdding(false);
    }
  };

  const roots = useMemo(() => allCategories.filter((c) => !c.parent_id), [allCategories]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, CategoryRow[]>();
    for (const c of allCategories) {
      if (c.parent_id) {
        const arr = map.get(c.parent_id) || [];
        arr.push(c);
        map.set(c.parent_id, arr);
      }
    }
    return map;
  }, [allCategories]);

  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const nq = normalize(query.trim());

  const hasHierarchy = useMemo(() => childrenByParent.size > 0, [childrenByParent]);

  // Compute filtered lists ourselves (disable cmdk filtering)
  const filtered = useMemo(() => {
    if (!nq) {
      return {
        roots: roots,
        childrenByParent,
        flat: allCategories,
      };
    }
    const match = (parent: string | undefined, name: string) => {
      const base = normalize(name);
      const parentBase = parent ? normalize(parent) : '';
      return base.includes(nq) || parentBase.includes(nq) || `${parentBase} ${base}`.includes(nq);
    };

    const fr = roots.filter((r) => match(undefined, r.name));
    const fChildren = new Map<string, CategoryRow[]>();
    for (const r of roots) {
      const kids = childrenByParent.get(r.id) || [];
      const matchedKids = kids.filter((k) => match(r.name, k.name));
      if (matchedKids.length > 0) fChildren.set(r.id, matchedKids);
    }
    const fFlat = allCategories.filter((c) => match(undefined, c.name));
    return { roots: fr, childrenByParent: fChildren, flat: fFlat };
  }, [nq, roots, childrenByParent, allCategories]);

  const nothingFound = useMemo(() => {
    if (!nq) return false;
    if (hasHierarchy) {
      const anyRoot = filtered.roots.length > 0;
      let anyChild = false;
      for (const arr of filtered.childrenByParent.values()) {
        if (arr.length > 0) { anyChild = true; break; }
      }
      return !anyRoot && !anyChild;
    }
    return filtered.flat.length === 0;
  }, [filtered, hasHierarchy, nq]);

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium text-gray-700">{label}</div>}
      <Popover modal={false} open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(''); }}>
        <PopoverTrigger asChild>
          <Button variant="outline" type="button" className="w-full justify-between">
            <span>
              {selected.length > 0 ? `${selected.length} seleccionadas` : 'Seleccionar categorías'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="p-0 w-96 z-[1000] pointer-events-auto"
        >
          <div
            className="max-h-[320px] overflow-y-auto overscroll-contain touch-pan-y"
            onWheelCapture={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b sticky top-0 z-10 bg-popover">
              <div className="flex gap-2">
                <Input
                  placeholder="Nueva categoría"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Button type="button" onClick={addCategory} disabled={adding || !newCategory.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Command shouldFilter={false} className="overflow-visible">
              <CommandInput placeholder="Buscar categorías..." value={query} onValueChange={setQuery} />
              <CommandList>
                {nothingFound ? (
                  <div className="py-6 text-center text-sm">No hay resultados</div>
                ) : hasHierarchy ? (
                  filtered.roots.map((root) => {
                    const rootChecked = selected.includes(root.name);
                    const kids = filtered.childrenByParent.get(root.id) || [];
                    const showRootItem = !nq || normalize(root.name).includes(nq);
                    return (
                      <CommandGroup key={root.id} heading={root.name}>
                        {showRootItem && (
                          <CommandItem
                            value={root.name}
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleCategory(root.name); }}
                            className="flex items-center gap-2"
                          >
                            <Checkbox checked={rootChecked} className="pointer-events-none" aria-hidden />
                            <span className="flex-1">{root.name}</span>
                          </CommandItem>
                        )}
                        {kids.map((child) => {
                          const name = child.name;
                          const checked = selected.includes(name);
                          return (
                            <CommandItem
                              key={child.id}
                              value={`${root.name} ${name}`}
                              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleCategory(name); }}
                              className="flex items-center gap-2 pl-6"
                            >
                              <Checkbox checked={checked} className="pointer-events-none" aria-hidden />
                              <span className="flex-1">{name}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    );
                  })
                ) : (
                  <CommandGroup heading="Categorías">
                    {filtered.flat.map((cat) => {
                      const name = cat.name;
                      const checked = selected.includes(name);
                      return (
                        <CommandItem
                          key={cat.id}
                          value={name}
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleCategory(name); }}
                          className="flex items-center gap-2"
                        >
                          <Checkbox checked={checked} className="pointer-events-none" aria-hidden />
                          <span className="flex-1">{name}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((name) => (
            <Badge key={name} variant="secondary" className="flex items-center gap-1">
              {name}
              <button type="button" onClick={() => toggleCategory(name)} aria-label={`Quitar ${name}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesSelector;
