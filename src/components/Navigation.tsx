
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Gamepad2, Smartphone, Home } from 'lucide-react';

const categories = [
  {
    name: 'Nintendo Switch',
    icon: <Gamepad2 className="w-4 h-4" />,
    subcategories: [
      'Juegos de Nintendo Switch',
      'Controles de Nintendo Switch',
      'Memorias de Nintendo Switch',
      'Accesorios de Nintendo Switch',
      'Estuches de Nintendo Switch'
    ]
  },
  {
    name: 'PlayStation',
    icon: <Gamepad2 className="w-4 h-4" />,
    subcategories: [
      'Juegos de PlayStation 5',
      'Controles de PlayStation 5',
      'Juegos de PlayStation 4',
      'Controles de PlayStation 4'
    ]
  },
  {
    name: 'Xbox',
    icon: <Gamepad2 className="w-4 h-4" />,
    subcategories: [
      'Juegos de Xbox Series X|Xbox One',
      'Controles de Xbox Series X|Xbox One'
    ]
  },
  {
    name: 'Consolas',
    icon: <Gamepad2 className="w-4 h-4" />,
    subcategories: []
  },
  {
    name: 'Accesorios',
    icon: <Smartphone className="w-4 h-4" />,
    subcategories: [
      'Accesorios Varios',
      'Accesorios iPhone'
    ]
  }
];

interface NavigationProps {
  onCategorySelect?: (category: string) => void;
}

const Navigation = ({ onCategorySelect }: NavigationProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (categoryName: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpenDropdown(categoryName);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150); // 150ms delay before closing
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleHomeClick = () => {
    window.location.href = '/';
  };

  return (
    <nav className="bg-white border-b-2 border-[#3bc8da] shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-4">
          <ul className="flex flex-wrap gap-6">
            {/* Home Button */}
            <li>
              <button
                onClick={handleHomeClick}
                className="flex items-center gap-2 px-4 py-2 text-[#091024] hover:text-[#d93d34] font-medium transition-colors rounded-lg hover:bg-gray-50"
              >
                <Home className="w-4 h-4" />
                <span>Inicio</span>
              </button>
            </li>

            {categories.map((category) => (
              <li key={category.name} className="relative group">
                <button
                  className="flex items-center gap-2 px-4 py-2 text-[#091024] hover:text-[#d93d34] font-medium transition-colors rounded-lg hover:bg-gray-50"
                  onMouseEnter={() => handleMouseEnter(category.name)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => onCategorySelect?.(category.name)}
                >
                  {category.icon}
                  <span>{category.name}</span>
                  {category.subcategories.length > 0 && (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Dropdown */}
                {category.subcategories.length > 0 && openDropdown === category.name && (
                  <div 
                    className="absolute top-full left-0 mt-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-64"
                    onMouseEnter={() => handleMouseEnter(category.name)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {category.subcategories.map((subcategory) => (
                      <button
                        key={subcategory}
                        className="block w-full text-left px-4 py-3 text-[#091024] hover:bg-[#3bc8da]/10 hover:text-[#d93d34] transition-colors first:rounded-t-lg last:rounded-b-lg"
                        onClick={() => {
                          onCategorySelect?.(subcategory);
                          setOpenDropdown(null);
                        }}
                      >
                        {subcategory}
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
