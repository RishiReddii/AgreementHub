import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /api/blueprints - List all blueprints
export async function GET(request) {
  try {
    const blueprints = await getCollection('blueprints');
    const result = await blueprints.find({}).sort({ createdAt: -1 }).limit(1000).toArray();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching blueprints:', error);
    return NextResponse.json({ error: 'Failed to fetch blueprints' }, { status: 500 });
  }
}

// POST /api/blueprints - Create a new blueprint
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, fields } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
    }

    // Validate each field
    const validFieldTypes = ['text', 'date', 'signature', 'checkbox'];
    for (const field of fields) {
      if (!field.type || !validFieldTypes.includes(field.type)) {
        return NextResponse.json({ error: `Invalid field type: ${field.type}` }, { status: 400 });
      }
      if (!field.label || typeof field.label !== 'string') {
        return NextResponse.json({ error: 'Each field must have a label' }, { status: 400 });
      }
    }

    const blueprint = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || '',
      fields: fields.map((f, index) => ({
        id: f.id || uuidv4(),
        type: f.type,
        label: f.label.trim(),
        position: f.position || { x: 0, y: index * 60 },
        required: f.required || false
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const blueprints = await getCollection('blueprints');
    await blueprints.insertOne(blueprint);

    return NextResponse.json(blueprint, { status: 201 });
  } catch (error) {
    console.error('Error creating blueprint:', error);
    return NextResponse.json({ error: 'Failed to create blueprint' }, { status: 500 });
  }
}
