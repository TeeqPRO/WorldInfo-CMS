import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { AuthService } from '../../services/auth.service';
import { Article, ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, AfterViewInit {
  @ViewChild('topbar', { static: true })
  protected topbarRef!: ElementRef<HTMLElement>;

  protected isScrolled = false;
  protected readonly isMenuOpen = signal(false);
  protected readonly articles = signal<Article[]>([]);
  protected readonly isLoadingArticles = signal(false);
  protected readonly articleError = signal('');
  protected readonly activeTag = signal('');
  protected readonly heroArticle = computed(() => this.articles()[0] ?? null);
  protected readonly gridArticles = computed(() => this.articles().slice(1, 5));
  protected searchQuery = '';

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly articleService = inject(ArticleService);
  protected readonly currentUser = this.auth.currentUser;

  private hasAnimatedIn = false;
  private hasAnimatedArticles = false;

  ngOnInit(): void {
    void this.auth.restoreSession();
    void this.loadArticles();
  }

  ngAfterViewInit(): void {
    if (this.hasAnimatedIn) {
      return;
    }

    this.hasAnimatedIn = true;
    gsap.from('.topbar, .breaking', {
      y: -24,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
    });

    this.animateTopbar();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrolled = window.scrollY > 40;
    if (scrolled === this.isScrolled) {
      return;
    }

    this.isScrolled = scrolled;
    this.animateTopbar();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeMenu();
  }

  protected goToLogin(): void {
    const target = this.currentUser() ? '/profile' : '/login';
    void this.router.navigateByUrl(target);
  }

  protected goToProfile(): void {
    void this.router.navigateByUrl('/profile');
  }

  protected goToFavorites(): void {
    void this.router.navigateByUrl('/favorites');
  }

  protected toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected get canManageArticles(): boolean {
    const role = this.currentUser()?.role;
    return role === 'journalist' || role === 'admin';
  }

  protected navigateFromMenu(path: string, authRequired = true): void {
    this.closeMenu();
    if (authRequired && !this.currentUser()) {
      void this.router.navigateByUrl('/login');
      return;
    }

    void this.router.navigateByUrl(path);
  }

  protected async searchArticles(): Promise<void> {
    this.activeTag.set('');
    await this.loadArticles();
  }

  protected async filterByTag(tag: string): Promise<void> {
    this.activeTag.set(this.activeTag() === tag ? '' : tag);
    await this.loadArticles();
  }

  protected async toggleFavorite(article: Article, event: Event): Promise<void> {
    event.stopPropagation();
    if (!this.currentUser()) {
      await this.router.navigateByUrl('/login');
      return;
    }

    try {
      const updated = article.is_favorited
        ? await this.articleService.unfavoriteArticle(article.id)
        : await this.articleService.favoriteArticle(article.id);

      this.articles.update((articles) => articles.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      this.articleError.set(this.getErrorMessage(error));
    }
  }

  protected openArticle(article: Article): void {
    void this.router.navigateByUrl(`/articles/${article.id}`);
  }

  protected articleImage(article: Article | null): string {
    return article?.image_url || 'assets/images/placeholder.svg';
  }

  protected articleTime(article: Article): string {
    if (!article.created_at) {
      return 'teraz';
    }

    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(article.created_at));
  }

  protected trackByArticleId(_index: number, article: Article): number {
    return article.id;
  }

  private async loadArticles(): Promise<void> {
    this.articleError.set('');
    this.isLoadingArticles.set(true);

    try {
      const articles = await this.articleService.getArticles({
        q: this.searchQuery.trim(),
        tag: this.activeTag(),
      });
      this.articles.set(articles);
      this.scheduleArticleAnimation();
    } catch (error) {
      this.articleError.set(this.getErrorMessage(error));
    } finally {
      this.isLoadingArticles.set(false);
    }
  }

  private animateTopbar(): void {
    const target = this.topbarRef?.nativeElement;
    if (!target) {
      return;
    }

    const scrolled = this.isScrolled;
    const paddingTopBottom = scrolled ? 20 : 16;
    const paddingLeftRight = scrolled ? 32 : 20;
    const radiusValue = scrolled ? 0 : 8;

    gsap.to(target, {
      duration: 0.35,
      ease: 'power2.out',
      paddingTop: paddingTopBottom,
      paddingBottom: paddingTopBottom,
      paddingLeft: paddingLeftRight,
      paddingRight: paddingLeftRight,
      borderRadius: radiusValue,
      boxShadow: scrolled
        ? '0 12px 24px rgba(0, 0, 0, 0.12)'
        : '0 18px 40px rgba(0, 0, 0, 0.08)',
      overwrite: 'auto',
    });
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Wystapil nieoczekiwany blad.';
  }

  private scheduleArticleAnimation(): void {
    if (this.hasAnimatedArticles) {
      return;
    }

    this.hasAnimatedArticles = true;
    requestAnimationFrame(() => this.animateArticleContent());
  }

  private animateArticleContent(): void {
    this.animateIfPresent('.hero-card', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    });

    this.animateIfPresent('.news-card', {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.06,
      ease: 'power2.out',
      delay: 0.1,
    });

    this.animateIfPresent('.side-item', {
      opacity: 0,
      duration: 0.45,
      stagger: 0.05,
      ease: 'power2.out',
      delay: 0.1,
      clearProps: 'opacity',
    });
  }

  private animateIfPresent(selector: string, vars: gsap.TweenVars): void {
    if (!document.querySelector(selector)) {
      return;
    }

    gsap.from(selector, vars);
  }
}
