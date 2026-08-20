<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockAudit extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['scheduled_date' => 'date'];
    }

    public function items()
    {
        return $this->hasMany(StockAuditItem::class);
    }
}
