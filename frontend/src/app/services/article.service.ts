import { Injectable } from '@angular/core';

export interface Article {
  id: number;
  title: string;
  slug: string;
  section: string;
  excerpt: string | null;
  body: string;
  image_url: string | null;
  tags: string[];
  status: 'draft' | 'published';
  created_at: string | null;
  updated_at: string | null;
  author: {
    id: number;
    name: string;
    role: string;
  };
  can_edit: boolean;
  can_delete: boolean;
  is_favorited: boolean;
}

export interface ArticlePayload {
  title: string;
  section: string;
  excerpt: string;
  body: string;
  tags: string[];
  status: 'draft' | 'published';
  image: File | null;
}

interface ArticleResponse {
  article: Article;
}

interface ArticlesResponse {
  articles: Article[];
}

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private readonly apiBase = 'http://localhost:8000/api';
  private readonly tokenKey = 'worldinfo_token';

  async getArticles(filters: { q?: string; tag?: string } = {}): Promise<Article[]> {
    const params = new URLSearchParams();
    if (filters.q) {
      params.set('q', filters.q);
    }
    if (filters.tag) {
      params.set('tag', filters.tag);
    }

    const suffix = params.toString() ? `?${params}` : '';
    const response = await this.apiRequest<ArticlesResponse>(`/articles${suffix}`, {}, false, true);
    return response.articles;
  }

  async getManageArticles(): Promise<Article[]> {
    const response = await this.apiRequest<ArticlesResponse>('/articles/manage', { method: 'GET' }, true);
    return response.articles;
  }

  async getFavoriteArticles(): Promise<Article[]> {
    const response = await this.apiRequest<ArticlesResponse>('/favorites', { method: 'GET' }, true);
    return response.articles;
  }

  async getArticle(id: number): Promise<Article> {
    const response = await this.apiRequest<ArticleResponse>(`/articles/${id}`, {}, false, true);
    return response.article;
  }

  async createArticle(payload: ArticlePayload): Promise<Article> {
    const response = await this.apiRequest<ArticleResponse>('/articles', {
      method: 'POST',
      body: this.toFormData(payload),
    }, true);
    return response.article;
  }

  async updateArticle(id: number, payload: ArticlePayload): Promise<Article> {
    const response = await this.apiRequest<ArticleResponse>(`/articles/${id}`, {
      method: 'POST',
      body: this.toFormData(payload),
    }, true);
    return response.article;
  }

  async deleteArticle(id: number): Promise<void> {
    await this.apiRequest(`/articles/${id}`, { method: 'DELETE' }, true);
  }

  async favoriteArticle(id: number): Promise<Article> {
    const response = await this.apiRequest<ArticleResponse>(`/articles/${id}/favorite`, { method: 'POST' }, true);
    return response.article;
  }

  async unfavoriteArticle(id: number): Promise<Article> {
    const response = await this.apiRequest<ArticleResponse>(`/articles/${id}/favorite`, { method: 'DELETE' }, true);
    return response.article;
  }

  private toFormData(payload: ArticlePayload): FormData {
    const body = new FormData();
    body.set('title', payload.title);
    body.set('section', payload.section);
    body.set('excerpt', payload.excerpt);
    body.set('body', payload.body);
    body.set('status', payload.status);
    body.set('tags', JSON.stringify(payload.tags));

    if (payload.image) {
      body.set('image', payload.image);
    }

    return body;
  }

  private async apiRequest<T>(
    path: string,
    options: RequestInit = {},
    auth = false,
    attachOptionalToken = false,
  ): Promise<T> {
    const headers = new Headers(options.headers);
    const isFormData = options.body instanceof FormData;
    const token = localStorage.getItem(this.tokenKey);

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (auth) {
      if (!token) {
        throw new Error('Musisz sie zalogowac.');
      }
      headers.set('Authorization', `Bearer ${token}`);
    } else if (attachOptionalToken && token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.apiBase}${path}`, {
      ...options,
      headers,
    });

    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(this.getPayloadMessage(payload));
    }

    return payload as T;
  }

  private getPayloadMessage(payload: unknown): string {
    const body = payload as { message?: string; errors?: Record<string, string[]> };
    const firstErrors = body.errors ? Object.values(body.errors)[0] : null;

    return firstErrors?.[0] || body.message || 'Blad polaczenia z API.';
  }
}
