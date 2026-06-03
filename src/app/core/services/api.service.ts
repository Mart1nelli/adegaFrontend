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
  CartItem,
  Category,
  CreateAddressRequest,
  CreateOrderRequest,
  Order,
  PaginatedProducts,
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
  getMyAddresses(userId: number): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/addresses/user/${userId}`);
  }

  createAddress(userId: number, data: CreateAddressRequest): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/addresses/user/${userId}`, data);
  }

  updateAddress(id: number, data: CreateAddressRequest): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/addresses/${id}`, data);
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/addresses/${id}`);
  }

  // --- CART
  getCart(userId: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/carts/user/${userId}`);
  }

  addCartItem(userId: number, data: { productId: number; quantity: number }): Observable<CartItem> {
    return this.http.post<CartItem>(`${this.apiUrl}/cart/${userId}/items`, data);
  }

  updateCartItem(userId: number, cartItemId: number, quantity: number): Observable<Cart> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.put<Cart>(`${this.apiUrl}/carts/user/${userId}/items/${cartItemId}`, null, {
      params,
    });
  }

  deleteCartItem(userId: number, cartItemId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/carts/user/${userId}/items/${cartItemId}`);
  }

  clearCart(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/carts/user/${userId}`);
  }

  // --- ORDERS ---
  createOrder(userId: number, data: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/user/${userId}`, data);
  }

  getMyOrders(userId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/user/${userId}`);
  }

  getOrder(userId: number, orderId: number): Observable<Order> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`, { params });
  }

  // --- PAYMENT METHODS ---
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/payment-methods`);
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
    return this.http.put<Order>(`${this.apiUrl}/orders/${id}/status`, null, { params });
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
