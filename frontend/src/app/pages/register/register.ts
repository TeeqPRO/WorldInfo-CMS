import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  protected name = '';
  protected email = '';
  protected password = '';
  protected readonly error = signal('');
  protected readonly isBusy = signal(false);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.redirectAuthenticatedUser();
  }

  protected async register(): Promise<void> {
    this.error.set('');
    this.isBusy.set(true);

    try {
      await this.auth.register(this.name, this.email, this.password);
      await this.router.navigateByUrl('/profile');
    } catch (error) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.isBusy.set(false);
    }
  }

  private async redirectAuthenticatedUser(): Promise<void> {
    const user = this.auth.currentUser() ?? await this.auth.restoreSession();
    if (user) {
      await this.router.navigateByUrl(user.role === 'admin' ? '/admin' : '/profile');
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Wystapil nieoczekiwany blad.';
  }
}
