<?php // Configuración de la aplicación Laravel

use Illuminate\Foundation\Application; // Núcleo de la aplicación
use Illuminate\Foundation\Configuration\Exceptions; // Manejo de excepciones
use Illuminate\Foundation\Configuration\Middleware; // Manejo de middleware

return Application::configure(basePath: dirname(__DIR__)) // Creamos la aplicación indicando la ruta base
    ->withRouting( // Registramos las rutas
        api: __DIR__.'/../routes/api.php', // Ruta del archivo de rutas API
        web: __DIR__.'/../routes/web.php', // Ruta del archivo de rutas web
        commands: __DIR__.'/../routes/console.php', // Ruta de las rutas para comandos Artisan
        health: '/up', // Ruta para chequeos de salud
    )
    ->withMiddleware(function (Middleware $middleware) { // Configuración de middleware
        //
    })
    ->withExceptions(function (Exceptions $exceptions) { // Configuración de excepciones
        //
    })->create(); // Devuelve la instancia de la aplicación
