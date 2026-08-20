<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'sso.enabled' => true,
            'sso.main_app_url' => 'https://main.example.test',
            'database.connections.sso' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
                'foreign_key_constraints' => true,
            ],
        ]);

        DB::purge('sso');

        Schema::connection('sso')->create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username');
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('no_hp')->nullable();
            $table->boolean('is_group')->default(false);
            $table->boolean('is_active')->default(true);
        });

        Schema::connection('sso')->create('user_group', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('group_id');
            $table->boolean('flag')->default(true);
        });

        $this->createSsoUser(217, 'TOOLS_MANAGEMENT_USER', 'Tools Management User', null, true);
        $this->createSsoUser(218, 'TOOLS_MANAGEMENT_ADMIN', 'Tools Management Admin', null, true);
        $this->createSsoUser(219, 'TOOLS_MANAGEMENT_ADMINISTRATOR', 'Tools Management Administrator', null, true);
    }

    public function test_login_route_redirects_to_main_application(): void
    {
        $this->get('/login')->assertRedirect('https://main.example.test');
        $this->post('/login')->assertMethodNotAllowed();
    }

    public function test_sso_cookie_links_an_existing_local_user_and_authenticates_it(): void
    {
        $localUser = User::factory()->create([
            'email' => 'user@example.test',
            'role' => 'admin',
        ]);
        $this->createSsoUser(166, 'USER166', 'User SSO', 'user@example.test');
        $this->assignGroup(166, 'TOOLS_MANAGEMENT_ADMIN');

        $response = $this->withUnencryptedCookie('uuid', '166')->get('/');

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertAuthenticatedAs($localUser);
        $this->assertDatabaseHas('users', [
            'id' => $localUser->id,
            'sso_user_id' => 166,
            'sso_username' => 'USER166',
            'name' => 'User SSO',
            'role' => 'petugas',
        ]);
    }

    public function test_sso_cookie_creates_a_local_profile_for_a_new_user(): void
    {
        $this->createSsoUser(200, 'NEWUSER', 'Pengguna Baru', 'new@example.test');
        $this->assignGroup(200, 'TOOLS_MANAGEMENT_USER');

        $this->withUnencryptedCookie('uuid', '200')->get('/')->assertRedirect('/dashboard');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'sso_user_id' => 200,
            'email' => 'new@example.test',
            'role' => 'user',
            'is_active' => true,
        ]);
    }

    public function test_sso_user_without_email_gets_a_stable_local_fallback(): void
    {
        $this->createSsoUser(166, 'kevin', 'Kevin Susilo', null);
        $this->assignGroup(166, 'TOOLS_MANAGEMENT_USER');

        $this->withUnencryptedCookie('uuid', '166')->get('/')->assertRedirect('/dashboard');

        $this->assertDatabaseHas('users', [
            'sso_user_id' => 166,
            'email' => 'sso-166@users.invalid',
            'name' => 'Kevin Susilo',
        ]);
    }

    public function test_missing_sso_cookie_ends_an_existing_local_session(): void
    {
        $localUser = User::factory()->create(['sso_user_id' => 166]);

        $this->actingAs($localUser)->get('/')->assertRedirect(route('login'));

        $this->assertGuest();
    }

    public function test_user_without_a_tools_management_group_is_forbidden(): void
    {
        $this->createSsoUser(166, 'USER166', 'User SSO', 'user@example.test');

        $this->withUnencryptedCookie('uuid', '166')->get('/dashboard')->assertForbidden();
    }

    public function test_highest_tools_management_group_determines_the_local_role(): void
    {
        $this->createSsoUser(166, 'USER166', 'User SSO', 'user@example.test');
        $this->assignGroup(166, 'TOOLS_MANAGEMENT_USER');
        $this->assignGroup(166, 'TOOLS_MANAGEMENT_ADMIN');

        $this->withUnencryptedCookie('uuid', '166')->get('/dashboard')->assertOk();
        $this->assertDatabaseHas('users', ['sso_user_id' => 166, 'role' => 'petugas']);

        $this->assignGroup(166, 'TOOLS_MANAGEMENT_ADMINISTRATOR');

        $this->withUnencryptedCookie('uuid', '166')->get('/dashboard')->assertOk();
        $this->assertDatabaseHas('users', ['sso_user_id' => 166, 'role' => 'admin']);
    }

    private function createSsoUser(
        int $id,
        string $username,
        string $name,
        ?string $email,
        bool $isGroup = false,
    ): void {
        DB::connection('sso')->table('users')->insert([
            'id' => $id,
            'username' => $username,
            'name' => $name,
            'email' => $email,
            'no_hp' => null,
            'is_group' => $isGroup,
            'is_active' => true,
        ]);
    }

    private function assignGroup(int $userId, string $groupUsername): void
    {
        $groupId = DB::connection('sso')->table('users')
            ->where('username', $groupUsername)
            ->value('id');

        DB::connection('sso')->table('user_group')->insert([
            'user_id' => $userId,
            'group_id' => $groupId,
            'flag' => true,
        ]);
    }
}
