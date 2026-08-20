<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemNotification extends Model
{
    protected $guarded = [];

    protected $table = 'notifications';

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }
}
