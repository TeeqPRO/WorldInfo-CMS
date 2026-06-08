import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
    { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
    { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
    { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.Profile) },
    { path: 'favorites', loadComponent: () => import('./pages/favorites/favorites').then(m => m.Favorites) },
    { path: 'my-articles', loadComponent: () => import('./pages/my-articles/my-articles').then(m => m.MyArticles) },
    { path: 'articles/new', loadComponent: () => import('./pages/add-article/add-article').then(m => m.AddArticle) },
    { path: 'articles/:id/edit', loadComponent: () => import('./pages/add-article/add-article').then(m => m.AddArticle) },
    { path: 'articles/:id', loadComponent: () => import('./pages/article-detail/article-detail').then(m => m.ArticleDetail) },
    { path: 'admin', loadComponent: () => import('./pages/admin/admin').then(m => m.Admin) }
];
