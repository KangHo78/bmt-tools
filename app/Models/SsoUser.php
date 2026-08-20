<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class SsoUser extends Model
{
    protected $connection = 'sso';

    protected $table = 'users';

    public $timestamps = false;

    protected $guarded = [];

    protected $hidden = ['auth'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_group' => 'boolean',
        ];
    }

    /** @return Collection<int, self> */
    public static function managementUsers(): Collection
    {
        return self::query()
            ->select('users.*')
            ->join('user_group', 'user_group.user_id', '=', 'users.id')
            ->join('users as groups', 'groups.id', '=', 'user_group.group_id')
            ->where('user_group.flag', 1)
            ->whereIn('groups.username', array_values(config('sso.role_groups')))
            ->where('groups.is_group', 1)
            ->where('groups.is_active', 1)
            ->where('users.is_group', 0)
            ->where('users.is_active', 1)
            ->distinct()
            ->orderBy('users.name')
            ->get();
    }

    public function managementRole(): ?string
    {
        $groupUsernames = $this->getConnection()->table('user_group')
            ->join('users as groups', 'groups.id', '=', 'user_group.group_id')
            ->where('user_group.user_id', $this->getKey())
            ->where('user_group.flag', 1)
            ->whereIn('groups.username', array_values(config('sso.role_groups')))
            ->where('groups.is_group', 1)
            ->where('groups.is_active', 1)
            ->pluck('groups.username')
            ->all();

        foreach (config('sso.role_groups') as $role => $groupUsername) {
            if (in_array($groupUsername, $groupUsernames, true)) {
                return $role;
            }
        }

        return null;
    }
}
