<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    {{-- Script para abrir y cerrar el sidebar en pantallas pequeñas --}}
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const button = document.getElementById('sidebar-toggle');
            const sidebar = document.getElementById('sidebar');
            if (button && sidebar) {
                button.addEventListener('click', () => {
                    sidebar.classList.toggle('-translate-x-full');
                });
            }

            // Modal functionality
            const userMenuButton = document.getElementById('user-menu-button');
            const userMenuModal = document.getElementById('user-menu-modal');
            const closeModalButton = document.getElementById('close-modal');

            if (userMenuButton && userMenuModal) {
                userMenuButton.addEventListener('click', () => {
                    userMenuModal.classList.remove('hidden');
                });
            }

            if (closeModalButton && userMenuModal) {
                closeModalButton.addEventListener('click', () => {
                    userMenuModal.classList.add('hidden');
                });
            }

            // Close modal when clicking outside
            if (userMenuModal) {
                userMenuModal.addEventListener('click', (e) => {
                    if (e.target === userMenuModal) {
                        userMenuModal.classList.add('hidden');
                    }
                });
            }
        });
    </script>
</head>
<body class="flex min-h-screen bg-gray-100">
    {{-- Barra lateral colapsable y elegante --}}
    <aside id="sidebar" class="group bg-gray-800 text-white w-64 md:w-16 md:hover:w-64 -translate-x-full md:translate-x-0 fixed inset-y-0 left-0 transition-all duration-300 ease-in-out overflow-hidden z-20 flex flex-col">
        {{-- Header del sidebar --}}
        <div class="flex items-center justify-center h-16 font-bold text-lg">
            <span class="hidden md:group-hover:inline">FODAF</span>
            <span class="md:hidden">FODAF</span>
        </div>
        
        {{-- Navegación principal --}}
        <nav class="flex-1">
            <ul class="mt-5">
                <li>
                    <a href="{{ route('dashboard') }}" class="flex items-center px-4 py-3 hover:bg-gray-700 {{ request()->routeIs('dashboard') ? 'bg-gray-700' : '' }}">
                        {{-- Icono de inicio --}}
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                        <span class="ml-3 hidden md:group-hover:inline">Dashboard</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('socios.index') }}" class="flex items-center px-4 py-3 hover:bg-gray-700 {{ request()->routeIs('socios.*') ? 'bg-gray-700' : '' }}">
                        {{-- Icono de socios --}}
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                        <span class="ml-3 hidden md:group-hover:inline">Socios</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('loans.index') }}" class="flex items-center px-4 py-3 hover:bg-gray-700 {{ request()->routeIs('loans.*') ? 'bg-gray-700' : '' }}">
                        {{-- Icono de préstamos --}}
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span class="ml-3 hidden md:group-hover:inline">Préstamos</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('reports.index') }}" class="flex items-center px-4 py-3 hover:bg-gray-700 {{ request()->routeIs('reports.*') ? 'bg-gray-700' : '' }}">
                        {{-- Icono de reportes --}}
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                        </svg>
                        <span class="ml-3 hidden md:group-hover:inline">Reportes</span>
                    </a>
                </li>
                <li>
                    <a href="#" class="flex items-center px-4 py-3 hover:bg-gray-700">
                        {{-- Icono de configuraciones --}}
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        <span class="ml-3 hidden md:group-hover:inline">Configuraciones</span>
                    </a>
                </li>
            </ul>
        </nav>

        {{-- Información del usuario en la parte inferior del sidebar --}}
        @auth
        <div class="border-t border-gray-700 mt-auto">
            <button id="user-menu-button" class="w-full flex items-center px-4 py-3 hover:bg-gray-700 transition-colors group">
                <div class="flex-shrink-0">
                    <img class="w-8 h-8 rounded-full" src="{{ auth()->user()->profile_image_url }}" alt="{{ auth()->user()->name }}">
                </div>
                <div class="flex-1 min-w-0 hidden md:group-hover:block">
                    <p class="text-sm font-medium text-white truncate">{{ auth()->user()->name }}</p>
                    <p class="text-xs text-gray-300 truncate">{{ auth()->user()->email }}</p>
                </div>
                <svg class="w-4 h-4 text-gray-400 hidden md:group-hover:block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
        </div>
        @endauth
    </aside>

    {{-- Modal del menú de usuario --}}
    <div id="user-menu-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            {{-- Header del modal --}}
            <div class="flex items-center justify-between p-4 border-b">
                <h3 class="text-lg font-semibold text-gray-900">Menú de Usuario</h3>
                <button id="close-modal" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {{-- Información del usuario --}}
            <div class="p-4 border-b">
                <div class="flex items-center space-x-3">
                    <img class="w-12 h-12 rounded-full" src="{{ auth()->user()->profile_image_url }}" alt="{{ auth()->user()->name }}">
                    <div>
                        <p class="text-sm font-medium text-gray-900">{{ auth()->user()->name }}</p>
                        <p class="text-sm text-gray-500">{{ auth()->user()->email }}</p>
                        <div class="flex flex-wrap gap-1 mt-1">
                            @foreach(auth()->user()->roles as $role)
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{{ $role->name }}</span>
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>

            {{-- Opciones del menú --}}
            <div class="p-2">
                <a href="{{ route('profile.edit') }}" class="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <svg class="w-5 h-5 mr-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Editar Perfil
                </a>
                
                <form method="POST" action="{{ route('logout') }}" class="mt-1">
                    @csrf
                    <button type="submit" class="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors">
                        <svg class="w-5 h-5 mr-3 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Cerrar Sesión
                    </button>
                </form>
            </div>
        </div>
    </div>

    {{-- Contenedor principal de la aplicación --}}
    <div class="flex-1 flex flex-col ml-0 md:ml-16">
        <header class="bg-white shadow p-4 md:hidden">
            <button id="sidebar-toggle" class="text-gray-600">
                &#9776;
            </button>
        </header>
        <main class="p-6">
            {{-- Mensajes de éxito/error --}}
            @if(session('success'))
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {{ session('success') }}
                </div>
            @endif

            @if(session('error'))
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {{ session('error') }}
                </div>
            @endif

            {{ $slot }}
        </main>
    </div>
</body>
</html>
