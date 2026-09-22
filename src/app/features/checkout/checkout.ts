import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideArrowLeft,
  lucideArrowRight,
  lucideCheck,
  lucideCreditCard,
  lucideMapPin,
  lucidePlus,
  lucideShieldCheck,
  lucideShoppingBag,
  lucideTruck,
  lucideX,
} from '@ng-icons/lucide';
import { environment } from '../../../environments/environment';
import { CreateTransparentPaymentRequest, PaymentStatus } from '../../core/models/payment.models';
import {
  Address,
  CreateAddressRequest,
  CreateOrderRequest,
  Order,
  PaymentMethod,
  PaymentResponse,
} from '../../core/models/product.models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartItemView, CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { PaymentService } from '../../core/services/payment.service';
import { TelemetryService } from '../../core/services/telemetry.service';

type CheckoutStep = 'address' | 'review' | 'processing' | 'result';

interface TransparentPaymentFormData {
  token?: string;
  payment_method_id: string;
  installments?: number;
  issuer_id?: string;
  payer?: {
    email?: string;
    identification?: { type?: string; number?: string };
  };
}

interface PaymentBrickController {
  unmount: () => void;
}

interface MercadoPagoBricks {
  create: (
    type: 'payment',
    containerId: string,
    settings: {
      initialization: { amount: number };
      customization: { paymentMethods: Record<string, string> };
      callbacks: {
        onReady: () => void;
        onSubmit: (event: { formData: TransparentPaymentFormData }) => Promise<void>;
        onError: () => void;
      };
    },
  ) => Promise<PaymentBrickController>;
}

interface MercadoPagoSdk {
  bricks: () => MercadoPagoBricks;
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale: string }) => MercadoPagoSdk;
  }
}

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, RouterLink, NgIconComponent],
  templateUrl: './checkout.html',
  providers: [
    provideIcons({
      lucideCreditCard,
      lucideMapPin,
      lucideShieldCheck,
      lucideTruck,
      lucideArrowRight,
      lucideArrowLeft,
      lucidePlus,
      lucideX,
      lucideCheck,
      lucideShoppingBag,
      lucideAlertCircle,
    }),
  ],
})
export class Checkout implements OnInit {
  private apiService = inject(ApiService);
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private telemetryService = inject(TelemetryService);

  step = signal<CheckoutStep>('address');
  isLoading = signal(false);
  isPlacing = signal(false);
  isSearchingCep = signal(false);

  addresses = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  paymentMethods = signal<PaymentMethod[]>([]);
  selectedPaymentMethodId = signal<number | null>(null);

  // Modal / formulário rápido para adicionar novo endereço
  showAddressModal = signal(false);
  isSavingAddress = signal(false);
  newAddressData: CreateAddressRequest = {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
    isDefault: false,
  };

  // Observações opcionais de entrega
  orderNotes = signal<string>('');

  // Dados pós-criação
  createdOrder = signal<Order | null>(null);
  paymentBrickError = signal<string | null>(null);
  paymentResult = signal<PaymentStatus | null>(null);
  paymentResultId = signal<number | null>(null);
  private paymentBrick?: PaymentBrickController;
  private paymentStatusPolls = 0;
  private paymentStartedAt = 0;

  get cartItems() {
    return this.cartService.cartItems();
  }

