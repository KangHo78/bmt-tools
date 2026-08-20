<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockAuditItem extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['scanned_at' => 'datetime'];
    }

    public function audit()
    {
        return $this->belongsTo(StockAudit::class, 'stock_audit_id');
    }

    public function unit()
    {
        return $this->belongsTo(ToolUnit::class);
    }

    public function expectedLocation()
    {
        return $this->belongsTo(Location::class, 'expected_location_id');
    }

    public function actualLocation()
    {
        return $this->belongsTo(Location::class, 'actual_location_id');
    }
}
