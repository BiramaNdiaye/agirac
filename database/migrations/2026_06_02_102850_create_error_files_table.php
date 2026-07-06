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
        Schema::create('error_files', function (Blueprint $table) {
            $table->id();
		$table->string('filename');
            $table->string('original_path');
            $table->text('error_message')->nullable();
            $table->json('csv_headers')->nullable();
            $table->json('csv_rows')->nullable();
            $table->json('files_list')->nullable();
            $table->boolean('processed')->default(false);
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('error_files');
    }
};
