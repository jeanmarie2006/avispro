<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CodeVerification extends Model
{
    protected $table = 'codes_verification';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['utilise_le' => 'datetime'];
    }
}
