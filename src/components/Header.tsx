import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Phone, MapPin, Menu, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  cartItemsCount?: number;
  onCartClick?: () => void;
}

const Header = ({ cartItemsCount = 0, onCartClick }: HeaderProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [categories, setCategories] = React.useState<{ name: string; subcategories: string[] }[]>([]);

  React.useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,slug,parent_id,sort_order,is_active')
        .eq('is_active', true);
      if (error || !data) return;
      // Build hierarchy
      const parents = data.filter(c => !c.parent_id).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
      const childrenGrouped: Record<string,string[]> = {};
      data.filter(c => c.parent_id).forEach(c => {
        const parent = data.find(p => p.id === c.parent_id);
        if (!parent) return;
        if (!childrenGrouped[parent.name]) childrenGrouped[parent.name] = [];
        childrenGrouped[parent.name].push(c.name);
      });
      Object.keys(childrenGrouped).forEach(k => {
        childrenGrouped[k].sort();
      });
      setCategories(parents.map(p => ({ name: p.name, subcategories: childrenGrouped[p.name] || [] })));
    };
    loadCategories();
  }, []);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    }
    navigate('/cart');
  };

  const handleCategoryClick = (category: string, isParent?: boolean) => {
    const params = new URLSearchParams();
    params.set(isParent ? 'parent' : 'category', category);
    navigate(`/products?${params.toString()}`);
  };

  const consoleCategoryNames = new Set(['Nintendo Switch', 'PlayStation', 'Xbox']);

  return (
    <header className="bg-[#091024] text-white shadow-lg">
      {/* Top bar with contact info - Hide text on mobile, show icons only */}
      <div className="bg-[#d93d34] py-1 sm:py-2 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center text-xs sm:text-sm">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
              <a 
                href="https://wa.me/50379866174" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#f3cb49] transition-colors hidden sm:inline"
              >
                WhatsApp Business
              </a>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Puntos de entrega en todo El Salvador</span>
            </div>
          </div>
          <div className="hidden sm:block text-sm font-medium">
            🚚 Envío gratis en puntos de entrega
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Categorías</SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-3">
                  {/* Search in drawer */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!query.trim()) return;
                      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
                    }}
                    role="search"
                    aria-label="Buscar productos"
                    className="w-full"
                  >
                    <div className="flex items-stretch gap-2 bg-white rounded-lg p-1 w-full">
                      <div className="flex items-center px-2 text-[#091024]/70">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar productos..."
                        className="flex-1 bg-transparent text-[#091024] placeholder-gray-500 focus:outline-none py-2 px-1 text-sm min-w-0"
                      />
                      <SheetClose asChild>
                        <button type="submit" className="bg-[#3bc8da] hover:bg-[#3fdb70] text-white font-bold px-3 rounded-md shrink-0">
                          Buscar
                        </button>
                      </SheetClose>
                    </div>
                  </form>
                  
                  <SheetClose asChild>
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
                      onClick={() => navigate('/')}
                    >
                      Inicio
                    </button>
                  </SheetClose>

                  {/* Console categories as dropdowns */}
                  <Accordion type="multiple" className="w-full">
                    {categories.map(cat => (
                      consoleCategoryNames.has(cat.name) && cat.subcategories.length > 0 ? (
                        <AccordionItem key={cat.name} value={cat.name} className="border-none">
                          <AccordionTrigger className="px-3 py-2 font-medium text-left" onClick={(e) => { e.preventDefault(); handleCategoryClick(cat.name, true); }}>
                            {cat.name}
                          </AccordionTrigger>
                          <AccordionContent className="pt-0">
                            <div className="pl-2">
                              {cat.subcategories.map(sub => (
                                <SheetClose asChild key={sub}>
                                  <button className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700" onClick={() => handleCategoryClick(sub, false)}>
                                    {sub}
                                  </button>
                                </SheetClose>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ) : null
                    ))}
                  </Accordion>

                  {/* Non-console categories keep previous behavior */}
                  {categories.map(cat => (
                    !consoleCategoryNames.has(cat.name) ? (
                      <div key={cat.name}>
                        <SheetClose asChild>
                          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 font-medium" onClick={() => handleCategoryClick(cat.name, true)}>
                            {cat.name}
                          </button>
                        </SheetClose>
                        {cat.subcategories.length > 0 && (
                          <div className="pl-4">
                            {cat.subcategories.map(sub => (
                              <SheetClose asChild key={sub}>
                                <button className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700" onClick={() => handleCategoryClick(sub)}>
                                  {sub}
                                </button>
                              </SheetClose>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo - Now clickable */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/lovable-uploads/6a8f9e46-cf47-49c9-b982-fc84228181bf.png" 
              alt="Cáceres Videogames Control" 
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
            <img 
              src="/lovable-uploads/738b26e7-e66e-49ac-9cde-fc416ecf361e.png" 
              alt="Cáceres Videogames" 
              className="h-6 sm:h-8"
            />
          </button>

          {/* Cart */}
          <button
            onClick={handleCartClick}
            className="relative bg-[#3fdb70] hover:bg-[#3fdb70]/90 text-[#091024] px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Carrito</span>
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#d93d34] text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-bold">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
