<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    {{-- Script sencillo para mostrar u ocultar el sidebar --}}
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const button = document.getElementById('sidebar-toggle');
            const sidebar = document.getElementById('sidebar');
            if (button && sidebar) {
                button.addEventListener('click', function () {
                    sidebar.classList.toggle('-translate-x-full');
                });
            }
        });
    </script>
</head>
<body class="flex min-h-screen bg-gray-100">
    {{-- Barra lateral colapsable --}}
    <aside id="sidebar" class="bg-gray-800 text-white w-64 transform md:translate-x-0 -translate-x-full transition-transform duration-200 ease-in-out fixed md:relative inset-y-0 left-0">
        <div class="p-4 font-bold text-lg">Menú</div>
        <nav class="mt-5">
            <ul>
                <li class="px-4 py-2 hover:bg-gray-700"><a href="#">Dashboard</a></li>
                <li class="px-4 py-2 hover:bg-gray-700"><a href="#">Socios</a></li>
                <li class="px-4 py-2 hover:bg-gray-700"><a href="#">Prestamos</a></li>
                <li class="px-4 py-2 hover:bg-gray-700"><a href="#">Reportes</a></li>
                <li class="px-4 py-2 hover:bg-gray-700"><a href="#">Configuraciones</a></li>
            </ul>
        </nav>
    </aside>

    {{-- Contenedor principal de la aplicación --}}
    <div class="flex-1 flex flex-col ml-0 md:ml-64">
        <header class="bg-white shadow p-4 md:hidden">
            <button id="sidebar-toggle" class="text-gray-600">
                &#9776;
            </button>
        </header>
        <main class="p-6">
            {{ $slot }}
        </main>
    </div>
</body>
</html>
