import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePaymentRequest, PaymentResponse } from '../models/payment.models';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Cria uma intenção de pagamento no backend e gera a URL de checkout do Mercado Pago
   */
  createPayment(data: CreatePaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.apiUrl, data);
  }

  /**
   * Busca um pagamento pelo ID
   */
  getPaymentById(id: number | string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Busca o histórico de pagamentos de um pedido específico
   */
  getPaymentsByOrderId(orderId: number | string): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/order/${orderId}`);
  }

  /**
   * Lista todos os pagamentos do usuário logado
   */
  getMyPayments(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/my-payments`);
  }

  /**
   * Força a sincronização imediata do status de um pagamento com o Mercado Pago
   */
  syncPaymentStatus(id: number | string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/${id}/sync`, {});
  }
}
