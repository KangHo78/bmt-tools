<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssetReceipt extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['received_date' => 'date'];
    }

    public function items()
    {
        return $this->hasMany(AssetReceiptItem::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
