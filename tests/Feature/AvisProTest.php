<?php

namespace Tests\Feature;

use App\Models\Avis;
use App\Models\Entreprise;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvisProTest extends TestCase
{
    use RefreshDatabase;

    private function entreprise(?User $user = null, string $nom = 'Chez Test'): Entreprise
    {
        return Entreprise::create([
            'user_id' => $user?->id, 'nom' => $nom, 'slug' => Entreprise::uniqueSlug($nom),
            'secteur' => 'Restaurant', 'ville' => 'Cotonou', 'description' => 'Un restaurant de test.',
        ]);
    }

    private function owner(): User
    {
        return User::create(['name' => 'Patron', 'email' => 'patron@test.bj', 'password' => 'motdepasse', 'role' => 'entreprise']);
    }

    public function test_recherche_par_nom_secteur_et_ville(): void
    {
        $this->entreprise(null, 'Chez Mama');
        Entreprise::create(['nom' => 'Garage Zed', 'slug' => 'garage-zed', 'secteur' => 'Garage automobile', 'ville' => 'Porto-Novo']);

        $this->getJson('/api/entreprises?q=mama')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/entreprises?secteur=Garage automobile')->assertOk()->assertJsonPath('data.0.slug', 'garage-zed');
        $this->getJson('/api/entreprises?ville=Porto-Novo')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_depot_d_un_avis_et_calcul_de_la_moyenne(): void
    {
        $e = $this->entreprise();
        $this->postJson("/api/entreprises/{$e->slug}/avis", ['auteur' => 'Awa', 'note' => 4, 'commentaire' => 'Très bon service, je recommande.'])->assertCreated();

        $this->getJson("/api/entreprises/{$e->slug}")->assertOk()->assertJsonPath('avis_count', 1)->assertJsonPath('note_moyenne', 4);
    }

    public function test_validation_et_protection_anti_spam(): void
    {
        $e = $this->entreprise();
        $this->postJson("/api/entreprises/{$e->slug}/avis", ['auteur' => 'A', 'note' => 9, 'commentaire' => 'court'])->assertStatus(422)->assertJsonValidationErrors(['auteur', 'note', 'commentaire']);
        $this->postJson("/api/entreprises/{$e->slug}/avis", ['auteur' => 'Robot', 'note' => 5, 'commentaire' => 'Un commentaire suffisamment long.', 'website' => 'http://spam'])->assertStatus(422);

        $ok = ['auteur' => 'Awa', 'note' => 5, 'commentaire' => 'Un commentaire suffisamment long.'];
        $this->postJson("/api/entreprises/{$e->slug}/avis", $ok)->assertCreated();
        $this->postJson("/api/entreprises/{$e->slug}/avis", $ok)->assertStatus(422);
    }

    public function test_le_html_est_retire_des_avis(): void
    {
        $e = $this->entreprise();
        $this->postJson("/api/entreprises/{$e->slug}/avis", ['auteur' => '<b>Awa</b>', 'note' => 5, 'commentaire' => '<script>alert(1)</script>Excellent accueil général.'])->assertCreated();
        $this->assertStringNotContainsString('<script>', Avis::first()->commentaire);
    }

    public function test_code_de_verification_donne_le_badge_et_ne_sert_qu_une_fois(): void
    {
        $owner = $this->owner();
        $e = $this->entreprise($owner);
        $e->codes()->create(['code' => 'ABC123']);

        $r = $this->postJson("/api/entreprises/{$e->slug}/avis", ['auteur' => 'Awa', 'note' => 5, 'commentaire' => 'Avec un code valide, merci.', 'code' => 'abc123'])->assertCreated();
        $this->assertTrue($r->json('verifie'));
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.9'])
            ->postJson("/api/entreprises/{$e->slug}/avis", ['auteur' => 'Bob', 'note' => 5, 'commentaire' => 'Le même code une deuxième fois.', 'code' => 'ABC123'])->assertStatus(422);
    }

    public function test_seule_l_entreprise_concernee_peut_repondre_et_signaler(): void
    {
        $owner = $this->owner();
        $e = $this->entreprise($owner);
        $autre = User::create(['name' => 'Autre', 'email' => 'autre@test.bj', 'password' => 'motdepasse', 'role' => 'entreprise']);
        $this->entreprise($autre, 'Autre Resto');
        $avis = Avis::create(['entreprise_id' => $e->id, 'auteur' => 'Awa', 'note' => 1, 'commentaire' => 'Avis négatif de test.']);

        $this->actingAs($autre, 'sanctum')->postJson("/api/avis/{$avis->id}/reponse", ['contenu' => 'Intrus !'])->assertForbidden();
        $this->actingAs($owner, 'sanctum')->postJson("/api/avis/{$avis->id}/reponse", ['contenu' => 'Merci pour votre retour.'])->assertCreated();
        $this->getJson("/api/entreprises/{$e->slug}/avis")->assertJsonPath('data.0.reponse.contenu', 'Merci pour votre retour.');

        $this->actingAs($owner, 'sanctum')->postJson("/api/avis/{$avis->id}/signaler", ['motif' => 'Client inconnu'])->assertOk();
        $this->getJson("/api/entreprises/{$e->slug}/avis")->assertJsonCount(0, 'data');
    }

    public function test_moderation_reservee_a_l_administrateur(): void
    {
        $owner = $this->owner();
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@test.bj', 'password' => 'motdepasse', 'role' => 'admin']);
        $e = $this->entreprise($owner);
        $avis = Avis::create(['entreprise_id' => $e->id, 'auteur' => 'X', 'note' => 1, 'commentaire' => 'Avis signalé de test.', 'statut' => 'signale', 'motif_signalement' => 'abus']);

        $this->actingAs($owner, 'sanctum')->getJson('/api/admin/avis')->assertForbidden();
        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/avis/{$avis->id}/moderation", ['action' => 'masquer'])->assertOk();
        $this->assertSame('masque', $avis->fresh()->statut);
    }

    public function test_inscription_ne_permet_pas_de_devenir_administrateur(): void
    {
        $this->postJson('/api/auth/register', ['name' => 'Pirate', 'email' => 'pirate@test.bj', 'password' => 'motdepasse', 'role' => 'admin'])->assertStatus(422);
        $this->postJson('/api/auth/register', ['name' => 'Patron', 'email' => 'p2@test.bj', 'password' => 'motdepasse'])->assertCreated()->assertJsonPath('user.role', 'entreprise');
    }
}
