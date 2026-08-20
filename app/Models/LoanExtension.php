<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanExtension extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['old_due_date' => 'datetime', 'new_due_date' => 'datetime'];
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }
}
