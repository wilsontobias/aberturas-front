import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Permissions } from '../../core/models';
import { AdminService } from '../../services/admin';
import { PERMISSION_LABELS, typeLabel } from '../../utils/roles';

@Component({
  selector: 'app-admin-permissions',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-permissions.html',
})
export class AdminPermissions implements OnInit {
  private admin = inject(AdminService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  private id = 0;

  userName = signal('');
  userType = signal('');
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  ok = signal('');

  keys = Object.keys(PERMISSION_LABELS) as (keyof Permissions)[];
  labels = PERMISSION_LABELS;
  typeText = typeLabel;

  form = this.fb.nonNullable.group({
    create_orders: false,
    view_own_orders: false,
    view_all_orders: false,
    verify_payments: false,
    update_item_status: false,
    edit_ship_date: false,
    register_balance_payment: false,
  });

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    this.admin.getPermissions(this.id).subscribe({
      next: (res) => {
        this.userName.set(res.user.name);
        this.userType.set(res.user.type);
        this.form.patchValue(res.permissions);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar los permisos.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    this.ok.set('');

    this.admin.savePermissions(this.id, this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.ok.set('Permisos guardados.');
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron guardar los permisos.');
        this.saving.set(false);
      },
    });
  }
}
