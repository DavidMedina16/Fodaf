<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Maneja el registro de un nuevo usuario.
     */
    public function register(Request $request)
    {
        // Validamos los datos recibidos del formulario
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        // Creamos el usuario de forma segura
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Iniciamos sesión automáticamente
        Auth::login($user);

        // Redirigimos al usuario a la página de inicio
        return redirect('/home');
    }

    /**
     * Procesa el inicio de sesión.
     */
    public function login(Request $request)
    {
        // Validamos las credenciales
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Intentamos autenticar al usuario
        if (Auth::attempt($credentials)) {
            // Regeneramos la sesión por seguridad
            $request->session()->regenerate();

            // Redireccionamos al destino previsto o a la página de inicio
            return redirect()->intended('/home');
        }

        // Si falló la autenticación, regresamos con un error
        return back()->withErrors([
            'email' => 'Las credenciales proporcionadas no son válidas.',
        ]);
    }

    /**
     * Cierra la sesión actual.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
