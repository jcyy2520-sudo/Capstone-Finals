<?php

namespace App\Http\Requests\BAC;

use Illuminate\Foundation\Http\FormRequest;

class StoreBidPriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vendor_id' => 'required|exists:vendors,id',
            'amount_as_read' => 'required|numeric|min:0',
            'amount_as_calculated' => 'nullable|numeric|min:0',
            'arithmetic_correction' => 'nullable|numeric',
            'remarks' => 'nullable|string|max:1000',
        ];
    }
}
