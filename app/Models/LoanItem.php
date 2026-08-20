<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanItem extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['checklist' => 'array', 'return_checklist' => 'array', 'photos_out' => 'array', 'photos_in' => 'array'];
    }

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function toolType()
    {
        return $this->belongsTo(ToolType::class);
    }

    public function unit()
    {
        return $this->belongsTo(ToolUnit::class, 'unit_id');
    }

    public function physicalToken()
    {
        return $this->belongsTo(PhysicalToken::class);
    }
}
