<?php

namespace App\Http\Requests\BAC;

use Illuminate\Foundation\Http\FormRequest;

class PostQualificationEvaluateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'legal_compliance' => 'required|array',
            'legal_compliance.*.item' => 'required|string',
            'legal_compliance.*.passed' => 'required|boolean',
            'technical_compliance' => 'required|array',
            'technical_compliance.*.item' => 'required|string',
            'technical_compliance.*.passed' => 'required|boolean',
            'financial_compliance' => 'required|array',
            'financial_compliance.*.item' => 'required|string',
            'financial_compliance.*.passed' => 'required|boolean',
            'overall_remarks' => 'nullable|string|max:2000',
            'result' => 'required|in:Pass,Fail',
        ];
    }
}
