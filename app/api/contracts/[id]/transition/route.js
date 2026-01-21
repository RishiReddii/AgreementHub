import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { isValidTransition, isImmutable, getValidNextStates, CONTRACT_STATES } from '@/lib/lifecycle';

// POST /api/contracts/[id]/transition - Change contract lifecycle status
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { newStatus, note } = body;

    // Validation
    if (!newStatus) {
      return NextResponse.json({ error: 'New status is required' }, { status: 400 });
    }

    const validStatuses = Object.values(CONTRACT_STATES);
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    const contracts = await getCollection('contracts');
    const existing = await contracts.findOne({ id });

    if (!existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if contract is already in a terminal state
    if (isImmutable(existing.status)) {
      return NextResponse.json({ 
        error: `Contract is ${existing.status} and cannot be modified` 
      }, { status: 400 });
    }

    // Validate the transition
    if (!isValidTransition(existing.status, newStatus)) {
      const validNextStates = getValidNextStates(existing.status);
      return NextResponse.json({ 
        error: `Invalid transition from ${existing.status} to ${newStatus}. Valid transitions: ${validNextStates.join(', ') || 'none'}` 
      }, { status: 400 });
    }

    // For signing, check that all required signature fields have values
    if (newStatus === CONTRACT_STATES.SIGNED) {
      const unsignedFields = existing.fields.filter(
        f => f.type === 'signature' && f.required && !f.value
      );
      if (unsignedFields.length > 0) {
        return NextResponse.json({ 
          error: `Cannot sign contract. Missing required signatures: ${unsignedFields.map(f => f.label).join(', ')}` 
        }, { status: 400 });
      }
    }

    // Create status history entry
    const historyEntry = {
      status: newStatus,
      previousStatus: existing.status,
      timestamp: new Date().toISOString(),
      note: note || `Status changed to ${newStatus}`
    };

    const updateData = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      statusHistory: [...(existing.statusHistory || []), historyEntry]
    };

    await contracts.updateOne({ id }, { $set: updateData });
    const updated = await contracts.findOne({ id });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error transitioning contract:', error);
    return NextResponse.json({ error: 'Failed to transition contract' }, { status: 500 });
  }
}
