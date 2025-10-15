// Auto-generated manually from schema (fallback since CLI types generation not available)
// Do NOT expose service role keys in client code. Regenerate when schema changes.

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          sort_order: number | null;
          is_active: boolean | null;
          created_at: string;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
            name: string;
          slug?: string;
          parent_id?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string | null;
          price: number;
          original_price: number | null;
          console: string;
          category_id: string;
          parent_category_id: string;
          features: string[] | null;
          image_urls: string[] | null;
          is_new: boolean | null;
          is_on_sale: boolean | null;
          rating: number | null;
          review_count: number | null;
          in_stock: boolean | null;
          stock_count: number | null;
          created_at: string;
          updated_at: string;
          likes_count: number; // added
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          description?: string | null;
          price: number;
          original_price?: number | null;
          console: string;
          category_id: string;
          parent_category_id?: string;
          features?: string[] | null;
          image_urls?: string[] | null;
          is_new?: boolean | null;
          is_on_sale?: boolean | null;
          rating?: number | null;
          review_count?: number | null;
          in_stock?: boolean | null;
          stock_count?: number | null;
          created_at?: string;
          updated_at?: string;
          likes_count?: number; // added
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          product_id: string;
          payment_method: string | null;
          payment_status: string | null;
          wompi_transaction_id: string | null;
          wompi_payment_link_id: string | null;
          wompi_reference: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          customer_address: string | null;
          total_amount: number;
          quantity: number;
          payment_reference: string | null;
          payment_transaction_id: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          payment_method?: string | null;
          payment_status?: string | null;
          wompi_transaction_id?: string | null;
          wompi_payment_link_id?: string | null;
          wompi_reference?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          customer_address?: string | null;
          total_amount: number;
          quantity?: number;
          payment_reference?: string | null;
          payment_transaction_id?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          payment_method: string;
          processor_transaction_id: string | null;
          processor_reference: string | null;
          processor_payment_link: string | null;
          processor_response: any | null;
          currency: string | null;
          processor: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          payment_method: string;
          processor_transaction_id?: string | null;
          processor_reference?: string | null;
          processor_payment_link?: string | null;
          processor_response?: any | null;
          currency?: string | null;
          processor?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export type PublicTables = Database['public']['Tables'];
export type Category = PublicTables['categories']['Row'];
export type Product = PublicTables['products']['Row'];
