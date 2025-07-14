<x-layouts.app>
    {{-- Barra de búsqueda --}}
    <form method="GET" action="{{ route('socios.index') }}" class="mb-6 flex justify-between">
        <input type="text" name="search" placeholder="Buscar socio..." value="{{ request('search') }}"
               class="px-4 py-2 border rounded w-full max-w-md">
        <button type="submit" class="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Buscar</button>
    </form>

    {{-- Listado de socios --}}
    <div class="grid gap-6 md:grid-cols-3">
        @forelse ($usuarios as $usuario)
            <div class="bg-white p-4 rounded shadow text-center">
                <img src="{{ $usuario->photo_url ?? 'https://via.placeholder.com/150' }}" alt="Foto de {{ $usuario->name }}"
                     class="w-32 h-32 mx-auto rounded-full mb-4">
                <h3 class="text-lg font-semibold">{{ $usuario->name }}</h3>
                <p class="text-gray-500">{{ $usuario->roles->pluck('name')->implode(', ') ?: 'Sin rol' }}</p>
                <p class="text-gray-400 text-sm">{{ $usuario->email }}</p>
{{--                <div class="mt-4 flex justify-center space-x-2">--}}
{{--                    <a href="{{ route('socios.edit', $usuario) }}" class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Editar</a>--}}
{{--                    <form method="POST" action="{{ route('socios.destroy', $usuario) }}">--}}
{{--                        @csrf--}}
{{--                        @method('DELETE')--}}
{{--                        <button type="submit" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>--}}
{{--                    </form>--}}
{{--                </div>--}}
            </div>
        @empty
            <p class="col-span-3 text-center text-gray-500">No se encontraron socios.</p>
        @endforelse
    </div>

    {{-- Paginación --}}
{{--    <div class="mt-6">--}}
{{--        {{ $usuarios->links() }}--}}
{{--    </div>--}}
</x-layouts.app>
