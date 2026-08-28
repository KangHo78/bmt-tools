<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SsoPurchaseOrderItem extends Model
{
    protected $connection = 'sso';

    protected $table = 'purchase_order_item';

    public $timestamps = false;

    protected $guarded = ['*'];

    public function purchaseOrder()
    {
        return $this->belongsTo(SsoPurchaseOrder::class, 'purchase_order_id');
    }

    public function item()
    {
        return $this->belongsTo(SsoItem::class, 'item_id');
    }
}
