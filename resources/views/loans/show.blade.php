<x-layouts.app>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Detalle del Préstamo</h1>
                <p class="text-gray-600">Información completa del préstamo #{{ $loan->id }}</p>
            </div>
            <div class="flex space-x-3">
                <a href="{{ route('loans.edit', $loan) }}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Editar
                </a>
                <a href="{{ route('loans.index') }}" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    Volver
                </a>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Información del Préstamo -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">Información del Préstamo</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-500">ID del Préstamo:</span>
                        <span class="text-sm text-gray-900">#{{ $loan->id }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-500">Solicitante:</span>
                        <span class="text-sm text-gray-900">{{ $loan->requester->name }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-500">Email:</span>
                        <span class="text-sm text-gray-900">{{ $loan->requester->email }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-500">Monto:</span>
                        <span class="text-sm font-semibold text-gray-900">${{ number_format($loan->quantity) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-500">Fecha de Solicitud:</span>
                        <span class="text-sm text-gray-900">{{ $loan->created_at->format('d/m/Y H:i') }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-500">Última Actualización:</span>
                        <span class="text-sm text-gray-900">{{ $loan->updated_at->format('d/m/Y H:i') }}</span>
                    </div>
                </div>
            </div>

            <!-- Estado del Préstamo -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">Estado del Préstamo</h3>
                </div>
                <div class="p-6">
                    @if($loan->approvers->where('is_approved', true)->count() > 0)
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <svg class="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-medium text-green-800">Aprobado</h3>
                                <p class="text-sm text-green-600">El préstamo ha sido aprobado por los aprobadores correspondientes.</p>
                            </div>
                        </div>
                    @elseif($loan->approvers->where('is_approved', false)->count() > 0)
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <svg class="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-medium text-red-800">Rechazado</h3>
                                <p class="text-sm text-red-600">El préstamo ha sido rechazado por uno o más aprobadores.</p>
                            </div>
                        </div>
                    @else
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <svg class="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-medium text-yellow-800">Pendiente de Aprobación</h3>
                                <p class="text-sm text-yellow-600">El préstamo está esperando la aprobación de los responsables.</p>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>

        <!-- Aprobadores -->
        <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Aprobadores</h3>
            </div>
            <div class="p-6">
                @if($loan->approvers->count() > 0)
                    <div class="space-y-4">
                        @foreach($loan->approvers as $approver)
                            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span class="text-sm font-medium text-gray-600">
                                            {{ substr($approver->user->name, 0, 1) }}
                                        </span>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-900">{{ $approver->user->name }}</p>
                                        <p class="text-sm text-gray-500">{{ $approver->user->email }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center">
                                    @if($approver->is_approved === null)
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Pendiente
                                        </span>
                                    @elseif($approver->is_approved)
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Aprobado
                                        </span>
                                    @else
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Rechazado
                                        </span>
                                    @endif
                                </div>
                            </div>
                        @endforeach
                    </div>
                @else
                    <p class="text-gray-500 text-center py-4">No hay aprobadores asignados a este préstamo.</p>
                @endif
            </div>
        </div>

        <!-- Acciones de Aprobación (solo para aprobadores) -->
        @if(auth()->user()->roles->whereIn('name', ['Presidente', 'Tesorero', 'Revisor'])->count() > 0)
            @php
                $userApproval = $loan->approvers->where('user_id', auth()->id())->first();
            @endphp
            
            @if($userApproval && $userApproval->is_approved === null)
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">Mi Decisión</h3>
                    </div>
                    <div class="p-6">
                        <form action="{{ route('loans.approve', $loan) }}" method="POST" class="flex space-x-4">
                            @csrf
                            <input type="hidden" name="is_approved" value="1">
                            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Aprobar
                            </button>
                        </form>
                        
                        <form action="{{ route('loans.approve', $loan) }}" method="POST" class="mt-4">
                            @csrf
                            <input type="hidden" name="is_approved" value="0">
                            <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                                Rechazar
                            </button>
                        </form>
                    </div>
                </div>
            @endif
        @endif
    </div>
</x-layouts.app> 