import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthUser, EditableRole } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  protected readonly users = signal<AuthUser[]>([]);
  protected readonly error = signal('');
  protected readonly isLoading = signal(true);
  protected readonly busyUserId = signal<number | null>(null);

  protected readonly editableRoles: Array<{ value: EditableRole; label: string }> = [
    { value: 'user', label: 'Uzytkownik' },
    { value: 'journalist', label: 'Dziennikarz' },
  ];

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.loadPanel();
  }

  protected canEditRole(user: AuthUser): boolean {
    return user.role !== 'admin';
  }

  protected roleLabel(role: AuthUser['role']): string {
    const labels: Record<AuthUser['role'], string> = {
      user: 'Uzytkownik',
      journalist: 'Dziennikarz',
      admin: 'Glowny admin',
    };

    return labels[role];
  }

  protected onRoleChange(user: AuthUser, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value !== 'user' && value !== 'journalist') {
      return;
    }

    void this.updateRole(user, value);
  }

  protected trackByUserId(_index: number, user: AuthUser): number {
    return user.id;
  }

  private async loadPanel(): Promise<void> {
    const currentUser = this.auth.currentUser() ?? await this.auth.restoreSession();
    if (!currentUser) {
      await this.router.navigateByUrl('/login');
      return;
    }

    if (currentUser.role !== 'admin') {
      await this.router.navigateByUrl('/profile');
      return;
    }

    await this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    this.error.set('');
    this.isLoading.set(true);

    try {
      this.users.set(await this.auth.getAdminUsers());
    } catch (error) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async updateRole(user: AuthUser, role: EditableRole): Promise<void> {
    if (!this.canEditRole(user)) {
      return;
    }

    this.error.set('');
    this.busyUserId.set(user.id);

    try {
      const updated = await this.auth.updateUserRole(user.id, role);
      this.users.update((users) => users.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.busyUserId.set(null);
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Wystapil nieoczekiwany blad.';
  }
}
