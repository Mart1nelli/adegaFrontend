import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showError',
      'showWarning',
      'showSuccess',
      'showInfo',
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['refreshToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should add Authorization header when token is present', () => {
    localStorage.setItem('access_token', 'valid-jwt-token');

    http.get('/api/v1/test').subscribe();

    const req = httpTesting.expectOne('/api/v1/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-jwt-token');
    req.flush({});
  });

  it('should NOT add Authorization header when token is absent or invalid', () => {
    localStorage.removeItem('access_token');

    http.get('/api/v1/test').subscribe();

    const req = httpTesting.expectOne('/api/v1/test');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should display warning notification on 429 Too Many Requests', () => {
    http.get('/api/v1/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(429);
      },
    });

    const req = httpTesting.expectOne('/api/v1/test');
    req.flush('Too many requests', { status: 429, statusText: 'Too Many Requests' });

    expect(notificationServiceSpy.showWarning).toHaveBeenCalledWith(
      'Muitas requisições. Aguarde alguns segundos.',
      'Limite Excedido',
    );
  });

  it('should display error notification on 400 Bad Request', () => {
    http.get('/api/v1/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(400);
      },
    });

    const req = httpTesting.expectOne('/api/v1/test');
    req.flush({ message: 'Valor do pedido inválido.' }, { status: 400, statusText: 'Bad Request' });

    expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
      'Valor do pedido inválido.',
      'Erro na Requisição (400)',
    );
  });

  it('should display error notification on 404 Not Found', () => {
    http.get('/api/v1/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(404);
      },
    });

    const req = httpTesting.expectOne('/api/v1/test');
    req.flush({ message: 'Pagamento não encontrado.' }, { status: 404, statusText: 'Not Found' });

    expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
      'Pagamento não encontrado.',
      'Não Encontrado (404)',
    );
  });

  it('should display error notification on 502 Bad Gateway', () => {
    http.get('/api/v1/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(502);
      },
    });

    const req = httpTesting.expectOne('/api/v1/test');
    req.flush(null, { status: 502, statusText: 'Bad Gateway' });

    expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
      'Serviço temporariamente indisponível. Tente novamente mais tarde.',
      'Erro de Servidor (502)',
    );
  });
});
