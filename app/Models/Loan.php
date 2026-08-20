<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['start_date' => 'datetime', 'due_date' => 'datetime', 'approved_at' => 'datetime', 'handover_at' => 'datetime', 'returned_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function borrower()
    {
        return $this->belongsTo(Borrower::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function items()
    {
        return $this->hasMany(LoanItem::class);
    }

    public function extensions()
    {
        return $this->hasMany(LoanExtension::class);
    }
}
