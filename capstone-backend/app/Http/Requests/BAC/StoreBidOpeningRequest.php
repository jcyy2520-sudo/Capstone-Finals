<?php

namespace App\Http\Requests\BAC;

use Illuminate\Foundation\Http\FormRequest;

class StoreBidOpeningRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invitation_id' => 'required|exists:invitations,id',
            'bac_members_present' => 'required|array|min:3',
            'bac_members_present.*' => 'required|exists:users,id',
            'observers_present' => 'nullable|array',
            'observers_present.*' => 'string',
            'bidder_attendance' => 'nullable|array',
            'bidder_attendance.*.vendor_id' => 'required|exists:vendors,id',
            'bidder_attendance.*.present' => 'required|boolean',
        ];
    }
}
