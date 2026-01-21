'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Send,
  PenTool,
  Lock,
  XCircle,
  Type,
  Calendar,
  CheckSquare,
  Clock,
  History
} from 'lucide-react';

const getStatusInfo = (status) => {
  const statusMap = {
    created: { label: 'Created', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    approved: { label: 'Approved', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    sent: { label: 'Sent', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    signed: { label: 'Signed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    locked: { label: 'Locked', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    revoked: { label: 'Revoked', color: 'bg-rose-100 text-rose-800 border-rose-200' }
  };
  return statusMap[status] || { label: status, color: 'bg-slate-100 text-slate-800 border-slate-200' };
};

const getValidTransitions = (status) => {
  const transitions = {
    created: ['approved', 'revoked'],
    approved: ['sent', 'revoked'],
    sent: ['signed', 'revoked'],
    signed: ['locked'],
    locked: [],
    revoked: []
  };
  return transitions[status] || [];
};

const getTransitionButton = (targetStatus) => {
  const buttonMap = {
    approved: { label: 'Approve', icon: CheckCircle, variant: 'default' },
    sent: { label: 'Send', icon: Send, variant: 'default' },
    signed: { label: 'Mark Signed', icon: PenTool, variant: 'default' },
    locked: { label: 'Lock', icon: Lock, variant: 'secondary' },
    revoked: { label: 'Revoke', icon: XCircle, variant: 'destructive' }
  };
  return buttonMap[targetStatus] || { label: targetStatus, icon: Clock, variant: 'outline' };
};

const getFieldIcon = (type) => {
  const icons = {
    text: Type,
    date: Calendar,
    signature: PenTool,
    checkbox: CheckSquare
  };
  return icons[type] || Type;
};

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [transitionDialog, setTransitionDialog] = useState({ open: false, targetStatus: null });

  useEffect(() => {
    fetchContract();
  }, [params.id]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contracts/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setContract(data);
        // Initialize field values
        const values = {};
        data.fields.forEach(field => {
          values[field.id] = field.value;
        });
        setFieldValues(values);
      } else {
        toast.error('Contract not found');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      toast.error('Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const updateFieldValue = (fieldId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/contracts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldValues })
      });

      if (res.ok) {
        const updated = await res.json();
        setContract(updated);
        setHasChanges(false);
        toast.success('Document saved successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleTransition = async () => {
    const { targetStatus } = transitionDialog;
    if (!targetStatus) return;

    try {
      const res = await fetch(`/api/contracts/${params.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: targetStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setContract(updated);
        toast.success(`Document ${targetStatus} successfully`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update document status');
      }
    } catch (error) {
      console.error('Error transitioning document:', error);
      toast.error('Failed to update document status');
    } finally {
      setTransitionDialog({ open: false, targetStatus: null });
    }
  };

  const isImmutable = contract?.status === 'locked' || contract?.status === 'revoked';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderFieldInput = (field) => {
    const Icon = getFieldIcon(field.type);
    const isDisabled = isImmutable;

    switch (field.type) {
      case 'checkbox':
        return (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              id={field.id}
              checked={fieldValues[field.id] || false}
              onCheckedChange={(checked) => updateFieldValue(field.id, checked)}
              disabled={isDisabled}
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
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
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
              disabled={isDisabled}
            />
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              placeholder="Type your signature..."
              className="font-cursive italic text-lg"
              value={fieldValues[field.id] || ''}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
              disabled={isDisabled}
            />
            {fieldValues[field.id] && (
              <div className="mt-2 p-3 bg-white border rounded text-center">
                <span className="text-xl italic" style={{ fontFamily: 'cursive' }}>
                  {fieldValues[field.id]}
                </span>
              </div>
            )}
          </div>
        );

      case 'text':
      default:
        return (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
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
              disabled={isDisabled}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading contract...</p>
      </div>
    );
  }

  if (!contract) return null;

  const statusInfo = getStatusInfo(contract.status);
  const validTransitions = getValidTransitions(contract.status);

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
              <div>
                <h1 className="text-xl font-bold text-gray-900">{contract.name}</h1>
                <p className="text-sm text-muted-foreground">Template: {contract.blueprintName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
              {!isImmutable && hasChanges && (
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
                <CardDescription>
                  {isImmutable
                    ? 'This document is locked and cannot be modified.'
                    : 'Fill in the document fields below.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.fields.map((field) => (
                    <div key={field.id}>
                      {renderFieldInput(field)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            {validTransitions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {validTransitions.map((targetStatus) => {
                      const btnInfo = getTransitionButton(targetStatus);
                      const Icon = btnInfo.icon;
                      return (
                        <Button
                          key={targetStatus}
                          variant={btnInfo.variant}
                          className="w-full justify-start gap-2"
                          onClick={() => setTransitionDialog({ open: true, targetStatus })}
                        >
                          <Icon className="h-4 w-4" />
                          {btnInfo.label}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status History */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Status History
                  </CardTitle>
                  <Link href={`/contracts/${params.id}/timeline`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View Timeline
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contract.statusHistory?.map((entry, index) => {
                    const info = getStatusInfo(entry.status);
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full ${info.color.split(' ')[0]}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{info.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(entry.timestamp)}
                          </p>
                          {entry.note && (
                            <p className="text-xs text-muted-foreground mt-1">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Contract Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(contract.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(contract.updatedAt)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blueprint</span>
                  <span>{contract.blueprintName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fields</span>
                  <span>{contract.fields.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Transition Confirmation Dialog */}
      <Dialog open={transitionDialog.open} onOpenChange={(open) => !open && setTransitionDialog({ open: false, targetStatus: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status to{' '}
              <span className="font-semibold">{transitionDialog.targetStatus}</span>?
              {transitionDialog.targetStatus === 'revoked' && (
                <span className="block mt-2 text-red-600">
                  Warning: This action cannot be undone. The document will be permanently revoked.
                </span>
              )}
              {transitionDialog.targetStatus === 'locked' && (
                <span className="block mt-2 text-amber-600">
                  Warning: Locking the document will make it immutable.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionDialog({ open: false, targetStatus: null })}>
              Cancel
            </Button>
            <Button
              variant={transitionDialog.targetStatus === 'revoked' ? 'destructive' : 'default'}
              onClick={handleTransition}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
