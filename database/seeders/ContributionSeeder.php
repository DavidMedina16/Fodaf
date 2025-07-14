<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Contribution;
use App\Models\User;
use Illuminate\Database\Seeder;

final class ContributionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener usuarios que no sean administradores para las contribuciones
        $users = User::whereDoesntHave('roles', function ($query) {
            $query->where('name', 'Administrador');
        })->get();

        $adminUser = User::whereHas('roles', function ($query) {
            $query->where('name', 'Administrador');
        })->first();

        if ($users->isEmpty() || !$adminUser) {
            return;
        }

        // Solo crear contribuciones si no existen ya
        if (Contribution::count() > 0) {
            return;
        }

        // Crear contribuciones para cada usuario
        foreach ($users as $user) {
            // Crear múltiples contribuciones por usuario
            for ($i = 0; $i < rand(3, 8); $i++) {
                Contribution::create([
                    'user_id' => $user->id,
                    'quantity' => rand(50000, 200000), // Entre 50,000 y 200,000
                    'created_by' => $adminUser->id,
                    'created_at' => now()->subDays(rand(1, 90)), // Contribuciones de los últimos 90 días
                    'updated_at' => now()->subDays(rand(1, 90))
                ]);
            }
        }

        // Crear algunas contribuciones más recientes
        $recentUsers = $users->random(min(5, $users->count()));
        foreach ($recentUsers as $user) {
            Contribution::create([
                'user_id' => $user->id,
                'quantity' => rand(30000, 150000),
                'created_by' => $adminUser->id,
                'created_at' => now()->subDays(rand(1, 7)), // Contribuciones de la última semana
                'updated_at' => now()->subDays(rand(1, 7))
            ]);
        }
    }
} 