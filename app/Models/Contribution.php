<?php // Inicio del archivo PHP

namespace App\Models; // Espacio de nombres de los modelos

use Illuminate\Database\Eloquent\Factories\HasFactory; // Trait para usar fábricas en tests
use Illuminate\Database\Eloquent\Model; // Clase base de los modelos Eloquent

class Contribution extends Model // Modelo que representa una contribución
{
    use HasFactory; // Habilita la fábrica de este modelo

    protected $fillable = [ // Atributos asignables en masa
        'user_id', // Identificador del usuario que aporta
        'quantity', // Cantidad aportada
        'created_by', // Usuario que registró la contribución
    ];

    public function user() // Relación con el usuario al que pertenece la contribución
    {
        return $this->belongsTo(User::class); // Una contribución pertenece a un usuario
    }

    public function creator() // Relación con el usuario que la creó
    {
        return $this->belongsTo(User::class, 'created_by'); // Pertenece a un usuario usando la clave created_by
    }
}
