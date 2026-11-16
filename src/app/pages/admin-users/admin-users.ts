import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { User } from '../../core/models';
import { AdminService } from '../../services/admin';
import { AuthService } from '../../services/auth';
import { roleLabel, typeLabel } from '../../utils/roles';

type ActionKey = 'activate' | 'deactivate' | 'grantAdmin' | 'revokeAdmin' | 'grantOwner' | 'revokeOwner' | 'makeSeller' | 'makeCustomer';

interface PendingAction {
  user: User;
  key: ActionKey;
}

const ACTION_TEXT: Record<ActionKey, string> = {
  activate: 'activar a',
  deactivate: 'desactivar a',
  grantAdmin: 'dar el rol de administrador a',
  revokeAdmin: 'quitarle el rol de administrador a',
  grantOwner: 'marcar como propietario a',
  revokeOwner: 'quitarle lo de propietario a',
  makeSeller: 'pasar a vendedor a',
  makeCustomer: 'pasar a cliente a',
};

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-users.html',
})
export class AdminUsers implements OnInit {
  private admin = inject(AdminService);
  private auth = inject(AuthService);

  users = signal<User[]>([]);
  loading = signal(true);
  error = signal('');
  actionOk = signal('');
  actionError = signal('');
  busy = signal(false);
  pending = signal<PendingAction | null>(null);

  search = signal('');
  roleFilter = signal('');
  typeFilter = signal('');
  statusFilter = signal('');

  roleText = roleLabel;
  typeText = typeLabel;

  filtered = computed(() => {
    const text = this.search().trim().toLowerCase();

    return this.users().filter((user) => {
      const role = user.user_role?.role?.name ?? '';
      const type = user.user_role?.user_type?.name ?? '';
      const active = user.user_role?.status ? '1' : '0';

      return (
        (!text || user.name.toLowerCase().includes(text) || user.email.toLowerCase().includes(text)) &&
        (!this.roleFilter() || role === this.roleFilter()) &&
        (!this.typeFilter() || type === this.typeFilter()) &&
        (!this.statusFilter() || active === this.statusFilter())
      );
    });
  });

  confirmText = computed(() => {
    const p = this.pending();

    return p ? `¿Confirmás que querés ${ACTION_TEXT[p.key]} ${p.user.name}?` : '';
  });

  ngOnInit(): void {
    this.load();
  }

  load(afterLoad?: () => void): void {
    this.admin.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
        afterLoad?.();
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar los usuarios.');
        this.loading.set(false);
      },
    });
  }

  roleName(user: User): string {
    return user.user_role?.role?.name ?? '';
  }

  isActive(user: User): boolean {
    return user.user_role?.status === true;
  }

  private isOperational(user: User): boolean {
    return this.roleName(user) === 'OperationalUser';
  }

  private isSelf(user: User): boolean {
    return this.auth.user()?.id === user.id;
  }

  canToggle(user: User): boolean {
    return !this.isSelf(user) && this.roleName(user) !== 'SuperAdmin';
  }

  canGrantAdmin(user: User): boolean {
    const me = this.auth.user()?.user_role;

    return this.isOperational(user) && (this.auth.isSuperAdmin() || me?.is_owner === true);
  }

  canRevokeAdmin(user: User): boolean {
    return this.auth.isSuperAdmin() && this.roleName(user) === 'Administrator' && !user.user_role.is_owner;
  }

  canGrantOwner(user: User): boolean {
    return this.auth.isSuperAdmin() && this.roleName(user) === 'Administrator' && !user.user_role.is_owner;
  }

  canRevokeOwner(user: User): boolean {
    return this.auth.isSuperAdmin() && this.roleName(user) === 'Administrator' && user.user_role.is_owner;
  }

  canChangeType(user: User): boolean {
    return this.isOperational(user) && !this.isSelf(user);
  }

  canEditPermissions(user: User): boolean {
    return this.isOperational(user);
  }

  ask(user: User, key: ActionKey): void {
    this.actionOk.set('');
    this.actionError.set('');
    this.pending.set({ user, key });
  }

  cancelAsk(): void {
    this.pending.set(null);
  }

  confirm(): void {
    const p = this.pending();

    if (!p) {
      return;
    }

    const id = p.user.id;
    const requests: Record<ActionKey, () => Observable<unknown>> = {
      activate: () => this.admin.setStatus(id, true),
      deactivate: () => this.admin.setStatus(id, false),
      grantAdmin: () => this.admin.grantAdmin(id),
      revokeAdmin: () => this.admin.revokeAdmin(id),
      grantOwner: () => this.admin.grantOwner(id),
      revokeOwner: () => this.admin.revokeOwner(id),
      makeSeller: () => this.admin.changeType(id, 'seller'),
      makeCustomer: () => this.admin.changeType(id, 'customer'),
    };

    this.busy.set(true);
    this.pending.set(null);

    requests[p.key]().subscribe({
      next: (res) => {
        const message = (res as { message?: string } | null)?.message ?? 'Listo.';

        this.load(() => {
          this.busy.set(false);
          this.actionOk.set(message);
        });
      },
      error: (err) => {
        this.actionError.set(err.error?.message ?? 'No se pudo completar la acción.');
        this.busy.set(false);
      },
    });
  }
}
