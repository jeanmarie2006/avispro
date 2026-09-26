<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entreprises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->cascadeOnDelete();
            $table->string('nom', 120);
            $table->string('slug', 140)->unique();
            $table->string('secteur', 60)->index();
            $table->string('ville', 60)->index();
            $table->text('description')->nullable();
            $table->string('telephone', 30)->nullable();
            $table->string('site_web', 160)->nullable();
            $table->timestamps();
        });

        Schema::create('avis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->constrained()->cascadeOnDelete();
            $table->string('auteur', 80);
            $table->unsignedTinyInteger('note');
            $table->text('commentaire');
            // publie | signale (en attente de modération) | masque (retiré par la modération)
            $table->string('statut', 12)->default('publie')->index();
            $table->string('motif_signalement', 255)->nullable();
            $table->boolean('verifie')->default(false);
            $table->string('ip_hash', 64)->nullable()->index();
            $table->timestamps();
        });

        Schema::create('reponses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('avis_id')->unique()->constrained('avis')->cascadeOnDelete();
            $table->text('contenu');
            $table->timestamps();
        });

        // Codes remis aux clients par l'entreprise (envoyés par SMS dans une version réelle) : badge « avis vérifié »
        Schema::create('codes_verification', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->constrained()->cascadeOnDelete();
            $table->string('code', 12)->unique();
            $table->timestamp('utilise_le')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('codes_verification');
        Schema::dropIfExists('reponses');
        Schema::dropIfExists('avis');
        Schema::dropIfExists('entreprises');
    }
};
