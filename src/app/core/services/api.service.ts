import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  User,
} from '../models/auth.models';
import {
  Address,
  Cart,
  Category,
  CreateAddressRequest,
  CreateOrderRequest,
  CreatePaymentRequest,
  Order,
  PaginatedProducts,
  Payment,
  PaymentMethod,
  Product,
  ProductFilters,
} from '../models/product.models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // --- AUTH ---
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData);
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, request);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`);
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken });
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/change-password`, data);
  }

  // --- PRODUCTS ---
  getProducts(filters: ProductFilters): Observable<PaginatedProducts> {
    let params = new HttpParams();

    // Itera sobre as chaves da interface ProductFilters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    // Certifique-se de que a URL base termine em /products
    return this.http.get<PaginatedProducts>(`${this.apiUrl}/products`, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  // --- USER ---
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, data);
  }

  // --- ADDRESSES
  getMyAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/addresses`);
  }

  createAddress(data: CreateAddressRequest): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/addresses`, data);
  }

  updateAddress(id: number, data: CreateAddressRequest): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/addresses/${id}`, data);
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/addresses/${id}`);
  }

  // --- CART
  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/carts`);
  }

  addCartItem(data: { productId: number; quantity: number }): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/carts/items`, data);
  }

  updateCartItem(cartItemId: number, quantity: number): Observable<Cart> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.put<Cart>(`${this.apiUrl}/carts/items/${cartItemId}`, null, {
      params,
    });
  }

  deleteCartItem(cartItemId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/carts/items/${cartItemId}`);
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/carts`);
  }

  // --- ORDERS ---
  createOrder(data: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, data);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  getOrder(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`);
  }

  // --- PAYMENT METHODS ---
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/payment-methods`);
  }

  // --- PAYMENTS ---
  createPayment(data: CreatePaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments`, data);
  }

  getMyPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/me`);
  }

  // --- ADMIN: Payment Methods ---
  createPaymentMethod(data: { name: string; description?: string }): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.apiUrl}/payment-methods`, data);
  }

  updatePaymentMethod(
    id: number,
    data: { name?: string; description?: string; isActive?: boolean },
  ): Observable<PaymentMethod> {
    return this.http.put<PaymentMethod>(`${this.apiUrl}/payment-methods/${id}`, data);
  }

  deletePaymentMethod(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/payment-methods/${id}`);
  }

  // --- ADMIN: Products ---
  createProduct(data: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, data);
  }

  updateProduct(id: number, data: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  // --- ADMIN: Users ---
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  // --- ADMIN: Orders ---
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    const params = new HttpParams().set('status', status);
    return this.http.put<Order>(`${this.apiUrl}/orders/admin/${id}/status`, null, { params });
  }

  // --- CATEGORIES ---
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  createCategory(data: Category): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: number, data: Category): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }
}
