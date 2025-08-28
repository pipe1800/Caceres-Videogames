import React, { useEffect, useState, useCallback } from 'react';
import { ChevronDown, Home, Gamepad2, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';

// Simple category shape
interface CategoryRow {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
  sort_order: number | null;
}

interface TreeNode extends CategoryRow { children: TreeNode[] }

interface NavigationProps { onCategorySelect?: (slug: string) => void }

const Navigation: React.FC<NavigationProps> = ({ onCategorySelect }) => {
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChildrenId, setLoadingChildrenId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Build a tree (only two levels needed per current schema usage)
  const buildTree = (rows: CategoryRow[]): TreeNode[] => {
    const byId: Record<string, TreeNode> = {};
    rows.forEach(r => { byId[r.id] = { ...r, children: [] }; });
    const roots: TreeNode[] = [];
    rows.forEach(r => {
      if (r.parent_id && byId[r.parent_id]) {
        byId[r.parent_id].children.push(byId[r.id]);
      } else if (!r.parent_id) {
        roots.push(byId[r.id]);
      }
    });
    const sorter = (a: TreeNode, b: TreeNode) => ( (a.sort_order ?? 0) - (b.sort_order ?? 0) ) || a.name.localeCompare(b.name);
    roots.sort(sorter);
    roots.forEach(root => root.children.sort(sorter));
    return roots;
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,slug,parent_id,sort_order,is_active')
        .eq('is_active', true);
      if (error) throw error;
      const safeRows: CategoryRow[] = (data || []).map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug ?? r.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
        parent_id: r.parent_id,
        sort_order: r.sort_order
      }));
      setRoots(buildTree(safeRows));
    } catch (e) {
      console.error('[Navigation] load failed', e);
      setRoots([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Optional on-demand refresh for children (kept if future deeper nesting)
  const ensureChildren = async (node: TreeNode) => {
    if (node.children.length > 0) return; // already have
    setLoadingChildrenId(node.id);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,slug,parent_id,sort_order,is_active')
        .eq('is_active', true)
        .eq('parent_id', node.id);
      if (error) throw error;
      if (data && data.length > 0) {
        setRoots(prev => prev.map(r => r.id === node.id ? { ...r, children: data.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug ?? c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
          parent_id: c.parent_id,
            sort_order: c.sort_order,
            children: []
        })) } : r));
      }
    } catch (e) {
      console.error('[Navigation] ensureChildren error', e);
    } finally { setLoadingChildrenId(null); }
  };

  const handleRootToggle = async (root: TreeNode) => {
    const next = openId === root.id ? null : root.id;
    setOpenId(next);
    if (next) await ensureChildren(root);
  };

  const goHome = () => { navigate('/'); };

  const goCategory = (slug: string | null) => {
    if (!slug) return;
    const params = new URLSearchParams(location.search);
    params.set('category', slug);
    params.delete('productId');
    navigate({ pathname: '/products', search: `?${params.toString()}` });
    onCategorySelect?.(slug);
    setOpenId(null);
  };

  const iconFor = (name: string) => name.toLowerCase().includes('iphone') ? <Smartphone className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />;

  return (
    <nav id="main-nav" className="bg-white border-b-2 border-[#3bc8da] shadow-sm hidden md:block relative z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center py-3">
          <ul className="flex gap-4 flex-wrap justify-center">
            <li>
              <button onClick={goHome} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#091024] hover:text-[#d93d34] hover:bg-gray-50 font-medium">
                <Home className="w-4 h-4" />
                <span>Inicio</span>
              </button>
            </li>
            {loading && (
              <li className="flex items-center gap-2 text-sm text-gray-500">Cargando categorías...</li>
            )}
            {!loading && roots.map(root => (
              <li key={root.id} className="relative">
                <button
                  onClick={() => handleRootToggle(root)}
                  aria-haspopup="true"
                  aria-expanded={openId === root.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#091024] hover:text-[#d93d34] hover:bg-gray-50 font-medium"
                >
                  {iconFor(root.name)}
                  <span>{root.name}</span>
                  {root.children.length > 0 && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${openId === root.id ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {openId === root.id && (
                  <div className="absolute left-0 top-full mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50">
                    <button
                      className="w-full text-left px-4 py-2 text-[#091024] font-semibold hover:bg-[#3bc8da]/10 hover:text-[#d93d34] rounded-md"
                      onClick={() => goCategory(root.slug)}
                    >
                      Ver todo
                    </button>
                    {loadingChildrenId === root.id && (
                      <div className="px-4 py-2 text-sm text-gray-500">Cargando...</div>
                    )}
                    {root.children.length === 0 && loadingChildrenId !== root.id && (
                      <div className="px-4 py-2 text-sm text-gray-500">Sin subcategorías</div>
                    )}
                    {root.children.length > 0 && root.children.map(child => (
                      <button
                        key={child.id}
                        className="w-full text-left px-4 py-2 text-[#091024] hover:bg-[#3bc8da]/10 hover:text-[#d93d34] rounded-md"
                        onClick={() => goCategory(child.slug)}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
