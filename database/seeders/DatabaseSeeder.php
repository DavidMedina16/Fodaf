<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // Primero los roles
            RoleSeeder::class,
            
            // Luego los usuarios (que dependen de los roles)
            UserSeeder::class,
            
            // Los parámetros del sistema
            ParameterSeeder::class,
            
            // Las contribuciones (que dependen de usuarios)
            ContributionSeeder::class,
            
            // Los préstamos (que dependen de usuarios)
            LoanSeeder::class,
            
            // Los aprobadores de préstamos (que dependen de préstamos y usuarios)
            LoanApproverSeeder::class,
        ]);
    }
}
