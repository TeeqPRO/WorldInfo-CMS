import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Article, ArticleService } from '../../services/article.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-favorites',
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class Favorites implements OnInit {
  protected readonly isReady = signal(false);
  protected readonly error = signal('');
  protected readonly articles = signal<Article[]>([]);
  protected readonly busyArticleId = signal<number | null>(null);

  private readonly auth = inject(AuthService);
  private readonly articleService = inject(ArticleService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.loadPage();
  }

  protected async removeFavorite(article: Article): Promise<void> {
    this.busyArticleId.set(article.id);

    try {
      await this.articleService.unfavoriteArticle(article.id);
      this.articles.update((items) => items.filter((item) => item.id !== article.id));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Nie udalo sie usunac z ulubionych.');
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

    try {
      this.articles.set(await this.articleService.getFavoriteArticles());
      this.isReady.set(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Nie udalo sie pobrac ulubionych.');
      this.isReady.set(true);
    }
  }
}
