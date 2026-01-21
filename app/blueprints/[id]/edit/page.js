'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Type,
  Calendar,
  PenTool,
  CheckSquare,
  Save
} from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'signature', label: 'Signature', icon: PenTool },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare }
];

export default function EditBlueprintPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blueprint, setBlueprint] = useState(null);

  useEffect(() => {
    fetchBlueprint();
  }, [params.id]);

  const fetchBlueprint = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blueprints/${params.id}`);
      if (res.ok) {
        setBlueprint(await res.json());
      } else {
        toast.error('Blueprint not found');
        router.push('/blueprints');
      }
    } catch (error) {
      console.error('Error fetching blueprint:', error);
      toast.error('Failed to load blueprint');
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    setBlueprint(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: crypto.randomUUID(),
          type: 'text',
          label: '',
          required: false,
          position: { x: 0, y: prev.fields.length * 60 }
        }
      ]
    }));
  };

  const removeField = (id) => {
    if (blueprint.fields.length <= 1) {
      toast.error('Blueprint must have at least one field');
      return;
    }
    setBlueprint(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
  };

  const updateField = (id, updates) => {
    setBlueprint(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!blueprint.name.trim()) {
      toast.error('Please enter a blueprint name');
      return;
    }

    const emptyLabels = blueprint.fields.filter(f => !f.label.trim());
    if (emptyLabels.length > 0) {
      toast.error('All fields must have labels');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/blueprints/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blueprint)
      });

      if (res.ok) {
        toast.success('Blueprint updated successfully');
        router.push('/blueprints');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update blueprint');
      }
    } catch (error) {
      console.error('Error updating blueprint:', error);
      toast.error('Failed to update blueprint');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-teal-50/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    );
  }

  if (!blueprint) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-teal-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/blueprints">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">Edit Template</h1>
            </div>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the name and description of your blueprint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Blueprint Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Employment Agreement"
                  value={blueprint.name}
                  onChange={(e) => setBlueprint(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this blueprint..."
                  value={blueprint.description}
                  onChange={(e) => setBlueprint(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Contract Fields</CardTitle>
                  <CardDescription>Define the fields that contracts using this blueprint will have</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addField} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blueprint.fields.map((field, index) => {
                  const FieldIcon = FIELD_TYPES.find(t => t.value === field.type)?.icon || Type;
                  return (
                    <div
                      key={field.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-white rounded border">
                        <FieldIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Field Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateField(field.id, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <span className="flex items-center gap-2">
                                    <type.icon className="h-4 w-4" />
                                    {type.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Label *</Label>
                          <Input
                            placeholder="e.g., Employee Name"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                          />
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`required-${field.id}`}
                              checked={field.required}
                              onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                            />
                            <Label htmlFor={`required-${field.id}`} className="text-sm">Required</Label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
