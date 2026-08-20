<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssetCase extends Model
{
    protected $guarded = [];

    protected $table = 'asset_cases';

    protected function casts(): array
    {
        return ['has_evidence' => 'boolean', 'has_berita_acara' => 'boolean', 'has_decision' => 'boolean', 'evidence_urls' => 'array', 'closed_at' => 'datetime'];
    }

    public function unit()
    {
        return $this->belongsTo(ToolUnit::class);
    }

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function responsibleUser()
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function replacementUnit()
    {
        return $this->belongsTo(ToolUnit::class, 'replacement_unit_id');
    }
}
