<?php // Inicio del archivo PHP

namespace App\Models; // Espacio de nombres de los modelos

use Illuminate\Database\Eloquent\Factories\HasFactory; // Trait para usar fábricas en tests
use Illuminate\Database\Eloquent\Model; // Clase base de los modelos Eloquent

class Role extends Model // Modelo que representa un rol de usuario
{
    use HasFactory; // Habilita la fábrica de este modelo

    protected $fillable = [ // Atributos asignables en masa
        'name', // Nombre del rol
    ];

    public function users() // Relación de muchos a muchos con usuarios
    {
        return $this->belongsToMany(User::class); // Un rol puede pertenecer a varios usuarios
    }
}
