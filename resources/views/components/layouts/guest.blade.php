<!DOCTYPE html> {{-- Documento HTML5 --}}
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"> {{-- Define el idioma de la página --}}
<head>
    <meta charset="utf-8"> {{-- Configura la codificación --}}
    <meta name="viewport" content="width=device-width, initial-scale=1"> {{-- Hace la vista responsive --}}
    <title>{{ config('app.name', 'Laravel') }}</title> {{-- Título por defecto --}}
    @vite(['resources/css/app.css', 'resources/js/app.js']) {{-- Archivos compilados por Vite --}}
</head>
<body class="min-h-screen flex items-center justify-center bg-gray-100"> {{-- Centra el contenido en la pantalla --}}
    {{ $slot }} {{-- Aquí se renderizará el contenido de la vista hija --}}
</body>
</html>
