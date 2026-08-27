<?php

namespace Tests\Unit;

use App\Models\ToolType;
use Tests\TestCase;

class ToolTypeCatalogImageTest extends TestCase
{
    public function test_it_resolves_buana_multi_image_paths_for_the_catalog(): void
    {
        config(['sso.uploads_url' => 'https://main.example.test/api/uploads']);

        $toolType = new ToolType(['image_url' => 'tools/cordless-drill.webp']);

        $this->assertSame(
            'https://main.example.test/api/uploads/tools/cordless-drill.webp',
            $toolType->catalog_image_url,
        );
    }

    public function test_it_keeps_absolute_image_urls(): void
    {
        $toolType = new ToolType(['image_url' => 'https://cdn.example.test/tool.jpg']);

        $this->assertSame('https://cdn.example.test/tool.jpg', $toolType->catalog_image_url);
    }

    public function test_it_does_not_render_non_image_datasheets(): void
    {
        $toolType = new ToolType(['image_url' => 'documents/tool-manual.pdf']);

        $this->assertNull($toolType->catalog_image_url);
    }
}
