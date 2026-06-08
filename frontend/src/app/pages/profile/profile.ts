import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected name = '';
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly isBusy = signal(false);
  protected readonly avatarPreview = signal('');

  private avatarFile: File | null = null;

  ngOnInit(): void {
    void this.loadUser();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  protected get avatarSource(): string {
    return this.avatarPreview() || this.user()?.avatar_url || '';
  }

  protected get initial(): string {
    return this.user()?.name.slice(0, 1).toUpperCase() || 'U';
  }

  protected get isAdmin(): boolean {
    return this.user()?.role === 'admin';
  }

  protected onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.revokePreview();
    this.avatarFile = file;
    this.avatarPreview.set(file ? URL.createObjectURL(file) : '');
    this.success.set('');
    this.error.set('');
  }

  protected async saveProfile(): Promise<void> {
    this.error.set('');
    this.success.set('');
    this.isBusy.set(true);

    try {
      const updated = await this.auth.updateProfile(this.name, this.avatarFile);
      this.syncForm(updated);
      this.avatarFile = null;
      this.revokePreview();
      this.success.set('Profil zapisany.');
    } catch (error) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.isBusy.set(false);
    }
  }

  protected async logout(): Promise<void> {
    this.isBusy.set(true);
    await this.auth.logout();
    this.isBusy.set(false);
    await this.router.navigateByUrl('/login');
  }

  private async loadUser(): Promise<void> {
    const user = this.auth.currentUser() ?? await this.auth.restoreSession();
    if (!user) {
      await this.router.navigateByUrl('/login');
      return;
    }

    this.syncForm(user);
  }

  private syncForm(user: AuthUser): void {
    this.name = user.name;
  }

  private revokePreview(): void {
    const preview = this.avatarPreview();
    if (preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    this.avatarPreview.set('');
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Wystapil nieoczekiwany blad.';
  }
}
