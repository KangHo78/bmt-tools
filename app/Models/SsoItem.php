<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class SsoItem extends Model
{
    protected $connection = 'sso';

    protected $table = 'm_item';

    public $timestamps = false;

    protected $guarded = ['*'];

    public function scopeTools(Builder $query): Builder
    {
        return $query
            ->where('is_active', 1)
            ->where('flag', 1)
            ->where('item_type', 'Tool')
            ->whereNotNull('item_no')
            ->where('item_no', '!=', '');
    }
}
