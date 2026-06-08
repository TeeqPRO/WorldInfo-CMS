import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <router-outlet></router-outlet>

    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="footer-main">
          <a class="footer-brand" routerLink="/">
            <span class="brand-dot"></span>
            WorldInfo
            <span class="brand-tag">PL</span>
          </a>
          <p>Nowoczesny serwis informacyjny z panelem CMS dla redakcji.</p>
        </div>
        <nav aria-label="Stopka">
          <a routerLink="/">Strona glowna</a>
          <a routerLink="/favorites">Ulubione artykuly</a>
          <a routerLink="/profile">Profil</a>
          <a *ngIf="canManageArticles" routerLink="/my-articles">Twoje artykuly</a>
          <a *ngIf="canManageArticles" routerLink="/articles/new">Dodaj artykul</a>
          <a *ngIf="currentUser()?.role === 'admin'" routerLink="/admin">Admin</a>
        </nav>
      </div>
      <div class="site-footer-bottom">
        <span>WorldInfo CMS</span>
        <span>Laravel API + Angular UI</span>
      </div>
    </footer>
  `,
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);

  protected readonly currentUser = this.auth.currentUser;

  ngOnInit(): void {
    void this.auth.restoreSession();
  }

  protected get canManageArticles(): boolean {
    const role = this.currentUser()?.role;
    return role === 'journalist' || role === 'admin';
  }
}
