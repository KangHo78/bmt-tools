<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $usersByName = DB::table('users')
            ->whereNotNull('sso_user_id')
            ->get(['name', 'sso_user_id'])
            ->groupBy(fn ($user) => mb_strtolower(trim((string) $user->name)))
            ->filter(fn ($users) => $users->count() === 1)
            ->map(fn ($users) => $users->first()->sso_user_id);

        DB::table('tool_units')
            ->whereNull('owner_sso_user_id')
            ->whereNotNull('owner')
            ->orderBy('id')
            ->chunkById(200, function ($units) use ($usersByName): void {
                foreach ($units as $unit) {
                    $ownerSsoUserId = $usersByName[mb_strtolower(trim((string) $unit->owner))] ?? null;
                    if ($ownerSsoUserId) {
                        DB::table('tool_units')->where('id', $unit->id)->update(['owner_sso_user_id' => $ownerSsoUserId]);
                    }
                }
            });
    }

    public function down(): void
    {
        // Ownership links may have been edited after migration; do not erase them on rollback.
    }
};
