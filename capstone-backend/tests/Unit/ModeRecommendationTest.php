<?php

namespace Tests\Unit;

use App\Services\AppEntryService;
use PHPUnit\Framework\TestCase;

class ModeRecommendationTest extends TestCase
{
    public function test_shopping_for_small_amounts(): void
    {
        $result = AppEntryService::recommendMode(25000);
        $this->assertEquals('shopping', $result['mode']);
    }

    public function test_shopping_at_threshold(): void
    {
        $result = AppEntryService::recommendMode(50000);
        $this->assertEquals('shopping', $result['mode']);
    }

    public function test_small_value_above_shopping(): void
    {
        $result = AppEntryService::recommendMode(500000);
        $this->assertEquals('small_value', $result['mode']);
    }

    public function test_small_value_at_one_million(): void
    {
        $result = AppEntryService::recommendMode(1000000);
        $this->assertEquals('small_value', $result['mode']);
    }

    public function test_small_value_up_to_two_million(): void
    {
        $result = AppEntryService::recommendMode(2000000);
        $this->assertEquals('small_value', $result['mode']);
    }

    public function test_competitive_bidding_above_two_million(): void
    {
        $result = AppEntryService::recommendMode(2000001);
        $this->assertEquals('competitive_bidding', $result['mode']);
    }

    public function test_competitive_bidding_large_amount(): void
    {
        $result = AppEntryService::recommendMode(100000000);
        $this->assertEquals('competitive_bidding', $result['mode']);
    }

    public function test_result_has_label(): void
    {
        $result = AppEntryService::recommendMode(50000);
        $this->assertArrayHasKey('label', $result);
        $this->assertNotEmpty($result['label']);
    }
}
