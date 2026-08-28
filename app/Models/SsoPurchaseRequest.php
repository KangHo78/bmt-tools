<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SsoPurchaseRequest extends Model
{
    protected $connection = 'sso';

    protected $table = 'pr';

    public $timestamps = false;

    protected $guarded = ['*'];

    public function requester()
    {
        return $this->belongsTo(SsoUser::class, 'pr_peminta');
    }
}
