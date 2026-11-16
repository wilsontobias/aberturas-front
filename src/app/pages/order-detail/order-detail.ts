import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';

import { Order, Payment, Tracking } from '../../core/models';
import { AuthService } from '../../services/auth';
import { OrderService } from '../../services/orders';
import { itemLabel, orderColor, orderLabel, orderSteps, paymentLabel } from '../../utils/status';

const MAX_RECEIPT_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

/** Pedidos en los que todavía se pueden mover productos y cambiar la fecha de envío. */
const WORKING_STATUSES = ['confirmed', 'in_production', 'finished', 'packed'];

/** Siguiente estado de un producto (pending → in_production → done → packed → shipped). */
const NEXT_ITEM_STATUS: Record<string, string> = {
  pending: 'in_production',
  in_production: 'done',
  done: 'packed',
  packed: 'shipped',
};

@Component({
  selector: 'app-order-detail',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './order-detail.html',
})
export class OrderDetail implements OnInit {
  private orders = inject(OrderService);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  order = signal<Order | null>(null);
  tracking = signal<Tracking | null>(null);
  payments = signal<Payment[]>([]);

  loading = signal(true);
  error = signal('');
  actionError = signal('');
  actionOk = signal('');
  busy = signal(false);
  confirmingCancel = signal(false);
  confirmingBalance = signal(false);
  rejecting = signal(false);

  rejectReason = '';
  shipDate = '';

  file: File | null = null;
  fileError = signal('');

  label = orderLabel;
  color = orderColor;
  itemText = itemLabel;
  paymentText = paymentLabel;

  statusName = computed(() => this.order()?.status?.name ?? '');
  isOwner = computed(() => this.order()?.user_id === this.auth.user()?.id);
  canPay = computed(() => this.isOwner() && this.statusName() === 'pending_payment');
  backLink = computed(() => (this.isOwner() ? '/orders' : '/staff/orders'));

  /** El dueño cancela mientras no pagó; un administrador, cualquier pedido que no salió. */
  canCancel = computed(
    () =>
      this.canPay() ||
      (this.auth.isAdmin() && !['shipped', 'delivered', 'cancelled'].includes(this.statusName())),
  );

  /** Comprobante de seña esperando revisión (solo lo ve quien puede verificar pagos). */
  pendingPayment = computed(() =>
    this.auth.can('verify_payments') && this.statusName() === 'receipt_in_review'
      ? (this.payments().find((p) => p.type?.name === 'deposit' && p.status?.name === 'pending') ?? null)
      : null,
  );

  canUpdateItems = computed(() => this.auth.can('update_item_status') && WORKING_STATUSES.includes(this.statusName()));
  canEditShipDate = computed(() => this.auth.can('edit_ship_date') && WORKING_STATUSES.includes(this.statusName()));
  canRegisterBalance = computed(() => this.auth.can('register_balance_payment') && this.statusName() === 'shipped');
  isCancelled = computed(() => this.statusName() === 'cancelled');
  hasInvoice = computed(() => !['pending_payment', 'receipt_in_review', 'cancelled', ''].includes(this.statusName()));

  /** Etapas con su estado: hecha, actual o pendiente. */
  steps = computed(() => {
    const order = this.order();

    if (!order) {
      return [];
    }

    const names = orderSteps(order.requires_manufacturing);
    const current = names.indexOf(this.statusName());

    return names.map((name, index) => ({
      name,
      state: index < current ? 'done' : index === current ? 'current' : 'todo',
    }));
  });

