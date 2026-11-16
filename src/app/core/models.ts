export interface Role {
  id: number;
  name: 'SuperAdmin' | 'Administrator' | 'OperationalUser';
}

export interface UserType {
  id: number;
  name: 'customer' | 'seller';
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  user_type_id: number | null;
  status: boolean;
  is_owner: boolean;
  role: Role;
  user_type: UserType | null;
}

export interface Permissions {
  create_orders: boolean;
  view_own_orders: boolean;
  view_all_orders: boolean;
  verify_payments: boolean;
  update_item_status: boolean;
  edit_ship_date: boolean;
  register_balance_payment: boolean;
}

export interface CustomerProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone_1: string;
  phone_2: string;
  locality_id: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  user_role: UserRole;
  user_permission?: Permissions | null;
  customer_profile?: CustomerProfile | null;
}

export interface Province {
  id: number;
  name: string;
}

export interface Locality {
  id: number;
  province_id: number;
  name: string;
  province?: Province;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  category_id: number;
  material_id: number;
  name: string;
  description: string | null;
  width_cm: number;
  height_cm: number;
  color: string;
  price: string;
  stock: number;
  image: string | null;
  status: boolean;
  availability: string;
  category?: Category;
  material?: { id: number; name: string };
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
  from_stock: boolean;
  product?: { id: number; name: string };
  status?: { id: number; name: string };
}

export interface Order {
  id: number;
  user_id: number;
  total: string;
  deposit_percentage: number;
  deposit_amount: string;
  balance_amount: string;
  requires_manufacturing: boolean;
  street: string;
  street_number: string;
  address_notes: string | null;
  estimated_ship_date?: string | null;
  created_at: string;
  status?: { id: number; name: string };
  locality?: { id: number; name: string };
  items?: OrderItem[];
  items_count?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    customer_profile?: { first_name: string; last_name: string; phone_1: string; phone_2: string } | null;
  };
}

export interface Payment {
  id: number;
  order_id: number;
  amount: string;
  rejection_reason: string | null;
  created_at: string;
  type?: { id: number; name: string };
  status?: { id: number; name: string };
  uploader?: { id: number; name: string } | null;
  verifier?: { id: number; name: string } | null;
}

export interface TrackingEntry {
  status: string;
  changed_by: string | null;
  note: string | null;
  date: string;
}

export interface Tracking {
  order_id: number;
  status: string;
  requires_manufacturing: boolean;
  estimated_ship_date: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  history: TrackingEntry[];
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}
