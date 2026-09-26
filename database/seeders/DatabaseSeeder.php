<?php

namespace Database\Seeders;

use App\Models\Avis;
use App\Models\CodeVerification;
use App\Models\Entreprise;
use App\Models\Reponse;
use App\Models\User;
use Illuminate\Database\Seeder;

/** Jeu de données fictif : entreprises béninoises imaginaires, avis et deux comptes de démonstration. */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        mt_srand(2026);

        User::create(['name' => 'Administrateur', 'email' => 'admin@avispro.bj', 'password' => 'admin1234', 'role' => 'admin']);
        $demo = User::create(['name' => 'Sika Adjovi', 'email' => 'demo@avispro.bj', 'password' => 'demo1234', 'role' => 'entreprise']);

        $entreprises = [
            ['Chez Mama Sika', 'Restaurant', 'Cotonou', 'Cuisine béninoise faite maison : sauces, poissons braisés et jus locaux, servis dans une ambiance familiale au cœur de Missèkplé.', $demo->id, '+229 01 97 00 00 01'],
            ['Salon Belle Allure', 'Coiffure & beauté', 'Cotonou', 'Coiffure, tresses, soins du visage et manucure sur rendez-vous ou sans rendez-vous.', null, '+229 01 96 00 00 02'],
            ['Garage Auto Confiance', 'Garage automobile', 'Abomey-Calavi', 'Vidange, freins, diagnostic électronique et réparation toutes marques, devis gratuit.', null, '+229 01 95 00 00 03'],
            ['Pharmacie de la Paix', 'Pharmacie', 'Porto-Novo', 'Médicaments, conseils et matériel médical, ouverte tous les jours jusqu’à 22 h.', null, '+229 01 94 00 00 04'],
            ['Boutique Wax & Style', 'Mode & couture', 'Cotonou', 'Pagnes wax, tenues sur mesure et retouches, livraison à domicile dans tout Cotonou.', null, '+229 01 93 00 00 05'],
            ['Quincaillerie Le Bâtisseur', 'Quincaillerie', 'Abomey-Calavi', 'Ciment, fer à béton, peinture et outillage pour particuliers et professionnels.', null, '+229 01 92 00 00 06'],
            ['Imprimerie Express', 'Imprimerie', 'Cotonou', 'Flyers, cartes de visite, affiches et impression grand format en 24 h.', null, '+229 01 91 00 00 07'],
            ['Pâtisserie Douceur d’Afrique', 'Pâtisserie', 'Porto-Novo', 'Gâteaux d’anniversaire, mariages et viennoiseries fraîches chaque matin.', null, '+229 01 90 00 00 08'],
            ['Cyber & Services Zogbo', 'Services numériques', 'Cotonou', 'Cybercafé, impressions, saisie de documents, inscriptions en ligne et transferts.', null, '+229 01 61 00 00 09'],
            ['Clinique Sainte-Marie', 'Santé', 'Parakou', 'Consultations, analyses et petite chirurgie avec une équipe à l’écoute.', null, '+229 01 62 00 00 10'],
            ['Auto-École Le Volant', 'Auto-école', 'Abomey-Calavi', 'Permis B et A : code, conduite et suivi personnalisé jusqu’à l’examen.', null, '+229 01 63 00 00 11'],
            ['Maquis Le Fromager', 'Restaurant', 'Ouidah', 'Grillades, bières fraîches et musique live le week-end, à deux pas de la plage.', null, '+229 01 64 00 00 12'],
            ['Menuiserie Kpèvi & Fils', 'Menuiserie', 'Porto-Novo', 'Portes, meubles sur mesure et aménagement intérieur en bois local.', null, '+229 01 65 00 00 13'],
            ['École Les Petits Génies', 'Éducation', 'Cotonou', 'Maternelle et primaire, méthodes actives et suivi des parents par application.', null, '+229 01 66 00 00 14'],
        ];

        $bons = [
            'Excellent accueil et un service rapide. Je recommande vivement, je reviendrai sans hésiter.',
            'Très satisfait de la qualité, les prix sont corrects et l’équipe est vraiment sympathique.',
            'Professionnels et à l’écoute, tout a été fait dans les délais promis. Bravo !',
            'Une belle découverte : propre, bien organisé et personnel attentionné. Cinq étoiles méritées.',
            'Rapport qualité-prix imbattable dans le quartier. Je conseille à tous mes amis.',
            'Service impeccable du début à la fin, on sent le sérieux et l’envie de bien faire.',
        ];
        $moyens = [
            'Dans l’ensemble c’est correct, mais l’attente était un peu longue le samedi.',
            'Bon produit, service moyen : il faudrait un peu plus d’organisation aux heures de pointe.',
            'Correct sans plus. Le personnel est gentil, mais quelques retards à signaler.',
        ];
        $mauvais = [
            'Déçu par le service : beaucoup d’attente et peu d’explications. J’espère une amélioration.',
            'Le résultat n’était pas à la hauteur de mes attentes et le prix un peu trop élevé.',
        ];
        $noms = ['Koffi A.', 'Awa D.', 'Serge H.', 'Mireille T.', 'Rodrigue K.', 'Fatou S.', 'Bienvenu Y.', 'Nadège L.', 'Pascal G.', 'Carine M.', 'Ibrahim O.', 'Estelle B.', 'Rachidath Z.', 'Modeste F.'];
        $reponses = [
            'Merci beaucoup pour votre confiance et votre retour ! Toute l’équipe sera ravie de vous revoir.',
            'Nous vous remercions pour ce commentaire. Nous travaillons pour réduire l’attente aux heures de pointe.',
            'Merci pour votre avis. N’hésitez pas à nous appeler directement pour que nous puissions arranger la situation.',
        ];

        foreach ($entreprises as [$nom, $secteur, $ville, $desc, $userId, $tel]) {
            $e = Entreprise::create([
                'user_id' => $userId, 'nom' => $nom, 'slug' => Entreprise::uniqueSlug($nom), 'secteur' => $secteur, 'ville' => $ville,
                'description' => $desc, 'telephone' => $tel, 'created_at' => now()->subMonths(8),
            ]);
            $n = $userId ? 34 : mt_rand(6, 22);
            $biais = mt_rand(0, 100) / 100;
            for ($i = 0; $i < $n; $i++) {
                $r = mt_rand(0, 100) / 100;
                if ($r < 0.55 + $biais * .25) {
                    [$note, $txt] = [mt_rand(0, 100) > 40 ? 5 : 4, $bons[array_rand($bons)]];
                } elseif ($r < 0.85) {
                    [$note, $txt] = [3, $moyens[array_rand($moyens)]];
                } else {
                    [$note, $txt] = [mt_rand(1, 2), $mauvais[array_rand($mauvais)]];
                }
                $date = now()->subDays(mt_rand(0, 150))->subHours(mt_rand(0, 20));
                $avis = Avis::create([
                    'entreprise_id' => $e->id, 'auteur' => $noms[array_rand($noms)], 'note' => $note, 'commentaire' => $txt,
                    'verifie' => mt_rand(0, 100) > 75, 'created_at' => $date, 'updated_at' => $date,
                ]);
                if ($userId && $i % 3 === 0) {
                    Reponse::create(['avis_id' => $avis->id, 'contenu' => $reponses[array_rand($reponses)], 'created_at' => $date->copy()->addDay(), 'updated_at' => $date->copy()->addDay()]);
                }
            }
        }

        // Quelques avis signalés à modérer + codes de vérification pour la démo
        $chez = Entreprise::where('user_id', $demo->id)->first();
        Avis::create(['entreprise_id' => $chez->id, 'auteur' => 'Anonyme 22', 'note' => 1, 'commentaire' => 'Ce restaurant est nul, ne venez surtout pas, allez plutôt chez le concurrent d’en face !', 'statut' => 'signale', 'motif_signalement' => 'Publicité pour un concurrent, aucun détail sur une visite réelle.']);
        Avis::create(['entreprise_id' => $chez->id, 'auteur' => 'Client mécontent', 'note' => 2, 'commentaire' => 'Service très lent le dimanche midi, on a attendu plus de 45 minutes pour un plat.', 'statut' => 'signale', 'motif_signalement' => 'Je conteste : la salle était fermée pour un événement privé ce jour-là.']);
        foreach (['DEMO01', 'DEMO02', 'DEMO03'] as $c) {
            CodeVerification::create(['entreprise_id' => $chez->id, 'code' => $c]);
        }
    }
}
