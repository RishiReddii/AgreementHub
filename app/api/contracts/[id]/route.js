import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { isImmutable, CONTRACT_STATES } from '@/lib/lifecycle';

// GET /api/contracts/[id] - Get a single contract
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const contracts = await getCollection('contracts');
    const contract = await contracts.findOne({ id });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

// PUT /api/contracts/[id] - Update contract field values
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, fieldValues } = body;

    const contracts = await getCollection('contracts');
    const existing = await contracts.findOne({ id });

    if (!existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if contract is immutable
    if (isImmutable(existing.status)) {
      return NextResponse.json({ 
        error: `Cannot modify contract in ${existing.status} state` 
      }, { status: 400 });
    }

    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (fieldValues !== undefined) {
      // Update field values
      updateData.fields = existing.fields.map(field => {
        if (fieldValues.hasOwnProperty(field.id)) {
          const newValue = fieldValues[field.id];
          let value;

          switch (field.type) {
            case 'checkbox':
              value = newValue === true || newValue === 'true';
              break;
            case 'date':
              value = newValue || null;
              break;
            case 'signature':
              value = newValue || null;
              break;
            case 'text':
            default:
              value = newValue !== undefined ? String(newValue) : '';
              break;
          }

          return { ...field, value };
        }
        return field;
      });
    }

    await contracts.updateOne({ id }, { $set: updateData });
    const updated = await contracts.findOne({ id });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

// DELETE /api/contracts/[id] - Delete a contract (only if in created state)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const contracts = await getCollection('contracts');
    const existing = await contracts.findOne({ id });

    if (!existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Only allow deletion of contracts in 'created' state
    if (existing.status !== CONTRACT_STATES.CREATED) {
      return NextResponse.json({ 
        error: 'Can only delete contracts in "created" state' 
      }, { status: 400 });
    }

    await contracts.deleteOne({ id });
    return NextResponse.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
