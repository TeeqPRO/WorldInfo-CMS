import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  protected email = '';
  protected password = '';
  protected readonly error = signal('');
  protected readonly isBusy = signal(false);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.redirectAuthenticatedUser();
  }

  protected async login(): Promise<void> {
    this.error.set('');
    this.isBusy.set(true);

    try {
      const user = await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl(user.role === 'admin' ? '/admin' : '/profile');
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
