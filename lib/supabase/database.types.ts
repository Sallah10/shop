export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  stock: number;
  created_at: string;
};

export type ProductInsert = {
  id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string | null;
  stock?: number;
  created_at?: string;
};

export type Admin = {
  user_id: string;
  created_at: string;
};

export type AdminInsert = {
  user_id: string;
  created_at?: string;
};

export type Order = {
  id: string;
  user_id: string;
  total: number;
  status: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  created_at: string;
};

export type OrderInsert = {
  id?: string;
  user_id: string;
  total: number;
  status?: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  created_at?: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type OrderItemInsert = {
  id?: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Pick<Product, "id" | "name" | "image_url"> | null;
  })[];
};

export type Database = {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: Partial<ProductInsert>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: Partial<OrderInsert>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: Partial<OrderItemInsert>;
        Relationships: [];
      };
      admins: {
        Row: Admin;
        Insert: AdminInsert;
        Update: Partial<AdminInsert>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      apply_stock_purchase: {
        Args: { p_order_id: string; p_items: Json };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
