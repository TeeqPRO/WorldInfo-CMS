import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Article, ArticleService } from '../../services/article.service';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-my-articles',
  imports: [CommonModule, RouterLink],
  templateUrl: './my-articles.html',
  styleUrl: './my-articles.scss',
})
export class MyArticles implements OnInit {
  protected readonly isReady = signal(false);
  protected readonly error = signal('');
  protected readonly currentUser = signal<AuthUser | null>(null);
  protected readonly articles = signal<Article[]>([]);
  protected readonly busyArticleId = signal<number | null>(null);

  private readonly auth = inject(AuthService);
  private readonly articleService = inject(ArticleService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.loadPage();
  }

  protected async deleteArticle(article: Article): Promise<void> {
    if (!article.can_delete) {
      return;
    }

    this.error.set('');
    this.busyArticleId.set(article.id);

    try {
      await this.articleService.deleteArticle(article.id);
      this.articles.update((items) => items.filter((item) => item.id !== article.id));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Nie udalo sie usunac artykulu.');
    } finally {
      this.busyArticleId.set(null);
    }
  }

  protected trackByArticleId(_index: number, article: Article): number {
    return article.id;
  }

  private async loadPage(): Promise<void> {
    const user = this.auth.currentUser() ?? await this.auth.restoreSession();
    if (!user) {
      await this.router.navigateByUrl('/login');
      return;
    }

    if (user.role !== 'journalist' && user.role !== 'admin') {
      await this.router.navigateByUrl('/profile');
      return;
    }

    this.currentUser.set(user);

    try {
      this.articles.set(await this.articleService.getManageArticles());
      this.isReady.set(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Nie udalo sie pobrac artykulow.');
      this.isReady.set(true);
    }
  }
}
