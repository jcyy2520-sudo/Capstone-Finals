<?php

namespace App\Http\Requests\BAC;

use Illuminate\Foundation\Http\FormRequest;

class StoreAwardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'performance_security_percentage' => 'required|numeric|min:2|max:10',
        ];
    }

    public function messages(): array
    {
        return [
            'performance_security_percentage.min' => 'Performance security must be at least 2% of contract amount.',
            'performance_security_percentage.max' => 'Performance security cannot exceed 10% of contract amount.',
        ];
    }
}
