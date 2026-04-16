<?php

return [
    /*
    |--------------------------------------------------------------------------
    | APP Planning Reference Data
    |--------------------------------------------------------------------------
    | Seed-level defaults for capstone/demo use. These can be moved to
    | master tables later without changing API contracts.
    */
    'mfo_options' => [
        ['code' => 'MFO-HEALTH', 'name' => 'Public Health Services'],
        ['code' => 'MFO-INFRA', 'name' => 'Infrastructure Development Services'],
        ['code' => 'MFO-EDU', 'name' => 'Education Support Services'],
        ['code' => 'MFO-GEN', 'name' => 'General Administrative Services'],
    ],

    'pap_codes' => [
        'PAP-2026-HEALTH-001',
        'PAP-2026-INFRA-001',
        'PAP-2026-EDU-001',
        'PAP-2026-GEN-001',
    ],

    'uacs_object_codes' => [
        '50203010',
        '50203090',
        '50604010',
        '50299990',
    ],

    'budget_references' => [
        'LB-2026-ORD-001',
        'LB-2026-ORD-002',
        'GAA-2026-LGU-001',
    ],
];
