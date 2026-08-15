import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CheckoutPending } from './checkout-pending';
import { ApiService } from '../../../core/services/api.service';
import { PaymentService } from '../../../core/services/payment.service';
import { CartService } from '../../../core/services/cart.service';
import { Order, PaymentResponse } from '../../../core/models/product.models';

describe('CheckoutPending', () => {
  let component: CheckoutPending;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let paymentServiceSpy: jasmine.SpyObj<PaymentService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;

  const mockPaymentResponse: PaymentResponse = {
    id: 1,
    amount: 150.0,
    status: 'PENDING',
    orderId: 16,
    userId: 5,
    paymentMethodId: 1,
  };

  const mockOrder: Order = {
    id: 16,
    userId: 5,
    totalAmount: 150.0,
    status: 'PENDING',
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getOrder']);
    paymentServiceSpy = jasmine.createSpyObj('PaymentService', ['syncPaymentStatus']);
    cartServiceSpy = jasmine.createSpyObj('CartService', ['clearCart']);

    apiServiceSpy.getOrder.and.returnValue(of(mockOrder));
    paymentServiceSpy.syncPaymentStatus.and.returnValue(of(mockPaymentResponse));

    await TestBed.configureTestingModule({
      imports: [CheckoutPending],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: PaymentService, useValue: paymentServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {
                collection_id: '123456789',
                collection_status: 'pending',
                external_reference: '1',
                payment_type: 'ticket',
              },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CheckoutPending);
    component = fixture.componentInstance;
  });

  it('should initialize and sync payment status on init', () => {
    component.ngOnInit();

    expect(cartServiceSpy.clearCart).toHaveBeenCalled();
    expect(paymentServiceSpy.syncPaymentStatus).toHaveBeenCalledWith('1');
    expect(component.orderId()).toBe(16);
    expect(apiServiceSpy.getOrder).toHaveBeenCalledWith(16);
    expect(component.paymentTypeDescription).toContain('Boleto bancário');
  });
});
