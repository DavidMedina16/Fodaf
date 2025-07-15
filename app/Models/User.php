<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
        'birth_date',
    ];
    protected $hidden = [
        'password',
        'remember_token',
    ];
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birth_date' => 'date',
        ];
    }
    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class, 'requested_by');
    }
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_role', 'user_id', 'role_id');
    }

    /**
     * Obtiene la URL de la imagen de perfil del usuario.
     * Si no tiene foto, retorna la imagen por defecto.
     */
    public function getProfileImageUrlAttribute(): string
    {
        return $this->photo_url ?? asset('user.png');
    }
}
