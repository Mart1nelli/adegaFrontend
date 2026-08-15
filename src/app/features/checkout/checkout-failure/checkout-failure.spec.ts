import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CheckoutFailure } from './checkout-failure';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaymentResponse } from '../../../core/models/payment.models';

describe('CheckoutFailure', () => {
  let component: CheckoutFailure;
  let paymentServiceSpy: jasmine.SpyObj<PaymentService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let router: Router;

  const mockPaymentResponse: PaymentResponse = {
    id: 1,
    amount: 150.0,
    status: 'FAILED',
    orderId: 16,
    userId: 5,
    paymentMethodId: 1,
    checkoutUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=new-pref',
  };

  beforeEach(async () => {
    paymentServiceSpy = jasmine.createSpyObj('PaymentService', ['getPaymentById', 'createPayment']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showError']);

    paymentServiceSpy.getPaymentById.and.returnValue(of(mockPaymentResponse));
    paymentServiceSpy.createPayment.and.returnValue(of(mockPaymentResponse));

    await TestBed.configureTestingModule({
      imports: [CheckoutFailure],
      providers: [
        provideRouter([]),
        { provide: PaymentService, useValue: paymentServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {
                collection_id: '123456789',
                collection_status: 'rejected',
                external_reference: '1',
                status_detail: 'cc_rejected_insufficient_amount',
              },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(CheckoutFailure);
    component = fixture.componentInstance;
  });

  it('should initialize with query params and resolve orderId from payment', () => {
    component.ngOnInit();

    expect(component.paymentId()).toBe('123456789');
    expect(component.status()).toBe('rejected');
    expect(component.statusDetail()).toBe('cc_rejected_insufficient_amount');
    expect(paymentServiceSpy.getPaymentById).toHaveBeenCalledWith('1');
    expect(component.orderId()).toBe(16);
  });

  it('retryPayment should call createPayment and handle navigation when orderId is missing', () => {
    component.orderId.set(null);
    component.retryPayment();

    expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
  });

  it('retryPayment should handle error gracefully', () => {
    component.orderId.set(16);
    paymentServiceSpy.createPayment.and.returnValue(throwError(() => new Error('API Error')));

    component.retryPayment();

    expect(notificationServiceSpy.showError).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
  });
});
