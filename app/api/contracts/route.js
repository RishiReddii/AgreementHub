import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { CONTRACT_STATES } from '@/lib/lifecycle';

// GET /api/contracts - List all contracts with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const blueprintId = searchParams.get('blueprintId');

    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      // Map category to statuses
      const categoryMap = {
        'active': [CONTRACT_STATES.SENT],
        'pending': [CONTRACT_STATES.CREATED, CONTRACT_STATES.APPROVED],
        'signed': [CONTRACT_STATES.SIGNED, CONTRACT_STATES.LOCKED],
        'revoked': [CONTRACT_STATES.REVOKED]
      };
      if (categoryMap[category]) {
        query.status = { $in: categoryMap[category] };
      }
    }

    if (blueprintId) {
      query.blueprintId = blueprintId;
    }

    const contracts = await getCollection('contracts');
    const result = await contracts.find(query).sort({ createdAt: -1 }).limit(1000).toArray();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

// POST /api/contracts - Create a new contract from a blueprint
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, blueprintId, fieldValues } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Contract name is required' }, { status: 400 });
    }

    if (!blueprintId) {
      return NextResponse.json({ error: 'Blueprint ID is required' }, { status: 400 });
    }

    // Fetch the blueprint
    const blueprints = await getCollection('blueprints');
    const blueprint = await blueprints.findOne({ id: blueprintId });

    if (!blueprint) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    // Create contract fields from blueprint, with optional initial values
    const contractFields = blueprint.fields.map(field => {
      const initialValue = fieldValues?.[field.id];
      let value = null;

      switch (field.type) {
        case 'checkbox':
          value = initialValue === true || initialValue === 'true' ? true : false;
          break;
        case 'date':
          value = initialValue || null;
          break;
        case 'signature':
          value = initialValue || null;
          break;
        case 'text':
        default:
          value = initialValue || '';
          break;
      }

      return {
        id: field.id,
        type: field.type,
        label: field.label,
        position: field.position,
        required: field.required,
        value
      };
    });

    const contract = {
      id: uuidv4(),
      name: name.trim(),
      blueprintId: blueprint.id,
      blueprintName: blueprint.name,
      status: CONTRACT_STATES.CREATED,
      fields: contractFields,
      statusHistory: [
        {
          status: CONTRACT_STATES.CREATED,
          timestamp: new Date().toISOString(),
          note: 'Contract created'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const contracts = await getCollection('contracts');
    await contracts.insertOne(contract);

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
