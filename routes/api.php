<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EntrepriseController;
use App\Http\Controllers\MonEntrepriseController;
use Illuminate\Support\Facades\Route;

// ---- Authentification
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

// ---- Public
Route::get('/filtres', [EntrepriseController::class, 'filters']);
Route::get('/entreprises', [EntrepriseController::class, 'index']);
Route::get('/entreprises/{slug}', [EntrepriseController::class, 'show']);
Route::get('/entreprises/{slug}/avis', [EntrepriseController::class, 'avis']);
Route::post('/entreprises/{slug}/avis', [EntrepriseController::class, 'storeAvis'])->middleware('throttle:6,1');
Route::get('/widget/{slug}', [EntrepriseController::class, 'widget']);

// ---- Espace entreprise et administration (jeton Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/mon-entreprise', [MonEntrepriseController::class, 'show']);
    Route::post('/mon-entreprise', [MonEntrepriseController::class, 'store']);
    Route::put('/mon-entreprise', [MonEntrepriseController::class, 'update']);
    Route::get('/mon-entreprise/avis', [MonEntrepriseController::class, 'avis']);
    Route::get('/mon-entreprise/stats', [MonEntrepriseController::class, 'stats']);
    Route::get('/mon-entreprise/codes', [MonEntrepriseController::class, 'codes']);
    Route::post('/mon-entreprise/codes', [MonEntrepriseController::class, 'genererCodes']);
    Route::post('/avis/{avis}/reponse', [MonEntrepriseController::class, 'reponse']);
    Route::delete('/avis/{avis}/reponse', [MonEntrepriseController::class, 'supprimerReponse']);
    Route::post('/avis/{avis}/signaler', [MonEntrepriseController::class, 'signaler']);

    Route::get('/admin/resume', [AdminController::class, 'resume']);
    Route::get('/admin/avis', [AdminController::class, 'avis']);
    Route::post('/admin/avis/{avis}/moderation', [AdminController::class, 'moderer']);
});