  get cartTotal() {
    return this.cartService.totalPrice();
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  get selectedAddress(): Address | undefined {
    return this.addresses().find((a: Address) => a.id === this.selectedAddressId());
  }

  get selectedPaymentMethod(): PaymentMethod | undefined {
    return this.paymentMethods().find(
      (m: PaymentMethod) => m.id === this.selectedPaymentMethodId(),
    );
  }

  ngOnInit() {
    if (this.cartItems.length === 0) {
      this.notificationService.showInfo('Seu carrinho está vazio.');
      this.router.navigate(['/cart']);
      return;
    }
    this.loadAddresses();
    this.loadPaymentMethods();
  }

  loadAddresses() {
    const user = this.currentUser;
    if (!user) return;

    this.isLoading.set(true);
    this.apiService.getMyAddresses().subscribe({
      next: (addresses: Address[]) => {
        this.addresses.set(addresses);
        const def = addresses.find((a: Address) => a.isDefault);
        if (def && !this.selectedAddressId()) {
          this.selectedAddressId.set(def.id);
        } else if (addresses.length > 0 && !this.selectedAddressId()) {
          this.selectedAddressId.set(addresses[0].id);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('Não foi possível carregar seus endereços.');
        this.isLoading.set(false);
      },
    });
  }

  loadPaymentMethods() {
    this.apiService.getPaymentMethods().subscribe({
      next: (methods: PaymentMethod[]) => {
        const activeMethods = methods.filter((m: PaymentMethod) => m.isActive);
        this.paymentMethods.set(activeMethods);
        if (activeMethods.length > 0 && !this.selectedPaymentMethodId()) {
          this.selectedPaymentMethodId.set(activeMethods[0].id);
        }
      },
      error: () => {
        /* fallback silencioso */
      },
    });
  }

  openNewAddressModal() {
    this.newAddressData = {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Brasil',
      isDefault: this.addresses().length === 0,
    };
    this.showAddressModal.set(true);
  }

  closeAddressModal() {
    this.showAddressModal.set(false);
  }

  onCepBlur() {
    const cleanCep = (this.newAddressData.zipCode || '').replace(/\D/g, '');
    if (cleanCep.length === 8) {
      this.isSearchingCep.set(true);
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          this.isSearchingCep.set(false);
          if (data && !data.erro) {
            this.newAddressData.street = data.logradouro || this.newAddressData.street;
            this.newAddressData.neighborhood = data.bairro || this.newAddressData.neighborhood;
            this.newAddressData.city = data.localidade || this.newAddressData.city;
            this.newAddressData.state = data.uf || this.newAddressData.state;
          }
        })
        .catch(() => {
          this.isSearchingCep.set(false);
        });
    }
  }

  saveQuickAddress() {
    if (
      !this.newAddressData.street ||
      !this.newAddressData.city ||
      !this.newAddressData.state ||
      !this.newAddressData.zipCode
    ) {
      this.notificationService.showError(
        'Preencha os campos obrigatórios (CEP, Rua, Cidade, Estado).',
      );
      return;
    }

    this.isSavingAddress.set(true);
    this.apiService.createAddress(this.newAddressData).subscribe({
      next: (created: Address) => {
        this.isSavingAddress.set(false);
        this.showAddressModal.set(false);
        this.notificationService.showSuccess('Endereço adicionado com sucesso!');
        this.addresses.update((list) => [...list, created]);
        this.selectedAddressId.set(created.id);
      },
      error: () => {
        this.isSavingAddress.set(false);
        this.notificationService.showError('Erro ao cadastrar novo endereço.');
      },
    });
  }

