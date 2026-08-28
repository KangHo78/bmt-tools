<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SsoPurchaseOrder extends Model
{
    protected $connection = 'sso';

    protected $table = 'purchase_order';

    public $timestamps = false;

    protected $guarded = ['*'];

    public function items()
    {
        return $this->hasMany(SsoPurchaseOrderItem::class, 'purchase_order_id');
    }

    public function requester()
    {
        return $this->belongsTo(SsoUser::class, 'created_by');
    }
}
