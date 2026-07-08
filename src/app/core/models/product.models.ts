export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: Category;
  categoryId?: number;
  supplier?: Supplier;
  supplierId?: number;
  stock: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  reviews?: Review[];
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Address {
  id: number;
  userId: number;
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressRequest {
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface CartItem {
  id?: number;
  cartId: number;
  productId: number;
  product: Product;
  quantity: number;
  createdAt?: string;
}

export interface Cart {
  id: number;
  userId: number;
  cartItems: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCartItemRequest {
  cartId: number;
  productId: number;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: number;
  price?: number;
}

export interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
  addressId?: number;
  address?: Address;
  user?: { id: number; name: string; email: string };
  items?: OrderItem[];
  orderItems?: OrderItem[];
  payments?: Payment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  userId?: number;
  addressId?: number;
  paymentMethodId?: number;
  items: { productId: number; quantity: number }[];
  status?: string;
}

export interface Payment {
  id: number;
  orderId: number;
  userId: number;
  amount: number;
  status: string;
  methodId?: number;
  transactionId?: string;
  checkoutUrl?: string;
  createdAt?: string;
}

export interface CreatePaymentRequest {
  orderId: number;
  paymentMethodId: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

// LocalCartItem is only used before the user logs in (localStorage fallback)
export interface LocalCartItem {
  product: Product;
  quantity: number;
}
