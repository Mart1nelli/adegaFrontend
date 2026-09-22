import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Order, PaymentResponse } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { PaymentService } from '../../../core/services/payment.service';
import { CheckoutSuccess } from './checkout-success';

describe('CheckoutSuccess', () => {
  let component: CheckoutSuccess;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let paymentServiceSpy: jasmine.SpyObj<PaymentService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;

  const mockPaymentResponse: PaymentResponse = {
    id: 1,
    amount: 150.0,
    status: 'COMPLETED',
    orderId: 16,
    userId: 5,
    paymentMethodId: 1,
  };

  const mockOrder: Order = {
    id: 16,
    userId: 5,
    totalAmount: 150.0,
    status: 'PAID',
    items: [],
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getOrder']);
    paymentServiceSpy = jasmine.createSpyObj('PaymentService', ['syncPaymentStatus']);
    cartServiceSpy = jasmine.createSpyObj('CartService', ['clearCart']);

    apiServiceSpy.getOrder.and.returnValue(of(mockOrder));
    paymentServiceSpy.syncPaymentStatus.and.returnValue(of(mockPaymentResponse));

    await TestBed.configureTestingModule({
      imports: [CheckoutSuccess],
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
                collection_status: 'approved',
                external_reference: '1',
                payment_type: 'credit_card',
                merchant_order_id: '999',
              },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CheckoutSuccess);
    component = fixture.componentInstance;
  });

  it('should create and clear cart on init', () => {
    component.ngOnInit();
    expect(component).toBeTruthy();
    expect(cartServiceSpy.clearCart).toHaveBeenCalled();
  });

  it('should synchronize payment status using external_reference', () => {
    component.ngOnInit();

    expect(paymentServiceSpy.syncPaymentStatus).toHaveBeenCalledWith('1');
    expect(component.orderId()).toBe(16);
    expect(component.paymentAmount()).toBe(150.0);
    expect(apiServiceSpy.getOrder).toHaveBeenCalledWith(16);
  });

  it('should not treat external_reference as an order ID if sync fails', () => {
    paymentServiceSpy.syncPaymentStatus.and.returnValue(throwError(() => new Error('Sync error')));

    component.ngOnInit();

    expect(component.orderId()).toBeNull();
    expect(apiServiceSpy.getOrder).not.toHaveBeenCalled();
  });
});
