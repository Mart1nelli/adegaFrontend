import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PaymentService } from './payment.service';
import { environment } from '../../../environments/environment';
import { CreatePaymentRequest, PaymentResponse } from '../models/payment.models';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/payments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaymentService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PaymentService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createPayment should POST /api/v1/payments and return PaymentResponse', () => {
    const mockRequest: CreatePaymentRequest = { orderId: 16, paymentMethodId: 1 };
    const mockResponse: PaymentResponse = {
      id: 1,
      amount: 150.0,
      status: 'PENDING',
      transactionId: '123456789-abc',
      orderId: 16,
      userId: 5,
      paymentMethodId: 1,
      checkoutUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
      createdAt: '2026-08-15T15:02:49',
    };

    service.createPayment(mockRequest).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(res.checkoutUrl).toBe(mockResponse.checkoutUrl);
      expect(res.status).toBe('PENDING');
    });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('getPaymentById should GET /api/v1/payments/:id', () => {
    const mockResponse: PaymentResponse = {
      id: 1,
      amount: 150.0,
      status: 'COMPLETED',
      orderId: 16,
      userId: 5,
      paymentMethodId: 1,
    };

    service.getPaymentById(1).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('getPaymentsByOrderId should GET /api/v1/payments/order/:orderId', () => {
    const mockList: PaymentResponse[] = [
      {
        id: 1,
        amount: 150.0,
        status: 'PENDING',
        orderId: 16,
        userId: 5,
        paymentMethodId: 1,
      },
    ];

    service.getPaymentsByOrderId(16).subscribe((res) => {
      expect(res).toEqual(mockList);
      expect(res.length).toBe(1);
    });

    const req = httpTesting.expectOne(`${baseUrl}/order/16`);
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });

  it('getMyPayments should GET /api/v1/payments/my-payments', () => {
    const mockList: PaymentResponse[] = [
      {
        id: 1,
        amount: 150.0,
        status: 'COMPLETED',
        orderId: 16,
        userId: 5,
        paymentMethodId: 1,
      },
    ];

    service.getMyPayments().subscribe((res) => {
      expect(res).toEqual(mockList);
      expect(res.length).toBe(1);
    });

    const req = httpTesting.expectOne(`${baseUrl}/my-payments`);
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });

  it('syncPaymentStatus should POST /api/v1/payments/:id/sync and return updated PaymentResponse', () => {
    const mockResponse: PaymentResponse = {
      id: 1,
      amount: 150.0,
      status: 'COMPLETED',
      orderId: 16,
      userId: 5,
      paymentMethodId: 1,
    };

    service.syncPaymentStatus(1).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(res.status).toBe('COMPLETED');
    });

    const req = httpTesting.expectOne(`${baseUrl}/1/sync`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });
});
