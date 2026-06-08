import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { AuthService } from '../../services/auth.service';
import { formatArticleBody } from '../../utils/article-formatting';

@Component({
  selector: 'app-add-article',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-article.html',
  styleUrl: './add-article.scss',
})
export class AddArticle implements OnInit {
  @ViewChild('bodyInput')
  protected bodyInput?: ElementRef<HTMLTextAreaElement>;

  protected readonly isReady = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly imagePreview = signal('');

  protected articleId: number | null = null;
  protected title = '';
  protected section = 'Media';
  protected excerpt = '';
  protected body = '';
  protected tagsInput = '';
  protected status: 'draft' | 'published' = 'published';

  private imageFile: File | null = null;
  private readonly auth = inject(AuthService);
  private readonly articles = inject(ArticleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.loadPage();
  }

  protected get isEditing(): boolean {
    return this.articleId !== null;
  }

  protected get renderedPreview(): string {
    return formatArticleBody(this.body);
  }

  protected onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.imageFile = file;
    this.imagePreview.set(file ? URL.createObjectURL(file) : this.imagePreview());
  }

  protected insertFormat(kind: 'h2' | 'bold' | 'italic' | 'quote' | 'list' | 'link'): void {
    const snippets: Record<typeof kind, string> = {
      h2: '## Naglowek sekcji\n',
      bold: '**pogrubiony tekst**\n',
      italic: '*kursywa*\n',
      quote: '> Cytat lub wazna mysl\n',
      list: '- pierwszy punkt\n- drugi punkt\n',
      link: '[tekst linku](https://example.com)\n',
    };

    const separator = this.body && !this.body.endsWith('\n') ? '\n' : '';
    this.body += `${separator}${snippets[kind]}`;
    queueMicrotask(() => this.bodyInput?.nativeElement.focus());
  }

  protected async saveArticle(): Promise<void> {
    this.error.set('');
    this.message.set('');
    this.isSaving.set(true);

    try {
      const payload = {
        title: this.title,
        section: this.section,
        excerpt: this.excerpt,
        body: this.body,
        tags: this.tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
        status: this.status,
        image: this.imageFile,
      };

      if (this.articleId) {
        await this.articles.updateArticle(this.articleId, payload);
      } else {
        await this.articles.createArticle(payload);
      }

      this.message.set(this.articleId ? 'Artykul zaktualizowany.' : 'Artykul dodany.');
      await this.router.navigateByUrl('/my-articles');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Nie udalo sie zapisac artykulu.');
    } finally {
      this.isSaving.set(false);
    }
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

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(id) && id > 0) {
      this.articleId = id;
      const article = await this.articles.getArticle(id);
      if (!article.can_edit) {
        await this.router.navigateByUrl('/my-articles');
        return;
      }

      this.title = article.title;
      this.section = article.section;
      this.excerpt = article.excerpt ?? '';
      this.body = article.body;
      this.tagsInput = article.tags.join(', ');
      this.status = article.status;
      this.imagePreview.set(article.image_url ?? '');
    }

    this.isReady.set(true);
  }
}
