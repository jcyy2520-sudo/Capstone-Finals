<?php

namespace App\Http\Requests\BAC;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'purchase_requisition_id' => 'required|exists:purchase_requisitions,id',
            'submission_deadline' => 'required|date|after:now',
            'opening_date' => 'nullable|date|after_or_equal:submission_deadline',
            'payment_terms' => 'nullable|in:30_days,60_days,upon_delivery',
        ];
    }
}
