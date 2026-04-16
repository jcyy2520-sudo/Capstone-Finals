<?php

namespace App\Http\Requests\BAC;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'submission_deadline' => 'sometimes|date|after:now',
            'opening_date' => 'nullable|date|after_or_equal:submission_deadline',
            'payment_terms' => 'nullable|in:30_days,60_days,upon_delivery',
            'description' => 'nullable|string|max:2000',
            'delivery_location' => 'nullable|string|max:500',
            'delivery_period' => 'nullable|string|max:255',
        ];
    }
}
