<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SsoNpbItem extends Model
{
    protected $connection = 'sso';

    protected $table = 'npb_item';

    public $timestamps = false;

    protected $guarded = ['*'];

    public function npb()
    {
        return $this->belongsTo(SsoNpb::class, 'npb_id');
    }

    public function item()
    {
        return $this->belongsTo(SsoItem::class, 'item_id');
    }
}
