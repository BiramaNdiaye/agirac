<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
     

    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ========== PERMISSIONS ==========
        $permissions = [
            // Visites techniques
            'view vts',
            'create vt action',
            'edit vt action',
            'delete vt action',
            // Raccordements
            'view raccords',
            'create raccord action',
            'edit raccord action',
            'delete raccord action',
            // Commentaires
            'view comments',
            'create comments',
            'delete comments',
            // Attentes client
            'view attentes',
            'create attentes',
            // Notifications
            'view notifications',
            'mark notifications read',
            // Administration
            'access dashboard',
            'manage users',
        ];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // ========== ROLES ==========
        // Admin (toutes les permissions)
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Chef de projet
        $chefProjetRole = Role::firstOrCreate(['name' => 'chef_projet']);
        $chefProjetRole->givePermissionTo([
            'view vts', 'create vt action', 'edit vt action',
            'view raccords', 'create raccord action', 'edit raccord action',
            'view comments', 'create comments',
            'view attentes', 'create attentes',
            'view notifications', 'mark notifications read',
            'access dashboard',
        ]);

        // Technicien
        $technicienRole = Role::firstOrCreate(['name' => 'technicien']);
        $technicienRole->givePermissionTo([
            'view vts', 
            'view raccords', 
            'view comments', 
            'view notifications',
        ]);

        // ========== CRÉATION DE COMPTES DE TEST ==========
        // Admin
        $admin = User::updateOrCreate(
            ['email' => 'abdelkader.tall@csmaconsult.com'],
            ['name' => 'Admin', 'password' => bcrypt('password'), 'role' => 'admin']
        );
        $admin->assignRole('admin');

        // Chef de projet
        $chef = User::updateOrCreate(
            ['email' => 'akt@csmaconsult.com'],
            ['name' => 'Chef Projet', 'password' => bcrypt('password'), 'role' => 'chef_projet']
        );
        $chef->assignRole('chef_projet');

        // Technicien
        $tech = User::updateOrCreate(
            ['email' => 'abdelkader.tall@tstconnect.fr'],
            ['name' => 'Technicien', 'password' => bcrypt('password'), 'role' => 'technicien']
        );
        $tech->assignRole('technicien');
    }
    
}
