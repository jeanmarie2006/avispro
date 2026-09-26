<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Entreprise extends Model
{
    protected $table = 'entreprises';

    protected $guarded = [];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function avis(): HasMany
    {
        return $this->hasMany(Avis::class);
    }

    public function codes(): HasMany
    {
        return $this->hasMany(CodeVerification::class);
    }

    public static function uniqueSlug(string $nom): string
    {
        $base = Str::slug($nom) ?: 'entreprise';
        $slug = $base;
        $i = 2;
        while (static::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    /** Note moyenne et nombre d'avis publiés, ajoutés à une requête. */
    public function scopeWithStats($query)
    {
        return $query
            ->withCount(['avis as avis_count' => fn ($q) => $q->where('statut', 'publie')])
            ->withAvg(['avis as note_moyenne' => fn ($q) => $q->where('statut', 'publie')], 'note');
    }
}
