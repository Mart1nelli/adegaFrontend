import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

// Variáveis de controle globais do interceptor
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(
  null,
);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);
  const token = localStorage.getItem('access_token');

  // 1. A VACINA DO BACKEND: Proteção contra envio de 'null' ou 'undefined'
  const isValidToken = token && token !== 'null' && token !== 'undefined' && token.trim() !== '';

  // Clona a requisição injetando o token limpo, se ele existir
  let authReq = req;
  if (isValidToken) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ignora erro 401 nas rotas de autenticação (evita loop infinito de login)
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return handle401Error(authReq, next, authService);
      }
      if (error.status === 403) {
        notificationService.showError('Você não tem permissão para realizar esta ação.', 'Acesso Negado');
        router.navigate(['/']);
      }
      return throwError(() => error);
    }),
  );
};

// --- Funções Auxiliares ---

// Função limpa para injetar o cabeçalho
const addTokenHeader = (request: HttpRequest<unknown>, token: string) => {
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
};

// Lógica principal de renovação de token e fila de espera
const handle401Error = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
) => {
  if (!isRefreshing) {
    // 2. O LÍDER: A primeira requisição que falhou entra aqui e tranca a porta
    isRefreshing = true;
    refreshTokenSubject.next(null); // Reseta a fila

    return authService.refreshToken().pipe(
      switchMap((tokens: { accessToken: string }) => {
        isRefreshing = false; // Destranca a porta

        // Emite o novo token para quem estava na fila esperando
        refreshTokenSubject.next(tokens.accessToken);

        // Tenta novamente a requisição original que falhou primeiro
        return next(addTokenHeader(request, tokens.accessToken));
      }),
      catchError((err: unknown) => {
        isRefreshing = false;
        authService.logout(); // Se o refresh falhar, o usuário cai e precisa logar de novo
        return throwError(() => err);
      }),
    );
  } else {
    // 3. A FILA DE ESPERA: A 2ª, 3ª, etc requisições simultâneas caem aqui
    return refreshTokenSubject.pipe(
      // Fica "congelado" aqui até que o subject não seja mais null (ou seja, quando o token novo chegar)
      filter((token: string | null) => token !== null),
      take(1), // Pega apenas a primeira emissão de token novo e "se desinscreve"
      switchMap((token: string | null) => {
        // Tenta novamente a requisição usando o token fresquinho
        return next(addTokenHeader(request, token!));
      }),
    );
  }
};
