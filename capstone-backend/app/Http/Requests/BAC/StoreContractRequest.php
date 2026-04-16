<?php

namespace App\Http\Requests\BAC;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'duration_days' => 'required|integer|min:1|max:1825',
        ];
    }

    public function messages(): array
    {
        return [
            'duration_days.max' => 'Contract duration cannot exceed 5 years (1825 days).',
        ];
    }
}
