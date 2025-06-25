<x-layouts.guest> {{-- Usa el layout para invitados --}}
    <form method="POST" action="{{ route('register.submit') }}" class="w-full max-w-sm bg-white p-6 rounded shadow"> {{-- Inicio del formulario --}}
        @csrf {{-- Protección CSRF --}}
        <h1 class="text-2xl font-semibold mb-6 text-center">Registro</h1> {{-- Título del formulario --}}
        <div class="mb-4"> {{-- Grupo para el nombre --}}
            <label class="block text-sm mb-1" for="name">Nombre</label> {{-- Etiqueta del nombre --}}
            <input id="name" name="name" type="text" required autofocus
                class="w-full px-3 py-2 border rounded" /> {{-- Campo para el nombre --}}
        </div>
        <div class="mb-4"> {{-- Grupo para el correo --}}
            <label class="block text-sm mb-1" for="email">Correo electrónico</label> {{-- Etiqueta del email --}}
            <input id="email" name="email" type="email" required
                class="w-full px-3 py-2 border rounded" /> {{-- Campo para el email --}}
        </div>
        <div class="mb-6"> {{-- Grupo de la contraseña --}}
            <label class="block text-sm mb-1" for="password">Contraseña</label> {{-- Etiqueta de la contraseña --}}
            <input id="password" name="password" type="password" required
                class="w-full px-3 py-2 border rounded" /> {{-- Campo para la contraseña --}}
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Crear cuenta</button> {{-- Botón para enviar el formulario --}}
        <p class="mt-4 text-center text-sm"> {{-- Enlace hacia el inicio de sesión --}}
            ¿Ya tienes cuenta? <a class="text-blue-600 hover:underline" href="{{ route('login') }}">Inicia sesión</a>
        </p>
    </form>
</x-layouts.guest> {{-- Fin del layout --}}
