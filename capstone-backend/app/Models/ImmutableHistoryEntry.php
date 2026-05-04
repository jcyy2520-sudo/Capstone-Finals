<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImmutableHistoryEntry extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'table_name',
        'record_id',
        'operation',
        'old_snapshot',
        'new_snapshot',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'old_snapshot' => 'array',
            'new_snapshot' => 'array',
            'recorded_at' => 'datetime',
        ];
    }
}