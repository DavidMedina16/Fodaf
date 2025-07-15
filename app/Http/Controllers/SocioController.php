<?php // Indicamos que este archivo es código PHP

namespace App\Http\Controllers; // Espacio de nombres donde vive este controlador

use App\Models\User; // Importamos el modelo Usuario para consultar la base de datos
use App\Models\Role; // Importamos el modelo Role
use Illuminate\Http\Request; // Importamos Request para manejar los datos del formulario
use Illuminate\View\View; // Importamos View para el tipo de retorno
use Illuminate\Http\RedirectResponse; // Importamos RedirectResponse para redirecciones

class SocioController extends Controller // Nuestra clase hereda de Controller
{
    /**
     * Muestra el listado de socios.
     */
    public function index(): View // Método que responde a la ruta de listado de socios
    {
        // Con "with('roles')" cargamos también la relación de roles de cada usuario
        // "get()" recupera todos los registros de la tabla users
        $usuarios = User::with('roles')->get(); // Guardamos el resultado en $usuarios

        // Enviamos los usuarios a la vista socios/index.blade.php
        return view('socios.index', ['usuarios' => $usuarios]);
    }

    /**
     * Muestra el formulario de edición de un socio.
     */
    public function edit(User $socio): View
    {
        // Cargamos los roles disponibles para el formulario
        $roles = Role::all();
        
        return view('socios.edit', [
            'socio' => $socio,
            'roles' => $roles
        ]);
    }

    /**
     * Actualiza la información de un socio.
     */
    public function update(Request $request, User $socio): RedirectResponse
    {
        // Validamos los datos del formulario
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $socio->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'birth_date' => 'nullable|date',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id'
        ]);

        // Actualizamos los datos básicos del usuario
        $socio->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'birth_date' => $validated['birth_date'],
        ]);

        // Actualizamos los roles si se proporcionaron
        if (isset($validated['roles'])) {
            $socio->roles()->sync($validated['roles']);
        }

        // Redirigimos con mensaje de éxito
        return redirect()->route('socios.index')
            ->with('success', 'Socio actualizado correctamente');
    }
}
