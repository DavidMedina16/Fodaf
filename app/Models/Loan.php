<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Loan extends Model
{
    use HasFactory;

    protected $table = 'loan';

    protected $fillable = ['requested_by', 'quantity'];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvers(): HasMany
    {
        return $this->hasMany(LoanApprover::class, 'loan_id');
    }
}
