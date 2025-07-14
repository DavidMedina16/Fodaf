<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Loan;
use App\Models\LoanApprover;
use App\Models\User;
use Illuminate\Database\Seeder;

final class LoanApproverSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener todos los préstamos
        $loans = Loan::all();
        
        if ($loans->isEmpty()) {
            return;
        }

        // Solo crear aprobadores si no existen ya
        if (LoanApprover::count() > 0) {
            return;
        }

        // Obtener usuarios con roles de aprobación (Presidente, Tesorero, Revisor)
        $approvers = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['Presidente', 'Tesorero', 'Revisor']);
        })->get();

        if ($approvers->isEmpty()) {
            return;
        }

        // Para cada préstamo, asignar aprobadores
        foreach ($loans as $loan) {
            // Seleccionar 2-3 aprobadores por préstamo
            $selectedApprovers = $approvers->random(rand(2, min(3, $approvers->count())));
            
            foreach ($selectedApprovers as $approver) {
                // 70% de probabilidad de aprobación
                $isApproved = rand(1, 100) <= 70;
                
                LoanApprover::create([
                    'loan_id' => $loan->id,
                    'user_id' => $approver->id,
                    'is_approved' => $isApproved,
                    'created_at' => $loan->created_at->addDays(rand(1, 7)), // Aprobación 1-7 días después de la solicitud
                    'updated_at' => $loan->created_at->addDays(rand(1, 7))
                ]);
            }
        }

        // Para algunos préstamos recientes, crear aprobaciones pendientes
        $recentLoans = $loans->where('created_at', '>=', now()->subDays(7));
        foreach ($recentLoans as $loan) {
            // Verificar si ya tiene aprobadores
            if ($loan->approvers()->count() === 0) {
                $selectedApprovers = $approvers->random(rand(1, 2));
                
                foreach ($selectedApprovers as $approver) {
                    LoanApprover::create([
                        'loan_id' => $loan->id,
                        'user_id' => $approver->id,
                        'is_approved' => false, // Pendiente de aprobación
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }
        }
    }
} 