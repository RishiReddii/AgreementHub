'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileText,
  Type,
  Calendar,
  PenTool,
  CheckSquare,
  Save
} from 'lucide-react';

const getFieldIcon = (type) => {
  const icons = {
    text: Type,
    date: Calendar,
    signature: PenTool,
    checkbox: CheckSquare
  };
  return icons[type] || Type;
};

function NewContractContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBlueprintId = searchParams.get('blueprintId');

  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [contractName, setContractName] = useState('');
  const [fieldValues, setFieldValues] = useState({});

  useEffect(() => {
    fetchBlueprints();
  }, []);

  useEffect(() => {
    if (preselectedBlueprintId && blueprints.length > 0) {
      const blueprint = blueprints.find(b => b.id === preselectedBlueprintId);
      if (blueprint) {
        handleBlueprintSelect(blueprint.id);
      }
    }
  }, [preselectedBlueprintId, blueprints]);

  const fetchBlueprints = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/blueprints');
      if (res.ok) {
        setBlueprints(await res.json());
      }
    } catch (error) {
      console.error('Error fetching blueprints:', error);
      toast.error('Failed to load blueprints');
    } finally {
      setLoading(false);
    }
  };

  const handleBlueprintSelect = (blueprintId) => {
    const blueprint = blueprints.find(b => b.id === blueprintId);
    setSelectedBlueprint(blueprint);

    // Initialize field values
    if (blueprint) {
      const initialValues = {};
      blueprint.fields.forEach(field => {
        switch (field.type) {
          case 'checkbox':
            initialValues[field.id] = false;
            break;
          case 'date':
            initialValues[field.id] = '';
            break;
          case 'signature':
            initialValues[field.id] = '';
            break;
          default:
            initialValues[field.id] = '';
        }
      });
      setFieldValues(initialValues);
    }
  };

  const updateFieldValue = (fieldId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contractName.trim()) {
      toast.error('Please enter a contract name');
      return;
    }

    if (!selectedBlueprint) {
      toast.error('Please select a blueprint');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contractName,
          blueprintId: selectedBlueprint.id,
          fieldValues
        })
      });

      if (res.ok) {
        const contract = await res.json();
        toast.success('Document created successfully');
        router.push(`/contracts/${contract.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create document');
      }
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document');
    } finally {
      setSaving(false);
    }
  };

  const renderFieldInput = (field) => {
    const Icon = getFieldIcon(field.type);

    switch (field.type) {
      case 'checkbox':
        return (
          <div className="flex items-center gap-3">
            <Checkbox
              id={field.id}
              checked={fieldValues[field.id] || false}
              onCheckedChange={(checked) => updateFieldValue(field.id, checked)}
            />
            <Label htmlFor={field.id} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={fieldValues[field.id] || ''}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
            />
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              placeholder="Type your signature..."
              className="font-cursive italic"
              value={fieldValues[field.id] || ''}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
            />
          </div>
        );

      case 'text':
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              value={fieldValues[field.id] || ''}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-teal-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">New Document</h1>
            </div>
            <Button onClick={handleSubmit} disabled={saving || !selectedBlueprint} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Creating...' : 'Create Document'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
        ) : blueprints.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No templates available</h3>
              <p className="text-muted-foreground mb-4">Create a template first to start making documents.</p>
              <Link href="/blueprints/new">
                <Button>Create Template</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Blueprint Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Template</CardTitle>
                <CardDescription>Choose a template for your document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blueprint">Template *</Label>
                  <Select
                    value={selectedBlueprint?.id || ''}
                    onValueChange={handleBlueprintSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {blueprints.map((blueprint) => (
                        <SelectItem key={blueprint.id} value={blueprint.id}>
                          {blueprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractName">Document Name *</Label>
                  <Input
                    id="contractName"
                    placeholder="e.g., John Doe Employment Agreement"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contract Fields */}
            {selectedBlueprint && (
              <Card>
                <CardHeader>
                <CardTitle>Document Details</CardTitle>
                <CardDescription>Fill in the document fields (optional - can be completed later)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedBlueprint.fields.map((field) => (
                      <div key={field.id}>
                        {renderFieldInput(field)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        )}
      </main>
    </div>
  );
}

export default function NewContractPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <NewContractContent />
    </Suspense>
  );
}
