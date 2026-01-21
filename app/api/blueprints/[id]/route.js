import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

// GET /api/blueprints/[id] - Get a single blueprint
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const blueprints = await getCollection('blueprints');
    const blueprint = await blueprints.findOne({ id });

    if (!blueprint) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    return NextResponse.json(blueprint);
  } catch (error) {
    console.error('Error fetching blueprint:', error);
    return NextResponse.json({ error: 'Failed to fetch blueprint' }, { status: 500 });
  }
}

// PUT /api/blueprints/[id] - Update a blueprint
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, fields } = body;

    const blueprints = await getCollection('blueprints');
    const existing = await blueprints.findOne({ id });

    if (!existing) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    // Check if blueprint is used in any contracts
    const contracts = await getCollection('contracts');
    const contractCount = await contracts.countDocuments({ blueprintId: id });
    if (contractCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot modify blueprint that has existing contracts. Create a new version instead.' 
      }, { status: 400 });
    }

    // Validation
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (fields !== undefined) {
      if (!Array.isArray(fields) || fields.length === 0) {
        return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
      }

      const validFieldTypes = ['text', 'date', 'signature', 'checkbox'];
      for (const field of fields) {
        if (!field.type || !validFieldTypes.includes(field.type)) {
          return NextResponse.json({ error: `Invalid field type: ${field.type}` }, { status: 400 });
        }
        if (!field.label || typeof field.label !== 'string') {
          return NextResponse.json({ error: 'Each field must have a label' }, { status: 400 });
        }
      }
    }

    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (fields !== undefined) {
      updateData.fields = fields.map((f, index) => ({
        id: f.id || existing.fields[index]?.id || require('uuid').v4(),
        type: f.type,
        label: f.label.trim(),
        position: f.position || { x: 0, y: index * 60 },
        required: f.required || false
      }));
    }

    await blueprints.updateOne({ id }, { $set: updateData });
    const updated = await blueprints.findOne({ id });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating blueprint:', error);
    return NextResponse.json({ error: 'Failed to update blueprint' }, { status: 500 });
  }
}

// DELETE /api/blueprints/[id] - Delete a blueprint
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const blueprints = await getCollection('blueprints');
    const existing = await blueprints.findOne({ id });

    if (!existing) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    // Check if blueprint is used in any contracts
    const contracts = await getCollection('contracts');
    const contractCount = await contracts.countDocuments({ blueprintId: id });
    if (contractCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete blueprint that has existing contracts' 
      }, { status: 400 });
    }

    await blueprints.deleteOne({ id });
    return NextResponse.json({ message: 'Blueprint deleted successfully' });
  } catch (error) {
    console.error('Error deleting blueprint:', error);
    return NextResponse.json({ error: 'Failed to delete blueprint' }, { status: 500 });
  }
}
