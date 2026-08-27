<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChecklistItem extends Model
{
    protected $guarded = [];

    public function toolTypes()
    {
        return $this->belongsToMany(ToolType::class)->withPivot('position');
    }
}
