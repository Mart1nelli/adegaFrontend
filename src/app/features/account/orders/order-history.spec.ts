import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrderHistory } from './order-history';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Order } from '../../../core/models/product.models';
import { PaymentResponse } from '../../../core/models/payment.models';

describe('OrderHistory', () => {
  let component: OrderHistory;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let paymentServiceSpy: jasmine.SpyObj<PaymentService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockOrders: Order[] = [
    {
      id: 1,
      userId: 5,
      totalAmount: 120.0,
      status: 'PENDING',
      payments: [
        {
          id: 10,
          orderId: 1,
          userId: 5,
          amount: 120.0,
          status: 'PENDING',
          paymentMethodId: 1,
          checkoutUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1',
        },
      ],
    },
    {
      id: 2,
      userId: 5,
      totalAmount: 300.0,
      status: 'PAID',
      payments: [
        {
          id: 11,
          orderId: 2,
          userId: 5,
          amount: 300.0,
          status: 'COMPLETED',
          paymentMethodId: 1,
        },
      ],
    },
  ];

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getMyOrders']);
    paymentServiceSpy = jasmine.createSpyObj('PaymentService', [
      'syncPaymentStatus',
      'createPayment',
      'getPaymentsByOrderId',
    ]);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);

    apiServiceSpy.getMyOrders.and.returnValue(of(mockOrders));

    await TestBed.configureTestingModule({
      imports: [OrderHistory],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: PaymentService, useValue: paymentServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OrderHistory);
    component = fixture.componentInstance;
  });

  it('should load orders on init', () => {
    component.ngOnInit();
    expect(component.orders().length).toBe(2);
    expect(component.isLoading()).toBeFalse();
  });

  it('should format payment status labels and classes correctly', () => {
    component.ngOnInit();

    expect(component.paymentStatusLabel(mockOrders[0])).toBe('Pendente');
    expect(component.paymentStatusClass(mockOrders[0])).toBe('badge-warning');

    expect(component.paymentStatusLabel(mockOrders[1])).toBe('Aprovado');
    expect(component.paymentStatusClass(mockOrders[1])).toBe('badge-success');
  });

  it('should sync payment status when verifyPaymentStatus is called', () => {
    const updatedPayment: PaymentResponse = {
      id: 10,
      amount: 120.0,
      status: 'COMPLETED',
      orderId: 1,
      userId: 5,
      paymentMethodId: 1,
    };
    paymentServiceSpy.syncPaymentStatus.and.returnValue(of(updatedPayment));

    component.ngOnInit();
    component.verifyPaymentStatus(mockOrders[0]);

    expect(paymentServiceSpy.syncPaymentStatus).toHaveBeenCalledWith(10);
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalled();
  });
});
