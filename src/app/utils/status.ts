/** Textos y colores de los estados, para mostrarlos en español. */

const ORDER_LABELS: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  receipt_in_review: 'Comprobante en revisión',
  confirmed: 'Confirmado',
  in_production: 'En producción',
  finished: 'Terminado',
  packed: 'Empacado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const ORDER_COLORS: Record<string, string> = {
  pending_payment: 'text-bg-warning',
  receipt_in_review: 'text-bg-info',
  confirmed: 'text-bg-primary',
  in_production: 'text-bg-primary',
  finished: 'text-bg-success',
  packed: 'text-bg-secondary',
  shipped: 'text-bg-dark',
  delivered: 'text-bg-success',
  cancelled: 'text-bg-danger',
};

const ITEM_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_production: 'En producción',
  done: 'Terminado',
  packed: 'Empacado',
  shipped: 'Enviado',
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Pendiente de revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  deposit: 'Seña',
  balance: 'Saldo',
};

/** Etapas del pedido en orden; "in_production" solo aparece si hay productos a fabricar. */
export function orderSteps(requiresManufacturing: boolean): string[] {
  const steps = ['pending_payment', 'receipt_in_review', 'confirmed'];

  if (requiresManufacturing) {
    steps.push('in_production');
  }

  return [...steps, 'finished', 'packed', 'shipped', 'delivered'];
}

export const orderLabel = (name?: string): string => (name ? (ORDER_LABELS[name] ?? name) : '');
export const orderColor = (name?: string): string => (name ? (ORDER_COLORS[name] ?? 'text-bg-light') : 'text-bg-light');
export const itemLabel = (name?: string): string => (name ? (ITEM_LABELS[name] ?? name) : '');
export const paymentLabel = (name?: string): string => (name ? (PAYMENT_LABELS[name] ?? name) : '');
