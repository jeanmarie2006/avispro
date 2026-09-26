<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Avis extends Model
{
    protected $table = 'avis';

    protected $guarded = [];

    protected $hidden = ['ip_hash'];

    protected function casts(): array
    {
        return ['verifie' => 'boolean', 'note' => 'integer'];
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class);
    }

    public function reponse(): HasOne
    {
        return $this->hasOne(Reponse::class, 'avis_id');
    }
}
