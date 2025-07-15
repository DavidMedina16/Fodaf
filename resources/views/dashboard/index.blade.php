<x-layouts.app>
    <div class="space-y-6">
        <!-- Header del Dashboard -->
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p class="text-gray-600">Bienvenido al panel de control de FODAF</p>
            </div>
            <div class="text-sm text-gray-500">
                {{ now()->format('d/m/Y H:i') }}
            </div>
        </div>

        <!-- Tarjetas de Estadísticas -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Total de Usuarios -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total Usuarios</p>
                        <p class="text-2xl font-semibold text-gray-900">{{ number_format($stats['total_users']) }}</p>
                    </div>
                </div>
            </div>

            <!-- Total de Contribuciones -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100 text-green-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total Contribuciones</p>
                        <p class="text-2xl font-semibold text-gray-900">${{ number_format($stats['total_contribution_amount']) }}</p>
                    </div>
                </div>
            </div>

            <!-- Total de Préstamos -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total Préstamos</p>
                        <p class="text-2xl font-semibold text-gray-900">${{ number_format($stats['total_loan_amount']) }}</p>
                    </div>
                </div>
            </div>

            <!-- Préstamos Pendientes -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-red-100 text-red-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Pendientes</p>
                        <p class="text-2xl font-semibold text-gray-900">{{ $stats['pending_loans'] }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contenido Principal -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Contribuciones Recientes -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">Contribuciones Recientes</h3>
                </div>
                <div class="p-6">
                    @if($recent_contributions->count() > 0)
                        <div class="space-y-4">
                            @foreach($recent_contributions as $contribution)
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-900">{{ $contribution->user->name }}</p>
                                        <p class="text-sm text-gray-500">{{ $contribution->created_at->format('d/m/Y H:i') }}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm font-medium text-green-600">${{ number_format($contribution->quantity) }}</p>
                                        <p class="text-xs text-gray-500">por {{ $contribution->creator->name }}</p>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <p class="text-gray-500 text-center py-4">No hay contribuciones recientes</p>
                    @endif
                </div>
            </div>

            <!-- Préstamos Recientes -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">Préstamos Recientes</h3>
                </div>
                <div class="p-6">
                    @if($recent_loans->count() > 0)
                        <div class="space-y-4">
                            @foreach($recent_loans as $loan)
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-900">{{ $loan->requester->name }}</p>
                                        <p class="text-sm text-gray-500">{{ $loan->created_at->format('d/m/Y H:i') }}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm font-medium text-yellow-600">${{ number_format($loan->quantity) }}</p>
                                        <p class="text-xs text-gray-500">
                                            @if($loan->approvers->where('is_approved', true)->count() > 0)
                                                <span class="text-green-600">Aprobado</span>
                                            @elseif($loan->approvers->where('is_approved', false)->count() > 0)
                                                <span class="text-red-600">Rechazado</span>
                                            @else
                                                <span class="text-yellow-600">Pendiente</span>
                                            @endif
                                        </p>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <p class="text-gray-500 text-center py-4">No hay préstamos recientes</p>
                    @endif
                </div>
            </div>
        </div>

        <!-- Top Contribuyentes -->
        <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Top Contribuyentes</h3>
            </div>
            <div class="p-6">
                @if($top_contributors->count() > 0)
                    <div class="space-y-4">
                        @foreach($top_contributors as $index => $user)
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                        {{ $index + 1 }}
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm font-medium text-gray-900">{{ $user->name }}</p>
                                        <p class="text-sm text-gray-500">{{ $user->email }}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-medium text-green-600">${{ number_format($user->contributions_sum_quantity ?? 0) }}</p>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @else
                    <p class="text-gray-500 text-center py-4">No hay datos de contribuyentes</p>
                @endif
            </div>
        </div>

        <!-- Préstamos Pendientes de Aprobación -->
        @if($pending_approvals->count() > 0)
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">Préstamos Pendientes de Aprobación</h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        @foreach($pending_approvals as $loan)
                            <div class="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                                <div>
                                    <p class="text-sm font-medium text-gray-900">{{ $loan->requester->name }}</p>
                                    <p class="text-sm text-gray-500">Solicitado: {{ $loan->created_at->format('d/m/Y H:i') }}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-medium text-yellow-600">${{ number_format($loan->quantity) }}</p>
                                    <a href="{{ route('loans.show', $loan) }}" class="text-xs text-blue-600 hover:underline">Ver detalles</a>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        @endif
    </div>
</x-layouts.app> 