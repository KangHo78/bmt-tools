<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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

    public function hasGroup(string $username): bool
    {
        return $this->getConnection()->table('user_group')
            ->join('users as groups', 'groups.id', '=', 'user_group.group_id')
            ->where('user_group.user_id', $this->getKey())
            ->where('user_group.flag', 1)
            ->where('groups.username', $username)
            ->where('groups.is_group', 1)
            ->where('groups.is_active', 1)
            ->exists();
    }
}
