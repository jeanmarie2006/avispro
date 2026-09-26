<?php

namespace App\Http\Controllers;

use App\Models\Avis;
use App\Models\Entreprise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Modération : l'administrateur tranche les avis signalés par les entreprises. */
class AdminController extends Controller
{
    private function guard(Request $request): void
    {
        abort_unless($request->user()->isAdmin(), 403, 'Réservé aux administrateurs.');
    }

    public function avis(Request $request): JsonResponse
    {
        $this->guard($request);
        $statut = $request->query('statut', 'signale');

        return response()->json(Avis::with('entreprise:id,nom,slug')->where('statut', $statut)->latest()->paginate(15));
    }

    public function moderer(Request $request, Avis $avis): JsonResponse
    {
        $this->guard($request);
        $action = $request->validate(['action' => ['required', 'in:garder,masquer']])['action'];
        $avis->update(['statut' => $action === 'garder' ? 'publie' : 'masque', 'motif_signalement' => $action === 'garder' ? null : $avis->motif_signalement]);

        return response()->json($avis);
    }

    public function resume(Request $request): JsonResponse
    {
        $this->guard($request);

        return response()->json([
            'entreprises' => Entreprise::count(),
            'avis' => Avis::where('statut', 'publie')->count(),
            'signales' => Avis::where('statut', 'signale')->count(),
            'masques' => Avis::where('statut', 'masque')->count(),
        ]);
    }
}
