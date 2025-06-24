<?php // Inicio del archivo PHP

namespace App\Http\Controllers; // Espacio de nombres para los controladores

use App\Models\Contribution; // Importamos el modelo Contribution para usarlo
use Illuminate\Http\Request; // Importamos la clase Request para manejar peticiones

class ContributionController extends Controller // Controlador que gestiona las contribuciones
{
    public function index() // Muestra todas las contribuciones
    {
        return response()->json(Contribution::all()); // Devuelve todas las contribuciones en formato JSON
    }

    public function store(Request $request) // Guarda una nueva contribución
    {
        $contribution = Contribution::create($request->all()); // Crea la contribución con los datos recibidos
        return response()->json($contribution, 201); // Devuelve la contribución creada con código 201
    }

    public function show(Contribution $contribution) // Muestra una contribución específica
    {
        return response()->json($contribution); // Devuelve la contribución en formato JSON
    }

    public function update(Request $request, Contribution $contribution) // Actualiza una contribución
    {
        $contribution->update($request->all()); // Aplica la actualización con los datos recibidos
        return response()->json($contribution); // Devuelve la contribución actualizada
    }

    public function destroy(Contribution $contribution) // Elimina una contribución
    {
        $contribution->delete(); // Ejecuta el borrado de la contribución
        return response()->noContent(); // Responde sin contenido para indicar éxito
    }
}
