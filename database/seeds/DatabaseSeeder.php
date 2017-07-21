<?php

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $this->call(UserTableSeeder::class);
        $this->call(FoldersTableSeeder::class);
        $this->call(NotesTableSeeder::class);
        $this->call(AvatarsTableSeeder::class);
    }
}
