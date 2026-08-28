<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SsoPrSubledger extends Model
{
    protected $connection = 'sso';

    protected $table = 'pr_subledger';

    public $timestamps = false;

    protected $guarded = ['*'];

    public function part()
    {
        return $this->belongsTo(SsoPrPart::class, 'pr_part_id');
    }
}
