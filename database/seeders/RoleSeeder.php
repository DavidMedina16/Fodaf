<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

final class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Presidente',
                'description' => 'Rol con máxima autoridad en la organización'
            ],
            [
                'name' => 'Tesorero',
                'description' => 'Responsable de la gestión financiera'
            ],
            [
                'name' => 'Revisor',
                'description' => 'Responsable de revisar y aprobar solicitudes'
            ],
            [
                'name' => 'Administrador',
                'description' => 'Administrador del sistema con acceso completo'
            ],
            [
                'name' => 'Integrante',
                'description' => 'Miembro regular de la organización'
            ],
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );
        }
    }
}
