<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::view('/login', 'auth.login')->name('login'); // Muestra el formulario de inicio de sesión
Route::view('/register', 'auth.register')->name('register'); // Muestra el formulario de registro
