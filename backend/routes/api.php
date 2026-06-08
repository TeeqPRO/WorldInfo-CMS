<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('api.auth');
    Route::get('me', [AuthController::class, 'me'])->middleware('api.auth');
});

Route::middleware('api.auth')->group(function () {
    Route::post('profile', [ProfileController::class, 'update']);
    Route::put('profile', [ProfileController::class, 'update']);
    Route::get('articles/manage', [ArticleController::class, 'manage']);
    Route::post('articles', [ArticleController::class, 'store']);
    Route::post('articles/{article}', [ArticleController::class, 'update']);
    Route::delete('articles/{article}', [ArticleController::class, 'destroy']);
    Route::get('favorites', [ArticleController::class, 'favorites']);
    Route::post('articles/{article}/favorite', [ArticleController::class, 'favorite']);
    Route::delete('articles/{article}/favorite', [ArticleController::class, 'unfavorite']);
});

Route::get('articles', [ArticleController::class, 'index']);
Route::get('articles/{article}', [ArticleController::class, 'show']);

Route::middleware(['api.auth', 'api.admin'])->group(function () {
    Route::get('admin/users', [AdminUserController::class, 'index']);
    Route::put('admin/users/{user}/role', [AdminUserController::class, 'updateRole']);
});
