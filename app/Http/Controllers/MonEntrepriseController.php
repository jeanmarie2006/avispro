<?php

namespace App\Http\Controllers;

use App\Models\Avis;
use App\Models\CodeVerification;
use App\Models\Entreprise;
use App\Models\Reponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Espace de l'entreprise connectée : profil, avis reçus, réponses, signalements, statistiques, codes. */
class MonEntrepriseController extends Controller
{
    private function mine(Request $request): Entreprise
    {
        abort_unless($request->user()->role === 'entreprise', 403, 'Réservé aux comptes entreprise.');

        return Entreprise::where('user_id', $request->user()->id)->firstOrFail();
    }

    private function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'min:2', 'max:120'],
            'secteur' => ['required', 'string', 'min:2', 'max:60'],
            'ville' => ['required', 'string', 'min:2', 'max:60'],
            'description' => ['nullable', 'string', 'max:1200'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'site_web' => ['nullable', 'url', 'max:160'],
        ];
    }

    public function show(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'entreprise', 403, 'Réservé aux comptes entreprise.');
        $e = Entreprise::withStats()->where('user_id', $request->user()->id)->first();

        return response()->json($e);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'entreprise', 403, 'Réservé aux comptes entreprise.');
        abort_if(Entreprise::where('user_id', $request->user()->id)->exists(), 422, 'Votre entreprise existe déjà.');
        $data = $request->validate($this->rules());
        $e = Entreprise::create([...$data, 'user_id' => $request->user()->id, 'slug' => Entreprise::uniqueSlug($data['nom'])]);

        return response()->json($e, 201);
    }

    public function update(Request $request): JsonResponse
    {
        $e = $this->mine($request);
        $e->update($request->validate($this->rules()));

        return response()->json($e);
    }

    public function avis(Request $request): JsonResponse
    {
        $e = $this->mine($request);
        $q = Avis::with('reponse')->where('entreprise_id', $e->id)->latest();
        if ($s = $request->query('statut')) {
            $q->where('statut', $s);
        }

        return response()->json($q->paginate(15));
    }

    public function reponse(Request $request, Avis $avis): JsonResponse
    {
        $e = $this->mine($request);
        abort_unless($avis->entreprise_id === $e->id, 403);
        $data = $request->validate(['contenu' => ['required', 'string', 'min:5', 'max:800']]);
        $rep = Reponse::updateOrCreate(['avis_id' => $avis->id], ['contenu' => strip_tags($data['contenu'])]);

        return response()->json($rep, 201);
    }

    public function supprimerReponse(Request $request, Avis $avis): JsonResponse
    {
        $e = $this->mine($request);
        abort_unless($avis->entreprise_id === $e->id, 403);
        Reponse::where('avis_id', $avis->id)->delete();

        return response()->json(['message' => 'Réponse supprimée.']);
    }

    /** L'entreprise signale un avis abusif : il passe en attente de modération et n'est plus affiché. */
    public function signaler(Request $request, Avis $avis): JsonResponse
    {
        $e = $this->mine($request);
        abort_unless($avis->entreprise_id === $e->id, 403);
        $data = $request->validate(['motif' => ['required', 'string', 'min:5', 'max:255']]);
        abort_if($avis->statut === 'masque', 422, 'Cet avis a déjà été retiré.');
        $avis->update(['statut' => 'signale', 'motif_signalement' => strip_tags($data['motif'])]);

        return response()->json($avis->fresh('reponse'));
    }

    public function stats(Request $request): JsonResponse
    {
        $e = $this->mine($request);
        $base = Avis::where('entreprise_id', $e->id)->where('statut', 'publie');
        $parMois = (clone $base)->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as mois"), DB::raw('count(*) as total'), DB::raw('round(avg(note),2) as moyenne'))
            ->groupBy('mois')->orderBy('mois')->get()->keyBy('mois');
        $serie = collect(range(5, 0))->map(function ($i) use ($parMois) {
            $m = now()->subMonths($i)->format('Y-m');

            return ['mois' => $m, 'total' => (int) ($parMois[$m]->total ?? 0), 'moyenne' => isset($parMois[$m]) ? (float) $parMois[$m]->moyenne : null];
        });
        $dist = (clone $base)->select('note', DB::raw('count(*) as total'))->groupBy('note')->pluck('total', 'note');
        $total = (clone $base)->count();

        return response()->json([
            'total' => $total,
            'moyenne' => $total ? round((float) (clone $base)->avg('note'), 2) : null,
            'verifies' => (clone $base)->where('verifie', true)->count(),
            'sans_reponse' => (clone $base)->doesntHave('reponse')->count(),
            'signales' => Avis::where('entreprise_id', $e->id)->where('statut', 'signale')->count(),
            'repartition' => collect([5, 4, 3, 2, 1])->map(fn ($n) => ['note' => $n, 'total' => (int) ($dist[$n] ?? 0)]),
            'evolution' => $serie,
        ]);
    }

    public function codes(Request $request): JsonResponse
    {
        $e = $this->mine($request);

        return response()->json($e->codes()->latest()->limit(50)->get());
    }

    public function genererCodes(Request $request): JsonResponse
    {
        $e = $this->mine($request);
        $n = (int) $request->validate(['nombre' => ['required', 'integer', 'between:1,10']])['nombre'];
        $out = [];
        for ($i = 0; $i < $n; $i++) {
            do {
                $c = strtoupper(Str::random(6));
            } while (CodeVerification::where('code', $c)->exists());
            $out[] = CodeVerification::create(['entreprise_id' => $e->id, 'code' => $c]);
        }

        return response()->json($out, 201);
    }
}
