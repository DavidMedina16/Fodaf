<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Parameter;
use Illuminate\Database\Seeder;

final class ParameterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $parameters = [
            // Parámetros financieros
            [
                'key' => 'interest_rate',
                'value' => '0.02',
                'description' => 'Tasa de interés mensual (2%)'
            ],
            [
                'key' => 'minimum_contribution',
                'value' => '50000',
                'description' => 'Contribución mínima mensual'
            ],
            [
                'key' => 'maximum_contribution',
                'value' => '500000',
                'description' => 'Contribución máxima mensual'
            ],
            [
                'key' => 'minimum_loan_amount',
                'value' => '100000',
                'description' => 'Monto mínimo de préstamo'
            ],
            [
                'key' => 'maximum_loan_amount',
                'value' => '2000000',
                'description' => 'Monto máximo de préstamo'
            ],
            
            // Parámetros de aprobación
            [
                'key' => 'loan_approval_quorum',
                'value' => '2',
                'description' => 'Número mínimo de aprobadores requeridos'
            ],
            [
                'key' => 'loan_approval_deadline',
                'value' => '7',
                'description' => 'Días para aprobar un préstamo'
            ],
            
            // Parámetros de membresía
            [
                'key' => 'membership_fee',
                'value' => '100000',
                'description' => 'Cuota de membresía inicial'
            ],
            [
                'key' => 'monthly_fee',
                'value' => '25000',
                'description' => 'Cuota mensual de mantenimiento'
            ],
            
            // Parámetros del sistema
            [
                'key' => 'organization_name',
                'value' => 'FODAF',
                'description' => 'Nombre de la organización'
            ],
            [
                'key' => 'organization_address',
                'value' => 'Calle Principal #123, Ciudad',
                'description' => 'Dirección de la organización'
            ],
            [
                'key' => 'organization_phone',
                'value' => '+57 300 123 4567',
                'description' => 'Teléfono de la organización'
            ],
            [
                'key' => 'organization_email',
                'value' => 'info@fodaf.com',
                'description' => 'Email de la organización'
            ],
            
            // Parámetros de notificaciones
            [
                'key' => 'enable_email_notifications',
                'value' => 'true',
                'description' => 'Habilitar notificaciones por email'
            ],
            [
                'key' => 'enable_sms_notifications',
                'value' => 'false',
                'description' => 'Habilitar notificaciones por SMS'
            ],
            
            // Parámetros de reportes
            [
                'key' => 'report_currency',
                'value' => 'COP',
                'description' => 'Moneda para reportes'
            ],
            [
                'key' => 'fiscal_year_start',
                'value' => '01-01',
                'description' => 'Inicio del año fiscal (DD-MM)'
            ],
        ];

        foreach ($parameters as $parameterData) {
            Parameter::updateOrCreate(
                ['key' => $parameterData['key']],
                $parameterData
            );
        }
    }
}
