<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController; // Controlador de autenticación

Route::get('/', function () {
    return view('welcome');
});

Route::view('/login', 'auth.login')->name('login'); // Muestra el formulario de inicio de sesión
Route::post('/login', [AuthController::class, 'login'])->name('login.submit'); // Procesa el inicio de sesión

Route::view('/register', 'auth.register')->name('register'); // Muestra el formulario de registro
Route::post('/register', [AuthController::class, 'register'])->name('register.submit'); // Procesa el registro de usuario

Route::post('/logout', [AuthController::class, 'logout'])->name('logout'); // Cierra la sesión

// Ruta protegida que muestra la página de inicio
Route::view('/home', 'home')->middleware('auth')->name('home');
