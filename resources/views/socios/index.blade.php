<x-layouts.app> {{-- Usamos el layout principal de la aplicación --}}
    {{-- Botones para agregar un nuevo socio y acceder a la junta directiva --}}
    <div class="mb-6 flex justify-end space-x-2"> {{-- Contenedor de los botones alineados a la derecha --}}
        <a href="{{ route('register') }}" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Agregar Socio</a> {{-- Enlace para registrar a un nuevo socio --}}
        <a href="#" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Junta Directiva</a> {{-- Enlace para ver la junta directiva --}}
    </div>

    {{-- Listado de socios a manera de tarjetas --}}
    <div class="grid gap-6 md:grid-cols-3"> {{-- Grid responsiva para acomodar las tarjetas --}}
        @foreach ($usuarios as $usuario) {{-- Recorremos cada usuario que recibimos del controlador --}}
            <div class="bg-white p-4 rounded shadow text-center"> {{-- Tarjeta individual del socio --}}
                <img src="https://via.placeholder.com/150" alt="Foto de {{ $usuario->name }}" class="w-32 h-32 mx-auto rounded-full mb-4"> {{-- Fotografía del socio --}}
                <h3 class="text-lg font-semibold">{{ $usuario->name }}</h3> {{-- Mostramos el nombre del socio --}}
                <p class="text-gray-500">{{ $usuario->roles->pluck('name')->implode(', ') ?: 'Sin rol' }}</p> {{-- Mostramos sus roles o "Sin rol" si no tiene --}}
            </div>
        @endforeach {{-- Fin del recorrido de usuarios --}}
    </div>
</x-layouts.app>
