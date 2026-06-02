import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  User,
} from '../models/auth.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);

  private _currentUser = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.apiService.login(loginData).pipe(
      tap((response) => {
        this.setAuthData(response);
        this.router.navigate(['/']);
      }),
    );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.register(registerData).pipe(
      tap((response) => {
        this.setAuthData(response);
        this.router.navigate(['/']);
      }),
    );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  loadUserProfile(): Observable<User> {
    return this.apiService.getProfile().pipe(
      tap((user) => {
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
      }),
    );
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refresh_token = localStorage.getItem('refresh_token');
    return this.apiService.refreshToken(refresh_token ?? '').pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.accessToken);
      }),
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.apiService.changePassword(data);
  }

  private setAuthData(response: AuthResponse): void {
    localStorage.setItem('access_token', response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }
    this._currentUser.set(response.user);
    this._isAuthenticated.set(true);
  }

  private clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }

  /** Call on app startup to restore auth state from localStorage. */
  initAuth(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.loadUserProfile().subscribe({
        error: () => this.clearAuthData(),
      });
    }
  }

  /** @deprecated use initAuth() instead */
  checkAuthStatus(): boolean {
    return !!localStorage.getItem('access_token');
  }
}
