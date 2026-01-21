'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Eye,
  CheckCircle,
  Send,
  PenTool,
  Lock,
  XCircle,
  FileStack,
  Clock,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';

const CONTRACT_STATES = {
  CREATED: 'created',
  APPROVED: 'approved',
  SENT: 'sent',
  SIGNED: 'signed',
  LOCKED: 'locked',
  REVOKED: 'revoked'
};

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
  return buttonMap[targetStatus] || { label: targetStatus, icon: Activity, variant: 'outline' };
};

export default function Dashboard() {
  const [contracts, setContracts] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [transitionDialog, setTransitionDialog] = useState({ open: false, contract: null, targetStatus: null });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?category=${filter}` : '';
      const [contractsRes, blueprintsRes, statsRes] = await Promise.all([
        fetch(`/api/contracts${params}`),
        fetch('/api/blueprints'),
        fetch('/api/stats')
      ]);

      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (blueprintsRes.ok) setBlueprints(await blueprintsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async () => {
    const { contract, targetStatus } = transitionDialog;
    if (!contract || !targetStatus) return;

    try {
      const res = await fetch(`/api/contracts/${contract.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: targetStatus })
      });

      if (res.ok) {
        toast.success(`Document ${targetStatus} successfully`);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update document status');
      }
    } catch (error) {
      console.error('Error transitioning contract:', error);
      toast.error('Failed to update document status');
    } finally {
      setTransitionDialog({ open: false, contract: null, targetStatus: null });
    }
  };

  const openTransitionDialog = (contract, targetStatus) => {
    setTransitionDialog({ open: true, contract, targetStatus });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const actions = (
    <>
      <Link href="/blueprints">
        <Button variant="outline" className="gap-2">
          <Layers className="h-4 w-4" />
          Templates
        </Button>
      </Link>
      <Link href="/contracts/new">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Document
        </Button>
      </Link>
    </>
  );

  return (
    <AppShell
      title="Overview"
      subtitle="Documents, templates, and lifecycle at a glance"
      actions={actions}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Hero */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-teal-600/10 to-transparent" />
            <div className="relative">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Your workspace is ready
              </CardTitle>
              <CardDescription>
                Build from templates, ship approvals faster, and keep every change traceable.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/contracts/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create document
                  </Button>
                </Link>
                <Link href="/blueprints/new">
                  <Button variant="outline" className="gap-2">
                    <Layers className="h-4 w-4" />
                    New template
                  </Button>
                </Link>
                <Link href="/api-docs">
                  <Button variant="ghost" className="gap-2">
                    API reference
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium text-slate-500">Documents</div>
                <div className="mt-1 text-2xl font-semibold">{stats?.totalContracts || 0}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium text-slate-500">Templates</div>
                <div className="mt-1 text-2xl font-semibold">{stats?.totalBlueprints || 0}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-500">Velocity</div>
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {(stats?.byCategory?.active || 0) + (stats?.byCategory?.pending || 0)}
                </div>
                <div className="mt-1 text-xs text-slate-500">active + pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status snapshot</CardTitle>
            <CardDescription>Counts by current lifecycle bucket</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm text-slate-600">Pending</span>
              <span className="text-sm font-semibold">{stats?.byCategory?.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm text-slate-600">Active</span>
              <span className="text-sm font-semibold">{stats?.byCategory?.active || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm text-slate-600">Signed</span>
              <span className="text-sm font-semibold">{stats?.byCategory?.signed || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm text-slate-600">Revoked</span>
              <span className="text-sm font-semibold">{stats?.byCategory?.revoked || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent documents */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Recent documents</CardTitle>
                <CardDescription>Quick view + actions (no table layout)</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : contracts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <FileStack className="mx-auto h-12 w-12 text-slate-400" />
                <div className="mt-3 text-lg font-semibold text-slate-900">No documents yet</div>
                <div className="mt-1 text-sm text-slate-600">
                  Create a document from a template to start tracking your workflow.
                </div>
                <div className="mt-4">
                  <Link href="/contracts/new">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create document
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {contracts.slice(0, 12).map((contract) => {
                  const statusInfo = getStatusInfo(contract.status);
                  const validTransitions = getValidTransitions(contract.status);

                  return (
                    <div key={contract.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-900">{contract.name}</div>
                          <div className="mt-0.5 truncate text-xs text-slate-500">
                            Template: {contract.blueprintName}
                          </div>
                        </div>
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>Created {formatDate(contract.createdAt)}</span>
                        <Link href={`/contracts/${contract.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>

                      {validTransitions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {validTransitions.map((targetStatus) => {
                            const btnInfo = getTransitionButton(targetStatus);
                            const Icon = btnInfo.icon;
                            return (
                              <Button
                                key={targetStatus}
                                variant={btnInfo.variant}
                                size="sm"
                                onClick={() => openTransitionDialog(contract, targetStatus)}
                                className="h-8 gap-2"
                              >
                                <Icon className="h-4 w-4" />
                                {btnInfo.label}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transition Confirmation Dialog */}
      <Dialog
        open={transitionDialog.open}
        onOpenChange={(open) =>
          !open && setTransitionDialog({ open: false, contract: null, targetStatus: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm status change</DialogTitle>
            <DialogDescription>
              Change status for <span className="font-semibold">{transitionDialog.contract?.name}</span> to{' '}
              <span className="font-semibold">{transitionDialog.targetStatus}</span>?
              {transitionDialog.targetStatus === 'revoked' && (
                <span className="block mt-2 text-red-600">
                  This action cannot be undone. The document will be permanently revoked.
                </span>
              )}
              {transitionDialog.targetStatus === 'locked' && (
                <span className="block mt-2 text-amber-600">
                  Locking will make this document immutable.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransitionDialog({ open: false, contract: null, targetStatus: null })}
            >
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
    </AppShell>
  );
}
