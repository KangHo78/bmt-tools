<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceOrder extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['scheduled_date' => 'date', 'completed_date' => 'date', 'next_schedule_date' => 'date', 'cost' => 'decimal:2'];
    }

    public function unit()
    {
        return $this->belongsTo(ToolUnit::class);
    }
}
