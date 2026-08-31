<?php

namespace App\Support;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ApprovalConfiguration
{
    public const SETTING_KEY = 'approval_user_ids';

    public const OWNER_APPROVAL_REQUIRED_KEY = 'outside_owner_approval_required';

    public function ownerApprovalRequired(): bool
    {
        $value = SystemSetting::query()
            ->where('key', self::OWNER_APPROVAL_REQUIRED_KEY)
            ->value('value');

        if ($value === null) {
            return true;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    public function isApprover(?User $user): bool
    {
        return $user !== null
            && $user->is_active
            && in_array($user->id, $this->approverIds(), true);
    }

    /** @return list<int> */
    public function approverIds(): array
    {
        $setting = SystemSetting::query()->where('key', self::SETTING_KEY)->first();

        if (! $setting) {
            return $this->eligibleQuery()->pluck('id')->map(fn ($id) => (int) $id)->all();
        }

        $ids = json_decode((string) $setting->value, true);
        if (! is_array($ids)) {
            return [];
        }

        return $this->eligibleQuery()
            ->whereIn('id', array_map('intval', $ids))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /** @return Collection<int, User> */
    public function approvers(): Collection
    {
        return $this->eligibleQuery()->whereIn('id', $this->approverIds())->orderBy('name')->get();
    }

    public function eligibleQuery(): Builder
    {
        return User::query()
            ->where('is_active', true)
            ->whereIn('role', ['kepala_logistik', 'admin']);
    }
}
