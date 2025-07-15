<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Contribution;
use App\Models\Loan;
use App\Models\LoanApprover;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class DashboardController extends Controller
{
    public function index(): View
    {
        // Estadísticas generales
        $stats = [
            'total_users' => User::count(),
            'total_contributions' => Contribution::count(),
            'total_loans' => Loan::count(),
            'pending_loans' => Loan::whereDoesntHave('approvers', function ($query) {
                $query->where('is_approved', true);
            })->count(),
            'approved_loans' => Loan::whereHas('approvers', function ($query) {
                $query->where('is_approved', true);
            })->count(),
            'total_contribution_amount' => Contribution::sum('quantity'),
            'total_loan_amount' => Loan::sum('quantity'),
        ];

        // Contribuciones recientes
        $recent_contributions = Contribution::with(['user', 'creator'])
            ->latest()
            ->take(5)
            ->get();

        // Préstamos recientes
        $recent_loans = Loan::with(['requester', 'approvers.user'])
            ->latest()
            ->take(5)
            ->get();

        // Usuarios con más contribuciones
        $top_contributors = User::withSum('contributions', 'quantity')
            ->orderByDesc('contributions_sum_quantity')
            ->take(5)
            ->get();

        // Préstamos pendientes de aprobación
        $pending_approvals = Loan::with(['requester', 'approvers.user'])
            ->whereHas('approvers', function ($query) {
                $query->where('is_approved', false);
            })
            ->latest()
            ->take(5)
            ->get();

        return view('dashboard.index', compact(
            'stats',
            'recent_contributions',
            'recent_loans',
            'top_contributors',
            'pending_approvals'
        ));
    }
}
