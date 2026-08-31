<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ToolType extends Model
{
    protected $guarded = [];

    protected $appends = ['catalog_image_url'];

    protected function casts(): array
    {
        return ['checklist' => 'array', 'requires_outside_letter' => 'boolean'];
    }

    public function getCatalogImageUrlAttribute(): ?string
    {
        $source = trim((string) $this->image_url);
        if ($source === '') {
            return null;
        }

        $path = parse_url($source, PHP_URL_PATH) ?: $source;
        if (! preg_match('/\.(?:avif|gif|jpe?g|png|svg|webp)$/i', $path)) {
            return null;
        }

        if (filter_var($source, FILTER_VALIDATE_URL)) {
            return $source;
        }

        $path = ltrim(str_replace('\\', '/', $source), '/');
        $path = preg_replace('#^(?:api/)?uploads/#i', '', $path);

        return rtrim((string) config('sso.uploads_url'), '/').'/'.$path;
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

    public function availableUnits()
    {
        return $this->hasMany(ToolUnit::class)
            ->where('status', 'tersedia')
            ->orderByRaw('CASE WHEN owner_sso_user_id IS NULL THEN 1 ELSE 0 END')
            ->orderBy('id');
    }

    public function checklistItems()
    {
        return $this->belongsToMany(ChecklistItem::class)
            ->withPivot('position')
            ->orderByPivot('position');
    }
}
