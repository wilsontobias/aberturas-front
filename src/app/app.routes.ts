import { Routes } from '@angular/router';

import { adminGuard, authGuard, guestGuard, profileGuard, staffGuard } from './guards/auth.guard';
import { AdminPermissions } from './pages/admin-permissions/admin-permissions';
import { AdminProducts } from './pages/admin-products/admin-products';
import { AdminUsers } from './pages/admin-users/admin-users';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { CompleteProfile } from './pages/complete-profile/complete-profile';
import { GoogleCallback } from './pages/google-callback/google-callback';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { OrderDetail } from './pages/order-detail/order-detail';
import { Orders } from './pages/orders/orders';
import { StaffOrders } from './pages/staff-orders/staff-orders';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Register } from './pages/register/register';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'products/:id', component: ProductDetail },
  { path: 'cart', component: Cart },
  { path: 'checkout', component: Checkout, canActivate: [authGuard, profileGuard] },
  { path: 'orders', component: Orders, canActivate: [authGuard] },
  { path: 'orders/:id', component: OrderDetail, canActivate: [authGuard] },
  { path: 'staff/orders', component: StaffOrders, canActivate: [authGuard, staffGuard] },
  { path: 'admin/users', component: AdminUsers, canActivate: [authGuard, adminGuard] },
  { path: 'admin/users/:id/permissions', component: AdminPermissions, canActivate: [authGuard, adminGuard] },
  { path: 'admin/products', component: AdminProducts, canActivate: [authGuard, adminGuard] },
  { path: 'auth/google', component: GoogleCallback },
  { path: 'complete-profile', component: CompleteProfile, canActivate: [authGuard] },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: '**', redirectTo: '' },
];
