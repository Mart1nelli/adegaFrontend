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
  CreateAddressRequest,
  CreateOrderRequest,
  Order,
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
    // Nota: Como o AuthController do Spring não tem a rota de perfil descrita ainda,
    // o padrão é buscar pelo id do usuário logado na rota de users. Ajuste se necessário.
    return this.http.get<User>(`${this.apiUrl}/users/me`);
  }

  // O Spring espera uma String crua/Body Text para o refreshToken
  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, refreshToken, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/change-password`, data);
  }

  // --- PRODUCTS ---

  // Nota: Ajuste a tipagem de retorno de PaginatedProducts para Product[] se o seu frontend
  // não for usar paginação via banco, já que o Spring está retornando List<ProductResponse> simples.
  getProducts(filters?: ProductFilters): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/products`, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  // --- USER ---

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    // Trocado de PATCH para PUT conforme definido no seu UserController
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, data);
  }

  // --- ADDRESSES (Mapeado com foco no userId conforme AddressController) ---

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

  // --- CART (Refatorado completamente para bater nas rotas /user/{userId} do Spring) ---

  getCart(userId: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/carts/user/${userId}`);
  }

  addCartItem(userId: number, data: any): Observable<Cart> {
    // No seu CartController, addItem espera o AddToCartRequest e retorna a CartResponse atualizada
    return this.http.post<Cart>(`${this.apiUrl}/carts/user/${userId}/items`, data);
  }

  updateCartItem(userId: number, cartItemId: number, quantity: number): Observable<Cart> {
    // Usa @RequestParam para quantidade: /user/{userId}/items/{cartItemId}?quantity=X
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
    // O seu Spring exige @RequestParam Long userId na busca por ID
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`, { params });
  }

  // --- PAYMENT METHODS ---

  getPaymentMethods(): Observable<PaymentMethod[]> {
    // Caso ainda não tenha um controller dedicado, mantemos mapeado para a futura implementação
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/payment-methods`);
  }

  // --- ADMIN: Products ---

  createProduct(data: any): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, data);
  }

  updateProduct(id: number, data: any): Observable<Product> {
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
    // Atualizado para usar @RequestParam conforme o método updateStatus do OrderController
    const params = new HttpParams().set('status', status);
    return this.http.put<Order>(`${this.apiUrl}/orders/${id}/status`, null, { params });
  }

  // --- CATEGORIES ---

  getCategories(): Observable<any[]> {
    // Corrigido de /category para /categories de acordo com o CategoryController
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }
}
