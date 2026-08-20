<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ToolUnit extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['received_at' => 'date', 'last_audited_at' => 'datetime'];
    }

    public function toolType()
    {
        return $this->belongsTo(ToolType::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function movements()
    {
        return $this->hasMany(LocationMovement::class);
    }

    public function receiptItem()
    {
        return $this->belongsTo(AssetReceiptItem::class, 'asset_receipt_item_id');
    }
}
