import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthResponse, ChangePasswordRequest, LoginRequest, RegisterRequest, User } from "../models/auth.models";
import { Address, Cart, CreateAddressRequest, CreateCartItemRequest, CreateOrderRequest, Order, PaginatedProducts, PaymentMethod, Product, ProductFilters, UpdateCartItemRequest } from '../models/product.models';

@Injectable({
  providedIn: 'root'
})

export class ApiService {

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // --- AUTH ---

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData);
  }

  register(registerData: RegisterRequest): Observable<AuthResponse>{
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`);
  }

  refreshToken(refreshToken: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/refresh`, { refreshToken });
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/auth/change-password`, data);
  }

  // --- PRODUCTS ---

  getProducts(filters?: ProductFilters): Observable<PaginatedProducts> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<PaginatedProducts>(`${this.apiUrl}/product`, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/product/${id}`);
  }

  // --- USER ---

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user/${id}`);
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/user/${id}`, data);
  }

  // --- ADDRESSES ---

  getMyAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/address/mine`);
  }

  createAddress(data: CreateAddressRequest): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/address`, data);
  }

  updateAddress(id: number, data: Partial<CreateAddressRequest>): Observable<Address> {
    return this.http.patch<Address>(`${this.apiUrl}/address/${id}`, data);
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/address/${id}`);
  }

  // --- CART ---

  createCart(): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/cart`, {});
  }

  getMyCart(): Observable<Cart[]> {
    return this.http.get<Cart[]>(`${this.apiUrl}/cart/mine`);
  }

  getCart(id: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/cart/${id}`);
  }

  addCartItem(data: CreateCartItemRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cartitem`, data);
  }

  updateCartItem(id: number, data: UpdateCartItemRequest): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/cartitem/${id}`, data);
  }

  deleteCartItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cartitem/${id}`);
  }

  // --- ORDERS ---

  createOrder(data: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/order`, data);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/order/my`);
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/order/${id}`);
  }

  // --- PAYMENT METHODS ---

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/paymentmethod`);
  }

  // --- ADMIN: Products ---

  createProduct(data: any): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/product`, data);
  }

  updateProduct(id: number, data: any): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/product/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/product/${id}`);
  }

  // --- ADMIN: Users ---

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/user`);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/${id}`);
  }

  // --- ADMIN: Orders ---

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/order`);
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/order/${id}`, { status });
  }

  // --- CATEGORIES ---

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/category`);
  }
}
