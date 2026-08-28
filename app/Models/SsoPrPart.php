<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SsoPrPart extends Model
{
    protected $connection = 'sso';

    protected $table = 'pr_part';

    public $timestamps = false;

    protected $guarded = ['*'];

    public function purchaseRequest()
    {
        return $this->belongsTo(SsoPurchaseRequest::class, 'pr_id');
    }
}
