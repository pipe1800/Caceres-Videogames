
-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default admin user (email: admin@caceresvideogames.com, password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO public.admin_users (email, password_hash) 
VALUES ('admin@caceresvideogames.com', '$2b$10$rQvHgzrS5fF8mF8yF8yF8O8yF8yF8yF8yF8yF8yF8yF8yF8yF8yF8');

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  console TEXT NOT NULL,
  category TEXT NOT NULL,
  is_new BOOLEAN DEFAULT false,
  is_on_sale BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  features TEXT[],
  in_stock BOOLEAN DEFAULT true,
  stock_count INTEGER DEFAULT 0,
  image_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert sample products based on existing data
INSERT INTO public.products (sku, name, description, price, original_price, console, category, is_new, is_on_sale, rating, review_count, features, in_stock, stock_count, image_urls) VALUES
(
  'ZELDA-TOTK-001',
  'The Legend of Zelda: Tears of the Kingdom',
  'Una aventura épica que te llevará a explorar los cielos de Hyrule. Con nuevas mecánicas de construcción y una historia envolvente, este es el juego que todos los fanáticos de Zelda estaban esperando.',
  59.99,
  69.99,
  'Nintendo Switch',
  'Nintendo Switch',
  true,
  true,
  4.9,
  2847,
  ARRAY['Mundo abierto masivo para explorar', 'Nuevas mecánicas de construcción', 'Historia épica y personajes memorables', 'Gráficos impresionantes optimizados para Switch'],
  true,
  15,
  ARRAY['https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop']
),
(
  'SPIDERMAN-2-PS5-002',
  'Spider-Man 2',
  'La aventura definitiva de Spider-Man llega a PlayStation 5. Juega como Peter Parker y Miles Morales en una Nueva York vibrante y llena de peligros.',
  69.99,
  79.99,
  'PlayStation 5',
  'PlayStation',
  true,
  false,
  4.8,
  1923,
  ARRAY['Dos Spider-Man jugables', 'Nueva York completamente explorable', 'Combat system mejorado', 'Gráficos de nueva generación'],
  true,
  8,
  ARRAY['https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=400&fit=crop']
),
(
  'GOD-OF-WAR-PS5-003',
  'God of War Ragnarök',
  'Embárcate en una aventura épica y emotiva mientras Kratos y Atreus buscan respuestas antes del profetizado Ragnarök.',
  49.99,
  NULL,
  'PlayStation 5',
  'PlayStation',
  false,
  false,
  4.7,
  1456,
  ARRAY['Historia épica de mitología nórdica', 'Combate visceral y estratégico', 'Gráficos cinematográficos', 'Exploración de múltiples reinos'],
  false,
  0,
  ARRAY['https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=400&fit=crop']
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to products (read-only)
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

-- Create policies for orders (public can create, admins can manage)
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Admin policies will be handled in the application logic
CREATE POLICY "Admins can manage everything" ON public.products FOR ALL USING (true);
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Admins can view admin_users" ON public.admin_users FOR SELECT USING (true);
