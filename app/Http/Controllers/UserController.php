<?php // Inicio del archivo PHP

namespace App\Http\Controllers; // Espacio de nombres para los controladores

use App\Models\User; // Importamos el modelo User para usarlo
use Illuminate\Http\Request; // Importamos la clase Request para manejar peticiones

class UserController extends Controller // Controlador que gestiona los usuarios
{
    public function index() // Muestra todos los usuarios
    {
        return response()->json(User::all()); // Devuelve todos los usuarios en formato JSON
    }

    public function store(Request $request) // Guarda un nuevo usuario
    {
        $user = User::create($request->all()); // Crea el usuario con los datos recibidos
        return response()->json($user, 201); // Devuelve el usuario creado con código 201
    }

    public function show(User $user) // Muestra un usuario específico
    {
        return response()->json($user); // Devuelve el usuario en formato JSON
    }

    public function update(Request $request, User $user) // Actualiza un usuario
    {
        $user->update($request->all()); // Aplica la actualización con los datos recibidos
        return response()->json($user); // Devuelve el usuario actualizado
    }

    public function destroy(User $user) // Elimina un usuario
    {
        $user->delete(); // Ejecuta el borrado del usuario
        return response()->noContent(); // Responde sin contenido para indicar éxito
    }
}
