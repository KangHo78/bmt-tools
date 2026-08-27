<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SsoNpb extends Model
{
    protected $connection = 'sso';

    protected $table = 'npb';

    public $timestamps = false;

    protected $guarded = ['*'];

    public function items()
    {
        return $this->hasMany(SsoNpbItem::class, 'npb_id');
    }

    public function requester()
    {
        return $this->belongsTo(SsoUser::class, 'peminta_id');
    }
}