  /** Si el último comprobante fue rechazado, se muestra el motivo para que suba otro. */
  lastRejection = computed(() => {
    const last = this.payments()[0];

    return this.statusName() === 'pending_payment' && last?.status?.name === 'rejected' ? last.rejection_reason : null;
  });

  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(afterLoad?: () => void): void {
    forkJoin({
      order: this.orders.getOrder(this.id),
      tracking: this.orders.getTracking(this.id),
      payments: this.orders.getPayments(this.id),
    }).subscribe({
      next: (data) => {
        this.order.set(data.order);
        this.tracking.set(data.tracking);
        this.shipDate = data.order.estimated_ship_date ?? '';
        // el más nuevo primero (por id), así el último comprobante es siempre el primero de la lista
        this.payments.set([...data.payments].sort((a, b) => b.id - a.id));
        this.loading.set(false);
        afterLoad?.();
      },
      error: (err) => {
        this.error.set(
          err.status === 404 ? 'Ese pedido no existe.' : (err.error?.message ?? 'No se pudo cargar el pedido.'),
        );
        this.loading.set(false);
      },
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.file = null;
    this.fileError.set('');

    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.fileError.set('El comprobante debe ser JPG, PNG o PDF.');
      return;
    }

    if (file.size > MAX_RECEIPT_BYTES) {
      this.fileError.set('El comprobante no puede superar los 2 MB.');
      return;
    }

    this.file = file;
  }

  upload(): void {
    if (!this.file) {
      this.fileError.set('Elegí el archivo del comprobante.');
      return;
    }

    this.busy.set(true);
    this.actionError.set('');
    this.actionOk.set('');

    this.orders.uploadReceipt(this.id, this.file).subscribe({
      next: () => {
        this.file = null;
        this.load(() => {
          this.busy.set(false);
          this.actionOk.set('Comprobante enviado. Lo vamos a revisar a la brevedad.');
        });
      },
      error: (err) => {
        this.fileError.set(err.error?.errors?.receipt?.[0] ?? err.error?.message ?? 'No se pudo subir el comprobante.');
        this.busy.set(false);
      },
    });
  }

  cancel(): void {
    this.busy.set(true);
    this.actionError.set('');
    this.actionOk.set('');

    this.orders.cancelOrder(this.id).subscribe({
      next: () => {
        this.confirmingCancel.set(false);
        this.load(() => {
          this.busy.set(false);
          this.actionOk.set('El pedido fue cancelado.');
        });
      },
      error: (err) => {
        this.actionError.set(err.error?.message ?? 'No se pudo cancelar el pedido.');
        this.busy.set(false);
        this.confirmingCancel.set(false);
      },
    });
  }

  openReceipt(payment: Payment): void {
    this.orders.getReceipt(payment.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.actionError.set('No se pudo abrir el comprobante.'),
    });
  }

  openInvoice(): void {
    this.orders.getInvoice(this.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.actionError.set('No se pudo abrir la boleta.'),
    });
  }

  /** Estado al que se puede pasar un producto, o null si ya no tiene siguiente paso. */
  nextItemStatus(item: { status?: { name: string } }): string | null {
    const next = NEXT_ITEM_STATUS[item.status?.name ?? ''] ?? null;

    // Para enviar, todo el pedido tiene que estar empacado.
    if (next === 'shipped' && this.statusName() !== 'packed') {
      return null;
    }

    return next;
  }

  /** Corre una acción de la API y, si sale bien, recarga el pedido y muestra el mensaje. */
  private run(request: () => Observable<unknown>, okMessage: string, onFail?: () => void): void {
    this.busy.set(true);
    this.actionError.set('');
    this.actionOk.set('');

    request().subscribe({
      next: () => this.load(() => {
        this.busy.set(false);
        this.actionOk.set(okMessage);
      }),
      error: (err) => {
        const first = err.error?.errors ? (Object.values(err.error.errors)[0] as string[])[0] : null;

        this.actionError.set(first ?? err.error?.message ?? 'No se pudo completar la acción.');
        this.busy.set(false);
        onFail?.();
      },
    });
  }

  approvePayment(payment: Payment): void {
    this.run(() => this.orders.verifyPayment(payment.id, true), 'Comprobante aprobado. El pedido quedó confirmado.');
  }

  rejectPayment(payment: Payment): void {
    const reason = this.rejectReason.trim();

    if (!reason) {
      this.actionError.set('Para rechazar el comprobante tenés que escribir el motivo.');
      return;
    }

    this.run(() => this.orders.verifyPayment(payment.id, false, reason), 'Comprobante rechazado. El cliente puede subir otro.', () => undefined);
    this.rejecting.set(false);
    this.rejectReason = '';
  }

  advanceItem(item: { id: number; status?: { name: string } }): void {
    const next = this.nextItemStatus(item);

    if (next) {
      this.run(() => this.orders.updateItemStatus(item.id, next), 'Estado del producto actualizado.');
    }
  }

  saveShipDate(): void {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(this.shipDate);

    if (!match) {
      this.actionError.set('Elegí una fecha de envío.');
      return;
    }

    const day = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getDay();

    if (day !== 1 && day !== 4) {
      this.actionError.set('Los envíos salen solo los lunes y los jueves.');
      return;
    }

    this.run(() => this.orders.updateShipDate(this.id, this.shipDate), 'Fecha de envío actualizada.');
  }

  registerBalance(): void {
    this.confirmingBalance.set(false);
    this.run(() => this.orders.registerCashBalance(this.id), 'Saldo registrado. El pedido quedó entregado.');
  }
}
