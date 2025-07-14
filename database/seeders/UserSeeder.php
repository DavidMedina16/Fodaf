<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

final class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear usuarios con diferentes roles
        $users = [
            [
                'name' => 'Administrador Principal',
                'email' => 'admin@fodaf.com',
                'password' => Hash::make('password'),
                'roles' => ['Administrador']
            ],
            [
                'name' => 'Juan Pérez',
                'email' => 'juan.perez@fodaf.com',
                'password' => Hash::make('password'),
                'roles' => ['Presidente']
            ],
            [
                'name' => 'María García',
                'email' => 'maria.garcia@fodaf.com',
                'password' => Hash::make('password'),
                'roles' => ['Tesorero']
            ],
            [
                'name' => 'Carlos López',
                'email' => 'carlos.lopez@fodaf.com',
                'password' => Hash::make('password'),
                'roles' => ['Revisor']
            ],
            [
                'name' => 'Ana Rodríguez',
                'email' => 'ana.rodriguez@fodaf.com',
                'password' => Hash::make('password'),
                'roles' => ['Integrante']
            ],
            [
                'name' => 'Luis Martínez',
                'email' => 'luis.martinez@fodaf.com',
                'password' => Hash::make('password'),
                'roles' => ['Integrante']
            ],
            [
                'name' => 'Carmen Silva',
                'email' => 'carmen.silva@fodaf.com',
                'password' => Hash::make('password'),
                'roles' => ['Integrante']
            ],
            [
                'name' => 'Roberto Torres',
                'email' => 'roberto.torres@fodaf.com',
                'password' => Hash::make('password'),
                'roles' => ['Integrante']
            ],
            [
                'name' => 'Patricia Morales',
                'email' => 'patricia.morales@fodaf.com',
                'password' => Hash::make('password'),
                'roles' => ['Integrante']
            ],
            [
                'name' => 'Fernando Herrera',
                'email' => 'fernando.herrera@fodaf.com',
                'password' => Hash::make('password'),
                'roles' => ['Integrante']
            ]
        ];

        foreach ($users as $userData) {
            $roles = $userData['roles'];
            unset($userData['roles']);
            
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            
            // Asignar roles al usuario (solo si no los tiene ya)
            foreach ($roles as $roleName) {
                $role = Role::where('name', $roleName)->first();
                if ($role && !$user->roles()->where('role_id', $role->id)->exists()) {
                    $user->roles()->attach($role->id);
                }
            }
        }
    }
}
