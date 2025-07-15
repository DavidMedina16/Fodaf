<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * Muestra el formulario de edición del perfil.
     */
    public function edit(): View
    {
        return view('profile.edit', [
            'user' => auth()->user()
        ]);
    }

    /**
     * Actualiza el perfil del usuario.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = auth()->user();

        // Validamos los datos del formulario
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'birth_date' => 'nullable|date',
            'current_password' => 'nullable|required_with:new_password',
            'new_password' => 'nullable|min:8|confirmed',
        ]);

        // Actualizamos los datos básicos del usuario
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'birth_date' => $validated['birth_date'],
        ]);

        // Actualizamos la contraseña si se proporcionó
        if (isset($validated['new_password'])) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                return back()->withErrors(['current_password' => 'La contraseña actual es incorrecta']);
            }
            
            $user->update([
                'password' => Hash::make($validated['new_password'])
            ]);
        }

        return redirect()->route('profile.edit')
            ->with('success', 'Perfil actualizado correctamente');
    }
}
