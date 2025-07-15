<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\User;
use App\Models\LoanApprover;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

final class LoanController extends Controller
{
    public function index(): View
    {
        $loans = Loan::with(['requester', 'approvers.user'])
            ->latest()
            ->paginate(10);

        return view('loans.index', compact('loans'));
    }

    public function create(): View
    {
        $users = User::whereDoesntHave('roles', function ($query) {
            $query->where('name', 'Administrador');
        })->get();

        return view('loans.create', compact('users'));
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'requested_by' => 'required|exists:users,id',
            'quantity' => 'required|numeric|min:100000|max:2000000',
        ]);

        $loan = Loan::create([
            'requested_by' => $request->requested_by,
            'quantity' => $request->quantity,
        ]);

        // Obtener usuarios con roles de aprobación
        $approvers = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['Presidente', 'Tesorero', 'Revisor']);
        })->get();

        // Crear registros de aprobadores pendientes
        foreach ($approvers as $approver) {
            LoanApprover::create([
                'loan_id' => $loan->id,
                'user_id' => $approver->id,
                'is_approved' => false,
            ]);
        }

        return redirect()->route('loans.index')
            ->with('success', 'Préstamo creado exitosamente. Pendiente de aprobación.');
    }

    public function show(Loan $loan): View
    {
        $loan->load(['requester', 'approvers.user']);
        
        return view('loans.show', compact('loan'));
    }

    public function edit(Loan $loan): View
    {
        $users = User::whereDoesntHave('roles', function ($query) {
            $query->where('name', 'Administrador');
        })->get();

        return view('loans.edit', compact('loan', 'users'));
    }

    public function update(Request $request, Loan $loan): RedirectResponse
    {
        $request->validate([
            'requested_by' => 'required|exists:users,id',
            'quantity' => 'required|numeric|min:100000|max:2000000',
        ]);

        $loan->update([
            'requested_by' => $request->requested_by,
            'quantity' => $request->quantity,
        ]);

        return redirect()->route('loans.index')
            ->with('success', 'Préstamo actualizado exitosamente.');
    }

    public function destroy(Loan $loan): RedirectResponse
    {
        $loan->delete();

        return redirect()->route('loans.index')
            ->with('success', 'Préstamo eliminado exitosamente.');
    }

    public function approve(Request $request, Loan $loan): RedirectResponse
    {
        $request->validate([
            'is_approved' => 'required|boolean',
        ]);

        $approver = LoanApprover::where('loan_id', $loan->id)
            ->where('user_id', auth()->id())
            ->first();

        if ($approver) {
            $approver->update(['is_approved' => $request->is_approved]);
        }

        $status = $request->is_approved ? 'aprobado' : 'rechazado';
        return redirect()->back()->with('success', "Préstamo {$status} exitosamente.");
    }
}