  goToReview() {
    if (!this.selectedAddressId()) {
      this.notificationService.showError(
        'Por favor, cadastre ou selecione um endereço de entrega.',
      );
      return;
    }
    if (!this.selectedPaymentMethodId()) {
      this.notificationService.showError('Por favor, selecione uma forma de pagamento.');
      return;
    }
    this.step.set('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void this.initializePaymentBrick();
  }

  goToAddress() {
    this.paymentBrick?.unmount();
    this.paymentBrick = undefined;
    this.step.set('address');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retryTransparentPayment() {
    this.paymentResult.set(null);
    this.paymentResultId.set(null);
    this.paymentBrickError.set(null);
    this.step.set('review');
    setTimeout(() => void this.initializePaymentBrick(), 0);
  }

  /**
   * Fluxo de finalização do pedido:
   * 1. Cria o pedido no backend com os itens do carrinho e endereço.
   * 2. Envia o token gerado pelo Payment Brick ao backend.
   * 3. Direciona para a tela correspondente ao status retornado pelo Mercado Pago.
   */
  async placeOrder(paymentData: TransparentPaymentFormData) {
    const user = this.currentUser;
    if (!user) {
      this.notificationService.showError('Faça login para finalizar a compra.');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.selectedAddressId()) {
      this.notificationService.showError('Selecione um endereço de entrega.');
      this.step.set('address');
      return;
    }

    if (!this.selectedPaymentMethodId()) {
      this.notificationService.showError('Selecione uma forma de pagamento.');
      this.step.set('address');
      return;
    }

    if (this.cartItems.length === 0) {
      this.notificationService.showError('Seu carrinho está vazio.');
      this.router.navigate(['/cart']);
      return;
    }

    if (!paymentData?.payment_method_id) {
      this.notificationService.showError('Selecione uma forma de pagamento.');
      return;
    }

    const existingOrder = this.createdOrder();
    if (existingOrder) {
      this.startTransparentPayment(existingOrder.id, this.selectedPaymentMethodId()!, paymentData);
      return;
    }

    this.isPlacing.set(true);
    this.paymentStartedAt = performance.now();
    this.telemetryService.recordCheckout({ event: 'payment_submitted' });

    const body: CreateOrderRequest = {
      userId: user.id,
      addressId: this.selectedAddressId()!,
      paymentMethodId: this.selectedPaymentMethodId()!,
      items: this.cartItems.map((item: CartItemView) => ({
        productId: item.product.id!,
        quantity: item.quantity,
      })),
    };

    this.apiService.createOrder(body).subscribe({
      next: (order: Order) => {
        this.createdOrder.set(order);
        this.telemetryService.recordCheckout({ event: 'order_created' });
        this.startTransparentPayment(order.id, this.selectedPaymentMethodId()!, paymentData);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Erro ao criar o pedido. Tente novamente.';
        this.notificationService.showError(msg);
        this.isPlacing.set(false);
      },
    });
  }

  private startTransparentPayment(
    orderId: number,
    paymentMethodId: number,
    paymentData: TransparentPaymentFormData,
  ) {
    this.step.set('processing');
    this.isPlacing.set(true);
    const request: CreateTransparentPaymentRequest = {
      orderId,
      paymentMethodId,
      mercadoPagoPaymentMethodId: paymentData.payment_method_id,
      token: paymentData.token,
      installments: paymentData.installments,
      issuerId: paymentData.issuer_id,
      payerEmail: paymentData.payer?.email,
      payerIdentificationType: paymentData.payer?.identification?.type,
      payerIdentificationNumber: paymentData.payer?.identification?.number,
    };

    this.paymentService.createTransparentPayment(request).subscribe({
      next: (payment: PaymentResponse) => {
        this.isPlacing.set(false);
        this.paymentResult.set(payment.status);
        this.paymentResultId.set(payment.id);
        this.step.set('result');
        this.telemetryService.recordCheckout({
          event: 'payment_result',
          status: payment.status,
          durationMs: Math.round(performance.now() - this.paymentStartedAt),
        });
        if (payment.status === 'COMPLETED') {
          this.cartService.clearCart();
        } else if (payment.status === 'PENDING') {
          this.startPaymentStatusPolling(payment.id);
        }
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Erro ao gerar o pagamento com o Mercado Pago.';
        this.notificationService.showError(msg);
        this.paymentBrickError.set(msg);
        this.telemetryService.recordCheckout({
          event: 'payment_error',
          durationMs: Math.round(performance.now() - this.paymentStartedAt),
        });
        this.isPlacing.set(false);
        this.step.set('review');
        setTimeout(() => void this.initializePaymentBrick(), 0);
      },
    });
  }

  private startPaymentStatusPolling(paymentId: number) {
    this.paymentStatusPolls = 0;
    const poll = () => {
      if (this.paymentResult() !== 'PENDING' || this.paymentStatusPolls >= 10) {
        return;
      }

      this.paymentStatusPolls += 1;
      this.paymentService.syncPaymentStatus(paymentId).subscribe({
        next: (payment: PaymentResponse) => {
          this.paymentResult.set(payment.status);
          if (payment.status === 'COMPLETED') {
            this.cartService.clearCart();
            return;
          }
          if (payment.status === 'PENDING') {
            setTimeout(poll, 3000);
          }
        },
        error: () => setTimeout(poll, 3000),
      });
    };

    setTimeout(poll, 3000);
  }

  private async initializePaymentBrick() {
    this.paymentBrickError.set(null);
    if (!environment.mercadoPagoPublicKey) {
      this.paymentBrickError.set(
        'Configure a public key do Mercado Pago para habilitar o pagamento.',
      );
      return;
    }

    try {
      await this.loadMercadoPagoSdk();
      this.paymentBrick?.unmount();
      this.paymentBrick = await new window.MercadoPago!(environment.mercadoPagoPublicKey, {
        locale: 'pt-BR',
      })
        .bricks()
        .create('payment', 'paymentBrick_container', {
          initialization: { amount: this.cartTotal },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              bankTransfer: 'all',
              ticket: 'all',
            },
          },
          callbacks: {
            onReady: () => undefined,
            onSubmit: ({ formData }) => this.placeOrder(formData),
            onError: () => {
              this.paymentBrickError.set('Não foi possível carregar o formulário de pagamento.');
            },
          },
        });
    } catch {
      this.paymentBrickError.set('Não foi possível carregar o pagamento transparente.');
    }
  }

  private loadMercadoPagoSdk(): Promise<void> {
    if (window.MercadoPago) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Mercado Pago SDK indisponível'));
      document.head.appendChild(script);
    });
  }
}
