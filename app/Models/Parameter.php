<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

final class Parameter extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'value', 'description'];
    
    protected $primaryKey = 'key';
    
    public $incrementing = false;
    
    protected $keyType = 'string';
}
