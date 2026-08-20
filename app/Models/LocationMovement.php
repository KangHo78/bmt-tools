<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationMovement extends Model
{
    protected $guarded = [];

    public function unit()
    {
        return $this->belongsTo(ToolUnit::class, 'tool_unit_id');
    }

    public function fromLocation()
    {
        return $this->belongsTo(Location::class, 'from_location_id');
    }

    public function toLocation()
    {
        return $this->belongsTo(Location::class, 'to_location_id');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'moved_by');
    }
}
