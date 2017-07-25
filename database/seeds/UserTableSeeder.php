<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class UserTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        //
        DB::table('users')->insert([
            [
               'name' => 'admin',
               'email' => 'admin@163.com',
               'password' => bcrypt('admin'),
               'auth' => 2,
            ],
            [
                'name' => 'softteam',
                'email' => 'softteam@163.com',
                'password' => bcrypt('123456'),
                'auth' => 2,
            ]
        ]);
    }
}
