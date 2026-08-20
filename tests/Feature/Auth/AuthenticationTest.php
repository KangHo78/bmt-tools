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
            'sso.required_group' => null,
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
            'role' => 'petugas',
        ]);
        $this->createSsoUser(166, 'USER166', 'User SSO', 'user@example.test');

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

    public function test_required_sso_group_is_enforced(): void
    {
        config(['sso.required_group' => 'TOOLS_MANAGEMENT']);
        $this->createSsoUser(166, 'USER166', 'User SSO', 'user@example.test');
        $this->createSsoUser(300, 'TOOLS_MANAGEMENT', 'Tools Group', 'group@example.test', true);

        $this->withUnencryptedCookie('uuid', '166')->get('/dashboard')->assertForbidden();

        DB::connection('sso')->table('user_group')->insert([
            'user_id' => 166,
            'group_id' => 300,
            'flag' => true,
        ]);

        $this->withUnencryptedCookie('uuid', '166')->get('/dashboard')->assertOk();
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
}
