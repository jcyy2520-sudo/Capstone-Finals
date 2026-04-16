<?php

namespace App\Http\Requests\Department;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequisitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'app_entry_id' => 'required|exists:app_entries,id',
            'department_id' => 'required|exists:departments,id',
            'purpose' => 'required|string',
            'date_required' => 'required|date|after:today',
            'urgency_level' => 'nullable|in:routine,urgent,emergency',
            'line_items' => 'required|array|min:1',
            'line_items.*.item_description' => 'required|string',
            'line_items.*.unit_of_measure' => 'required|string|max:50',
            'line_items.*.quantity' => 'required|integer|min:1',
            'line_items.*.unit_cost' => 'required|numeric|min:0.01',
            'status' => 'nullable|in:draft,pending_dh_endorsement',
        ];
    }
}
