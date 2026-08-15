import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Checkout } from './checkout';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { PaymentService } from '../../core/services/payment.service';
import { Address, Order, PaymentMethod, PaymentResponse } from '../../core/models/product.models';

describe('Checkout', () => {
  let component: Checkout;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let paymentServiceSpy: jasmine.SpyObj<PaymentService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let router: Router;

  const mockAddress: Address = {
    id: 1,
    userId: 5,
    street: 'Rua das Flores',
    number: '123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01001-000',
    isDefault: true,
  };

  const mockPaymentMethod: PaymentMethod = {
    id: 1,
    name: 'Mercado Pago (Cartão, Pix, Boleto)',
    isActive: true,
  };

  const mockCreatedOrder: Order = {
    id: 100,
    userId: 5,
    totalAmount: 250.0,
    status: 'PENDING',
  };

  const mockPaymentResponse: PaymentResponse = {
    id: 50,
    amount: 250.0,
    status: 'PENDING',
    orderId: 100,
    userId: 5,
    paymentMethodId: 1,
    checkoutUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test',
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getMyAddresses',
      'getPaymentMethods',
      'createAddress',
      'createOrder',
    ]);
    paymentServiceSpy = jasmine.createSpyObj('PaymentService', ['createPayment']);
    cartServiceSpy = jasmine.createSpyObj('CartService', ['cartItems', 'totalPrice', 'clearCart']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showError',
      'showInfo',
      'showSuccess',
      'showWarning',
    ]);

    authServiceSpy.currentUser.and.returnValue({
      id: 5,
      name: 'João Silva',
      email: 'joao@example.com',
      role: 'USER',
    });
    cartServiceSpy.cartItems.and.returnValue([
      {
        product: { id: 10, name: 'Vinho Tinto', price: 125.0, stock: 10 },
        quantity: 2,
      },
    ]);
    cartServiceSpy.totalPrice.and.returnValue(250.0);

    apiServiceSpy.getMyAddresses.and.returnValue(of([mockAddress]));
    apiServiceSpy.getPaymentMethods.and.returnValue(of([mockPaymentMethod]));
    apiServiceSpy.createOrder.and.returnValue(of(mockCreatedOrder));
    paymentServiceSpy.createPayment.and.returnValue(of(mockPaymentResponse));

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: PaymentService, useValue: paymentServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
  });

  it('should initialize addresses and active payment methods', () => {
    component.ngOnInit();

    expect(component.addresses().length).toBe(1);
    expect(component.selectedAddressId()).toBe(1);
    expect(component.paymentMethods().length).toBe(1);
    expect(component.selectedPaymentMethodId()).toBe(1);
  });

  it('should redirect to /cart when cart is empty', () => {
    cartServiceSpy.cartItems.and.returnValue([]);
    component.ngOnInit();

    expect(notificationServiceSpy.showInfo).toHaveBeenCalledWith('Seu carrinho está vazio.');
    expect(router.navigate).toHaveBeenCalledWith(['/cart']);
  });

  it('placeOrder should create order, clear cart and initiate payment', () => {
    component.ngOnInit();
    component.placeOrder();

    expect(apiServiceSpy.createOrder).toHaveBeenCalled();
    expect(cartServiceSpy.clearCart).toHaveBeenCalled();
    expect(paymentServiceSpy.createPayment).toHaveBeenCalledWith({
      orderId: 100,
      paymentMethodId: 1,
    });
    expect(component.step()).toBe('redirecting');
  });

  it('placeOrder should handle payment creation error gracefully', () => {
    paymentServiceSpy.createPayment.and.returnValue(
      throwError(() => ({ error: { message: 'Erro ao conectar com gateway.' } })),
    );

    component.ngOnInit();
    component.placeOrder();

    expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Erro ao conectar com gateway.');
    expect(component.isPlacing()).toBeFalse();
    expect(component.step()).toBe('review');
  });
});
