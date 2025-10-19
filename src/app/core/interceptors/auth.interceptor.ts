import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Pegar o token do localStorage
  const token = localStorage.getItem('access_token');

  // Se tem token, adicionar no header Authorization
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  // Se não tem token, continuar normalmente
  return next(req);
};