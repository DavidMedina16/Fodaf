<?php // Indicamos que este archivo es código PHP

namespace App\Http\Controllers; // Espacio de nombres donde vive este controlador

use App\Models\User; // Importamos el modelo Usuario para consultar la base de datos

class SocioController extends Controller // Nuestra clase hereda de Controller
{
    /**
     * Muestra el listado de socios.
     */
    public function index() // Método que responde a la ruta de listado de socios
    {
        // Con "with('roles')" cargamos también la relación de roles de cada usuario
        // "get()" recupera todos los registros de la tabla users
        $usuarios = User::with('roles')->get(); // Guardamos el resultado en $usuarios

        // Enviamos los usuarios a la vista socios/index.blade.php
        return view('socios.index', ['usuarios' => $usuarios]);
    }
}
