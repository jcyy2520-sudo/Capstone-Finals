<?php

namespace App\Http\Requests\BAC;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vendor_id' => 'required|exists:vendors,id',
            'technical_items' => 'required|array',
            'technical_items.*.item' => 'required|string',
            'technical_items.*.result' => ['required', Rule::in(['pass', 'fail'])],
            'technical_items.*.remarks' => 'nullable|string',
            'calculated_price' => 'required|numeric|min:0',
            'arithmetic_correction_details' => 'nullable|string',
            'recommendation' => ['required', Rule::in(['responsive', 'non_responsive'])],
            'overall_remarks' => 'required|string',
        ];
    }
}
