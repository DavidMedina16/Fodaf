<x-layouts.app>
    {{-- Mensajes de éxito --}}
    @if(session('success'))
        <div class="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {{ session('success') }}
        </div>
    @endif

    {{-- Barra de búsqueda --}}
    <form method="GET" action="{{ route('socios.index') }}" class="mb-6 flex justify-between">
        <input type="text" name="search" placeholder="Buscar socio..." value="{{ request('search') }}"
               class="px-4 py-2 border rounded w-full max-w-md">
        <button type="submit" class="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Buscar</button>
    </form>

    {{-- Listado de socios --}}
    <div class="grid gap-6 md:grid-cols-3">
        @forelse ($usuarios as $usuario)
            <a href="{{ route('socios.edit', $usuario) }}" 
               class="bg-white p-4 rounded shadow text-center hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                <img src="{{ $usuario->profile_image_url }}" alt="Foto de {{ $usuario->name }}"
                     class="w-32 h-32 mx-auto rounded-full mb-4 group-hover:scale-105 transition-transform duration-200">
                <h3 class="text-lg font-semibold group-hover:text-blue-600 transition-colors">{{ $usuario->name }}</h3>
                <p class="text-gray-500">{{ $usuario->roles->pluck('name')->implode(', ') ?: 'Sin rol' }}</p>
                <p class="text-gray-400 text-sm">{{ $usuario->email }}</p>
                <div class="mt-4 text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Hacer clic para editar
                </div>
            </a>
        @empty
            <p class="col-span-3 text-center text-gray-500">No se encontraron socios.</p>
        @endforelse
    </div>

    {{-- Paginación --}}
{{--    <div class="mt-6">--}}
{{--        {{ $usuarios->links() }}--}}
{{--    </div>--}}
</x-layouts.app>
