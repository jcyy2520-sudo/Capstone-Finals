<?php

namespace App\Http\Requests\BAC;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contact_person' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'sometimes|string|max:30',
            'address' => 'sometimes|string|max:500',
            'categories' => 'sometimes|array',
            'categories.*' => 'string|in:goods,services,infrastructure_works,consulting_services',
        ];
    }
}
