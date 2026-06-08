import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Article, ArticleService } from '../../services/article.service';
import { AuthService } from '../../services/auth.service';
import { formatArticleBody } from '../../utils/article-formatting';

@Component({
  selector: 'app-article-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.scss',
})
export class ArticleDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly articles = inject(ArticleService);
  private readonly auth = inject(AuthService);

  protected readonly article = signal<Article | null>(null);
  protected readonly error = signal('');
  protected readonly currentUser = this.auth.currentUser;

  ngOnInit(): void {
    void this.auth.restoreSession();
    void this.loadArticle();
  }

  protected get renderedBody(): string {
    return formatArticleBody(this.article()?.body ?? '');
  }

  protected async toggleFavorite(): Promise<void> {
    const article = this.article();
    if (!article) {
      return;
    }

    if (!this.currentUser()) {
      await this.router.navigateByUrl('/login');
      return;
    }

    const updated = article.is_favorited
      ? await this.articles.unfavoriteArticle(article.id)
      : await this.articles.favoriteArticle(article.id);

    this.article.set(updated);
  }

  private async loadArticle(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      await this.router.navigateByUrl('/');
      return;
    }

    try {
      this.article.set(await this.articles.getArticle(id));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Nie udalo sie pobrac artykulu.');
    }
  }
}
