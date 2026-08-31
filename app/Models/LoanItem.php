<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class LoanItem extends Model
{
    protected $guarded = [];

    protected $appends = ['handover_evidence_urls', 'return_evidence_urls'];

    protected function casts(): array
    {
        return ['checklist' => 'array', 'return_checklist' => 'array', 'photos_out' => 'array', 'photos_in' => 'array'];
    }

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function toolType()
    {
        return $this->belongsTo(ToolType::class);
    }

    public function unit()
    {
        return $this->belongsTo(ToolUnit::class, 'unit_id');
    }

    public function physicalToken()
    {
        return $this->belongsTo(PhysicalToken::class);
    }

    public function getHandoverEvidenceUrlsAttribute(): array
    {
        return $this->evidenceUrls($this->photos_out);
    }

    public function getReturnEvidenceUrlsAttribute(): array
    {
        return $this->evidenceUrls($this->photos_in);
    }

    private function evidenceUrls(?array $paths): array
    {
        return collect($paths ?? [])->filter()->map(function (string $path) {
            if (filter_var($path, FILTER_VALIDATE_URL)) {
                return $path;
            }

            return Storage::disk('public')->url($path);
        })->values()->all();
    }
}
