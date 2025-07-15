<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController; // Controlador de autenticación
use App\Http\Controllers\SocioController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ProfileController;

Route::get('/', function () {
    return view('welcome');
});

Route::view('/login', 'auth.login')->name('login'); // Muestra el formulario de inicio de sesión
Route::post('/login', [AuthController::class, 'login'])->name('login.submit'); // Procesa el inicio de sesión

Route::view('/register', 'auth.register')->name('register'); // Muestra el formulario de registro
Route::post('/register', [AuthController::class, 'register'])->name('register.submit'); // Procesa el registro de usuario

Route::post('/logout', [AuthController::class, 'logout'])->name('logout'); // Cierra la sesión

// Rutas protegidas
Route::middleware('auth')->group(function () {
    // Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/home', [\App\Http\Controllers\DashboardController::class, 'index'])->name('home');
    
    // Socios
    Route::get('/socios', [SocioController::class, 'index'])->name('socios.index');
    Route::get('/socios/{socio}/edit', [SocioController::class, 'edit'])->name('socios.edit');
    Route::put('/socios/{socio}', [SocioController::class, 'update'])->name('socios.update');
    
    // Préstamos
    Route::get('/prestamos', [LoanController::class, 'index'])->name('loans.index');
    Route::get('/prestamos/create', [LoanController::class, 'create'])->name('loans.create');
    Route::post('/prestamos', [LoanController::class, 'store'])->name('loans.store');
    Route::get('/prestamos/{loan}', [LoanController::class, 'show'])->name('loans.show');
    Route::get('/prestamos/{loan}/edit', [LoanController::class, 'edit'])->name('loans.edit');
    Route::put('/prestamos/{loan}', [LoanController::class, 'update'])->name('loans.update');
    Route::delete('/prestamos/{loan}', [LoanController::class, 'destroy'])->name('loans.destroy');
    Route::post('/prestamos/{loan}/approve', [LoanController::class, 'approve'])->name('loans.approve');
    
    // Reportes
    Route::get('/reportes', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reportes/contribuciones', [ReportController::class, 'contributions'])->name('reports.contributions');
    Route::get('/reportes/prestamos', [ReportController::class, 'loans'])->name('reports.loans');
    Route::get('/reportes/financiero', [ReportController::class, 'financial'])->name('reports.financial');

    // Perfil
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
});
