<?php // Archivo de rutas para la API

use Illuminate\Support\Facades\Route; // Facade para definir rutas
use App\Http\Controllers\UserController; // Controlador de usuarios
use App\Http\Controllers\RoleController; // Controlador de roles
use App\Http\Controllers\ContributionController; // Controlador de contribuciones

Route::apiResource('users', UserController::class); // CRUD de usuarios
Route::apiResource('roles', RoleController::class); // CRUD de roles
Route::apiResource('contributions', ContributionController::class); // CRUD de contribuciones
