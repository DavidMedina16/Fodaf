<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Contribution;
use App\Models\Loan;
use App\Models\LoanApprover;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class ReportController extends Controller
{
    public function index(): View
    {
        // Estadísticas generales para el dashboard de reportes
        $stats = [
            'total_users' => User::count(),
            'total_contributions' => Contribution::count(),
            'total_loans' => Loan::count(),
            'total_contribution_amount' => Contribution::sum('quantity'),
            'total_loan_amount' => Loan::sum('quantity'),
            'pending_loans' => Loan::whereDoesntHave('approvers', function ($query) {
                $query->where('is_approved', true);
            })->count(),
        ];

        // Contribuciones por mes (últimos 6 meses)
        $monthly_contributions = Contribution::selectRaw('
                YEAR(created_at) as year,
                MONTH(created_at) as month,
                SUM(quantity) as total_amount,
                COUNT(*) as count
            ')
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        // Préstamos por estado
        $loan_status = [
            'pending' => Loan::whereDoesntHave('approvers', function ($query) {
                $query->where('is_approved', true);
            })->count(),
            'approved' => Loan::whereHas('approvers', function ($query) {
                $query->where('is_approved', true);
            })->count(),
            'rejected' => Loan::whereHas('approvers', function ($query) {
                $query->where('is_approved', false);
            })->count(),
        ];

        return view('reports.index', compact('stats', 'monthly_contributions', 'loan_status'));
    }

    public function contributions(): View
    {
        $contributions = Contribution::with(['user', 'creator'])
            ->latest()
            ->paginate(20);

        $total_amount = Contribution::sum('quantity');
        $average_amount = Contribution::avg('quantity');
        $monthly_total = Contribution::whereMonth('created_at', now()->month)->sum('quantity');

        return view('reports.contributions', compact(
            'contributions',
            'total_amount',
            'average_amount',
            'monthly_total'
        ));
    }

    public function loans(): View
    {
        $loans = Loan::with(['requester', 'approvers.user'])
            ->latest()
            ->paginate(20);

        $total_amount = Loan::sum('quantity');
        $average_amount = Loan::avg('quantity');
        $pending_amount = Loan::whereDoesntHave('approvers', function ($query) {
            $query->where('is_approved', true);
        })->sum('quantity');

        return view('reports.loans', compact(
            'loans',
            'total_amount',
            'average_amount',
            'pending_amount'
        ));
    }

    public function financial(): View
    {
        // Resumen financiero
        $financial_summary = [
            'total_contributions' => Contribution::sum('quantity'),
            'total_loans' => Loan::sum('quantity'),
            'pending_loans' => Loan::whereDoesntHave('approvers', function ($query) {
                $query->where('is_approved', true);
            })->sum('quantity'),
            'approved_loans' => Loan::whereHas('approvers', function ($query) {
                $query->where('is_approved', true);
            })->sum('quantity'),
        ];

        // Top contribuyentes
        $top_contributors = User::withSum('contributions', 'quantity')
            ->orderByDesc('contributions_sum_quantity')
            ->take(10)
            ->get();

        // Top solicitantes de préstamos
        $top_loan_requesters = User::withSum('loans', 'quantity')
            ->orderByDesc('loans_sum_quantity')
            ->take(10)
            ->get();

        // Contribuciones por mes
        $monthly_contributions = Contribution::selectRaw('
                DATE_FORMAT(created_at, "%Y-%m") as month,
                SUM(quantity) as total_amount,
                COUNT(*) as count
            ')
            ->where('created_at', '>=', now()->subYear())
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->get();

        return view('reports.financial', compact(
            'financial_summary',
            'top_contributors',
            'top_loan_requesters',
            'monthly_contributions'
        ));
    }
}
