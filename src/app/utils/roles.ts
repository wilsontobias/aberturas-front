/** Textos en español de roles, tipos de usuario y permisos. */

const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super administrador',
  Administrator: 'Administrador',
  OperationalUser: 'Usuario',
};

const TYPE_LABELS: Record<string, string> = {
  customer: 'Cliente',
  seller: 'Vendedor',
};

export const PERMISSION_LABELS: Record<string, string> = {
  create_orders: 'Crear pedidos',
  view_own_orders: 'Ver sus propios pedidos',
  view_all_orders: 'Ver todos los pedidos',
  verify_payments: 'Verificar comprobantes de pago',
  update_item_status: 'Cambiar el estado de los productos',
  edit_ship_date: 'Editar la fecha de envío',
  register_balance_payment: 'Registrar el pago del saldo',
};

export const roleLabel = (name?: string): string => (name ? (ROLE_LABELS[name] ?? name) : '');
export const typeLabel = (name?: string | null): string => (name ? (TYPE_LABELS[name] ?? name) : '—');
