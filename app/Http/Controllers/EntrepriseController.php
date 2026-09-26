<?php

namespace App\Http\Controllers;

use App\Models\Avis;
use App\Models\CodeVerification;
use App\Models\Entreprise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Partie publique : recherche d'entreprises, page d'une entreprise, dépôt d'un avis, widget. */
class EntrepriseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['q' => 'nullable|string|max:80', 'secteur' => 'nullable|string|max:60', 'ville' => 'nullable|string|max:60', 'tri' => 'nullable|in:note,avis,recent']);
        $q = Entreprise::query()->withStats();
        if ($term = trim((string) $request->query('q'))) {
            $q->where(function ($w) use ($term) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';
                $w->where('nom', 'like', $like)->orWhere('secteur', 'like', $like)->orWhere('ville', 'like', $like)->orWhere('description', 'like', $like);
            });
        }
        if ($s = $request->query('secteur')) {
            $q->where('secteur', $s);
        }
        if ($v = $request->query('ville')) {
            $q->where('ville', $v);
        }
        match ($request->query('tri', 'note')) {
            'avis' => $q->orderByDesc('avis_count'),
            'recent' => $q->orderByDesc('id'),
            default => $q->orderByRaw('note_moyenne IS NULL')->orderByDesc('note_moyenne')->orderByDesc('avis_count'),
        };

        return response()->json($q->paginate(12)->through(fn ($e) => $this->card($e)));
    }

    public function filters(): JsonResponse
    {
        return response()->json([
            'secteurs' => Entreprise::select('secteur', DB::raw('count(*) as total'))->groupBy('secteur')->orderByDesc('total')->get(),
            'villes' => Entreprise::select('ville', DB::raw('count(*) as total'))->groupBy('ville')->orderByDesc('total')->get(),
            'totaux' => ['entreprises' => Entreprise::count(), 'avis' => Avis::where('statut', 'publie')->count()],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $e = Entreprise::withStats()->where('slug', $slug)->firstOrFail();
        $dist = Avis::where('entreprise_id', $e->id)->where('statut', 'publie')
            ->select('note', DB::raw('count(*) as total'))->groupBy('note')->pluck('total', 'note');

        return response()->json([
            ...$this->card($e),
            'description' => $e->description,
            'telephone' => $e->telephone,
            'site_web' => $e->site_web,
            'repartition' => collect([5, 4, 3, 2, 1])->map(fn ($n) => ['note' => $n, 'total' => (int) ($dist[$n] ?? 0)]),
        ]);
    }

    public function avis(string $slug): JsonResponse
    {
        $e = Entreprise::where('slug', $slug)->firstOrFail();
        $page = Avis::with('reponse')->where('entreprise_id', $e->id)->where('statut', 'publie')->latest()->paginate(8);

        return response()->json($page);
    }

    public function storeAvis(Request $request, string $slug): JsonResponse
    {
        // Champ piège (invisible pour les humains) : un robot le remplit
        if (filled($request->input('website'))) {
            return response()->json(['message' => 'Envoi refusé.'], 422);
        }
        $e = Entreprise::where('slug', $slug)->firstOrFail();
        $data = $request->validate([
            'auteur' => ['required', 'string', 'min:2', 'max:60'],
            'note' => ['required', 'integer', 'between:1,5'],
            'commentaire' => ['required', 'string', 'min:15', 'max:1500'],
            'code' => ['nullable', 'string', 'max:12'],
        ]);
        $ip = hash_hmac('sha256', (string) $request->ip(), (string) config('app.key'));
        if (Avis::where('entreprise_id', $e->id)->where('ip_hash', $ip)->where('created_at', '>', now()->subDay())->exists()) {
            return response()->json(['message' => 'Vous avez déjà déposé un avis pour cette entreprise aujourd’hui.', 'errors' => ['commentaire' => ['Un seul avis par jour et par entreprise.']]], 422);
        }
        $verifie = false;
        if (filled($data['code'] ?? null)) {
            $code = CodeVerification::where('entreprise_id', $e->id)->where('code', strtoupper(trim($data['code'])))->whereNull('utilise_le')->first();
            if (! $code) {
                return response()->json(['message' => 'Ce code de vérification est invalide ou déjà utilisé.', 'errors' => ['code' => ['Code invalide ou déjà utilisé.']]], 422);
            }
            $code->update(['utilise_le' => now()]);
            $verifie = true;
        }
        $avis = Avis::create([
            'entreprise_id' => $e->id,
            'auteur' => strip_tags($data['auteur']),
            'note' => $data['note'],
            'commentaire' => strip_tags($data['commentaire']),
            'verifie' => $verifie,
            'ip_hash' => $ip,
        ]);

        return response()->json($avis, 201);
    }

    /** Données du widget intégrable sur le site d'une entreprise. */
    public function widget(string $slug): JsonResponse
    {
        $e = Entreprise::withStats()->where('slug', $slug)->firstOrFail();
        $derniers = Avis::where('entreprise_id', $e->id)->where('statut', 'publie')->latest()->limit(3)->get(['auteur', 'note', 'commentaire', 'verifie']);

        return response()->json([...$this->card($e), 'avis' => $derniers]);
    }

    private function card(Entreprise $e): array
    {
        return [
            'id' => $e->id,
            'nom' => $e->nom,
            'slug' => $e->slug,
            'secteur' => $e->secteur,
            'ville' => $e->ville,
            'note_moyenne' => $e->note_moyenne ? round((float) $e->note_moyenne, 1) : null,
            'avis_count' => (int) $e->avis_count,
            'extrait' => str($e->description)->limit(120)->toString(),
        ];
    }
}
