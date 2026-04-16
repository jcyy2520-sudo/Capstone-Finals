<?php

namespace App\Http\Requests\BAC;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAppEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $mfoOptions = collect(config('procureseal.mfo_options', []));
        $mfoCodes = $mfoOptions->pluck('code')->all();
        $papCodes = config('procureseal.pap_codes', []);
        $uacsCodes = config('procureseal.uacs_object_codes', []);
        $budgetRefs = config('procureseal.budget_references', []);

        return [
            'project_title' => 'required|string|max:300',
            'description' => 'required|string',
            'mfo_code' => ['required', Rule::in($mfoCodes)],
            'pap_code' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z0-9][A-Za-z0-9\-.\/]{2,79}$/', Rule::in($papCodes)],
            'uacs_object_code' => ['required', Rule::in($uacsCodes)],
            'approved_budget_reference' => ['required', Rule::in($budgetRefs)],
            'category' => 'required|in:goods,services,infrastructure_works,consulting_services',
            'mode' => 'required|string',
            'abc' => 'required|numeric|min:1',
            'unit_of_measurement' => 'nullable|string|max:50',
            'quantity' => 'nullable|integer|min:1',
            'fund_source' => 'required|string',
            'account_code' => 'required|string',
            'implementing_unit' => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'target_start_quarter' => 'required|in:Q1,Q2,Q3,Q4',
            'target_completion_quarter' => 'required|in:Q1,Q2,Q3,Q4',
            'justification' => 'required|string',
            'fiscal_year' => 'nullable|integer',
            'status' => 'nullable|in:draft,submitted',
        ];
    }
}
