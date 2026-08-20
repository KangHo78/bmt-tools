<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhysicalToken extends Model
{
    protected $guarded = [];

    public function borrower()
    {
        return $this->belongsTo(Borrower::class);
    }

    public function loanItems()
    {
        return $this->hasMany(LoanItem::class);
    }
}
