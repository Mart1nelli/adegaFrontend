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

type CheckoutStep = 'address' | 'review' | 'redirecting';

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
  checkoutPaymentUrl = signal<string | null>(null);

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
    return this.paymentMethods().find((m: PaymentMethod) => m.id === this.selectedPaymentMethodId());
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
    if (!this.newAddressData.street || !this.newAddressData.city || !this.newAddressData.state || !this.newAddressData.zipCode) {
      this.notificationService.showError('Preencha os campos obrigatórios (CEP, Rua, Cidade, Estado).');
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
      this.notificationService.showError('Por favor, cadastre ou selecione um endereço de entrega.');
      return;
    }
    if (!this.selectedPaymentMethodId()) {
      this.notificationService.showError('Por favor, selecione uma forma de pagamento.');
      return;
    }
    this.step.set('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToAddress() {
    this.step.set('address');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Fluxo de finalização do pedido:
   * 1. Cria o pedido no backend com os itens do carrinho e endereço.
   * 2. Inicia o pagamento gerando a preferência do Mercado Pago via createPayment.
   * 3. Redireciona o usuário de forma segura para o checkoutUrl do Mercado Pago.
   */
  placeOrder() {
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

    this.isPlacing.set(true);

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
        // Limpa o carrinho para evitar duplicidade
        this.cartService.clearCart();
        this.startPayment(order.id, this.selectedPaymentMethodId()!);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Erro ao criar o pedido. Tente novamente.';
        this.notificationService.showError(msg);
        this.isPlacing.set(false);
      },
    });
  }

  private startPayment(orderId: number, paymentMethodId: number) {
    this.step.set('redirecting');

    this.paymentService.createPayment({ orderId, paymentMethodId }).subscribe({
      next: (payment: PaymentResponse) => {
        if (payment.checkoutUrl) {
          this.checkoutPaymentUrl.set(payment.checkoutUrl);
          // Redireciona para o checkout do Mercado Pago
          setTimeout(() => {
            window.location.href = payment.checkoutUrl!;
          }, 600);
        } else {
          this.notificationService.showError('URL de pagamento não retornada pelo servidor.');
          this.isPlacing.set(false);
          this.step.set('review');
        }
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Erro ao gerar o pagamento com o Mercado Pago.';
        this.notificationService.showError(msg);
        this.isPlacing.set(false);
        this.step.set('review');
      },
    });
  }
}
