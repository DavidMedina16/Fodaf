<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ParameterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('parameters')->insert([
            ['key' => 'interest_rate', 'value' => '0,02'],
            ['key' => 'minimum_value', 'value' => '130000'],
        ]);
    }
}
