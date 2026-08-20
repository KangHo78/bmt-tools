<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ToolType extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['checklist' => 'array', 'requires_outside_letter' => 'boolean'];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function primaryLocation()
    {
        return $this->belongsTo(Location::class, 'primary_location_id');
    }

    public function units()
    {
        return $this->hasMany(ToolUnit::class);
    }
}
