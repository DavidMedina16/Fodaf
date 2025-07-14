<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Seeder;

final class LoanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener usuarios que no sean administradores para solicitar préstamos
        $users = User::whereDoesntHave('roles', function ($query) {
            $query->where('name', 'Administrador');
        })->get();

        if ($users->isEmpty()) {
            return;
        }

        // Solo crear préstamos si no existen ya
        if (Loan::count() > 0) {
            return;
        }

        // Crear préstamos para algunos usuarios
        $loanUsers = $users->random(min(5, $users->count()));
        
        foreach ($loanUsers as $user) {
            // Crear 1-3 préstamos por usuario
            for ($i = 0; $i < rand(1, 3); $i++) {
                Loan::create([
                    'requested_by' => $user->id,
                    'quantity' => rand(100000, 500000), // Entre 100,000 y 500,000
                    'created_at' => now()->subDays(rand(1, 60)), // Préstamos de los últimos 60 días
                    'updated_at' => now()->subDays(rand(1, 60))
                ]);
            }
        }

        // Crear algunos préstamos más recientes
        $recentLoanUsers = $users->random(min(3, $users->count()));
        foreach ($recentLoanUsers as $user) {
            Loan::create([
                'requested_by' => $user->id,
                'quantity' => rand(80000, 300000),
                'created_at' => now()->subDays(rand(1, 14)), // Préstamos de las últimas 2 semanas
                'updated_at' => now()->subDays(rand(1, 14))
            ]);
        }
    }
} 