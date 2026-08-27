<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('docko_responses', function (Blueprint $table) {
            if (!Schema::hasColumn('docko_responses', 'admin_contract')) {
                $table->string('admin_contract')->nullable()->after('bca');
            }
            if (!Schema::hasColumn('docko_responses', 'admin_prefix')) {
                $table->string('admin_prefix')->nullable()->after('admin_contract');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('docko_responses', function (Blueprint $table) {
            $table->dropColumn(['admin_contract', 'admin_prefix']);
        });
    }
};
