<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssetReceiptItem extends Model
{
    protected $guarded = [];

    public function receipt()
    {
        return $this->belongsTo(AssetReceipt::class, 'asset_receipt_id');
    }

    public function toolType()
    {
        return $this->belongsTo(ToolType::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function units()
    {
        return $this->hasMany(ToolUnit::class);
    }
}
