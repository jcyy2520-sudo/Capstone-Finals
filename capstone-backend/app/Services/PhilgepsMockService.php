<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * Mocks the PhilGEPS external API for creating notices.
 */
class PhilgepsMockService
{
    /**
     * Simulates posting an Invitation to Bid to PhilGEPS.
     * Returns a realistic mocked reference number and posting timestamp.
     */
    public function postNotice(array $invitationDetails): array
    {
        Log::info('Mocking PhilGEPS Notice Posting...', ['details' => $invitationDetails]);
        
        // Simulate network delay
        sleep(1);

        // Simulate random failure (10% chance) to ensure proper error handling
        if (rand(1, 100) > 95) {
            throw new \Exception('PhilGEPS API Gateway Timeout');
        }

        $mockReferenceNumber = 'PH' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));

        return [
            'success' => true,
            'philgeps_reference' => $mockReferenceNumber,
            'posted_at' => now()->toIso8601String(),
            'message' => 'Notice successfully posted to PhilGEPS (MOCKED).',
            'url' => 'https://notices.philgeps.gov.ph/mock/' . $mockReferenceNumber
        ];
    }

    /**
     * Simulates checking a vendor against the GPPB Blacklist
     */
    public function checkBlacklist(string $tin, string $businessName): array
    {
        return [
            'is_blacklisted' => false,
            'checked_at' => now()->toIso8601String(),
            'remarks' => 'Clear (MOCKED)'
        ];
    }
}
