<?php // Inicio del archivo PHP

namespace App\Http\Controllers; // Espacio de nombres para los controladores

use App\Models\Role; // Importamos el modelo Role para usarlo
use Illuminate\Http\Request; // Importamos la clase Request para manejar peticiones

class RoleController extends Controller // Controlador que gestiona los roles
{
    public function index() // Muestra todos los roles
    {
        return response()->json(Role::all()); // Devuelve todos los roles en formato JSON
    }

    public function store(Request $request) // Guarda un nuevo rol
    {
        $role = Role::create($request->all()); // Crea el rol con los datos recibidos
        return response()->json($role, 201); // Devuelve el rol creado con código 201
    }

    public function show(Role $role) // Muestra un rol específico
    {
        return response()->json($role); // Devuelve el rol en formato JSON
    }

    public function update(Request $request, Role $role) // Actualiza un rol
    {
        $role->update($request->all()); // Aplica la actualización con los datos recibidos
        return response()->json($role); // Devuelve el rol actualizado
    }

    public function destroy(Role $role) // Elimina un rol
    {
        $role->delete(); // Ejecuta el borrado del rol
        return response()->noContent(); // Responde sin contenido para indicar éxito
    }
}
