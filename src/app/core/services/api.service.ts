import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "../models/auth.models";
import { PaginatedProducts, Product, ProductFilters } from '../models/product.models';

@Injectable({
  providedIn: 'root'
})

export class ApiService {

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData);
  }

  register(registerData: RegisterRequest): Observable<AuthResponse>{
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`);
  }

  getProducts(filters?: ProductFilters): Observable<PaginatedProducts> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Product[]>(`${this.apiUrl}/product`, { params }).pipe(
      map(products => {
        // Transformar array de produtos em formato paginado
        const page = filters?.page || 1;
        const limit = filters?.limit || 12;
        const total = products.length;
        const totalPages = Math.ceil(total / limit);

        return {
          data: products,
          total,
          page,
          limit,
          totalPages
        };
      })
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/product/${id}`);
  }

}