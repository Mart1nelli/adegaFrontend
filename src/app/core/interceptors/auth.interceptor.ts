import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  filter,
  finalize,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { TelemetryService } from '../services/telemetry.service';

// Variáveis de controle globais do interceptor
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(
  null,
);

const extractErrorMessage = (error: HttpErrorResponse, defaultMessage: string): string => {
  if (!error.error) return defaultMessage;
  if (typeof error.error === 'string') return error.error;
  if (error.error.message && typeof error.error.message === 'string') return error.error.message;
  if (error.error.error && typeof error.error.error === 'string') return error.error.error;
  if (Array.isArray(error.error.errors) && error.error.errors.length > 0) {
    return error.error.errors
      .map((e: { message?: string } | string) =>
        typeof e === 'object' && e?.message ? e.message : String(e),
      )
      .join(', ');
  }
  return defaultMessage;
};

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);
  const telemetryService = inject(TelemetryService);
  const token = localStorage.getItem('access_token');
  const startedAt = performance.now();
  let responseStatus = 0;
  let requestSucceeded = false;

  // 1. A VACINA DO BACKEND: Proteção contra envio de 'null' ou 'undefined'
  const isValidToken = token && token !== 'null' && token !== 'undefined' && token.trim() !== '';

  // Clona a requisição injetando o token limpo, se ele existir
  let authReq = req;
  if (isValidToken) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    tap((response) => {
      if (response instanceof HttpResponse) {
        responseStatus = response.status;
        requestSucceeded = true;
      }
    }),
    catchError((error: HttpErrorResponse) => {
      responseStatus = error.status;
      // Ignora erro 401 nas rotas de autenticação (evita loop infinito de login)
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return handle401Error(authReq, next, authService);
      }
      if (error.status === 403) {
        notificationService.showError(
          'Você não tem permissão para realizar esta ação.',
          'Acesso Negado',
        );
        router.navigate(['/']);
      } else if (error.status === 429) {
        notificationService.showWarning(
          'Muitas requisições. Aguarde alguns segundos.',
          'Limite Excedido',
        );
      } else if (error.status === 400) {
        const msg = extractErrorMessage(error, 'Requisição inválida. Verifique os dados enviados.');
        notificationService.showError(msg, 'Erro na Requisição (400)');
      } else if (error.status === 404) {
        const msg = extractErrorMessage(error, 'Recurso não encontrado.');
        notificationService.showError(msg, 'Não Encontrado (404)');
      } else if (error.status === 502) {
        notificationService.showError(
          'Serviço temporariamente indisponível. Tente novamente mais tarde.',
          'Erro de Servidor (502)',
        );
      }

      return throwError(() => error);
    }),
    finalize(() => {
      telemetryService.recordHttp({
        method: req.method,
        status: responseStatus,
        durationMs: Math.round(performance.now() - startedAt),
        success: requestSucceeded,
      });
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
