'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Calendar,
  PenTool,
  CheckSquare,
  Type,
  Layers,
  Filter,
  Sparkles
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

export default function BlueprintsPage() {
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, blueprint: null });
  const [query, setQuery] = useState('');
  const [fieldType, setFieldType] = useState('all');

  useEffect(() => {
    fetchBlueprints();
  }, []);

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

  const handleDelete = async () => {
    const { blueprint } = deleteDialog;
    if (!blueprint) return;

    try {
      const res = await fetch(`/api/blueprints/${blueprint.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Blueprint deleted successfully');
        fetchBlueprints();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete blueprint');
      }
    } catch (error) {
      console.error('Error deleting blueprint:', error);
      toast.error('Failed to delete blueprint');
    } finally {
      setDeleteDialog({ open: false, blueprint: null });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filtered = blueprints
    .filter((b) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        b.name?.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q)
      );
    })
    .filter((b) => {
      if (fieldType === 'all') return true;
      return (b.fields || []).some((f) => f.type === fieldType);
    });

  const actions = (
    <Link href="/blueprints/new">
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        New template
      </Button>
    </Link>
  );

  return (
    <AppShell
      title="Templates"
      subtitle="Reusable building blocks for new documents"
      actions={actions}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Filters */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Find templates
            </CardTitle>
            <CardDescription>Search + filter by supported fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">Search</div>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. employment, NDA, vendor…"
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">Field type</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: 'all', label: 'All' },
                  { v: 'text', label: 'Text' },
                  { v: 'date', label: 'Date' },
                  { v: 'signature', label: 'Signature' },
                  { v: 'checkbox', label: 'Checkbox' }
                ].map((t) => (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => setFieldType(t.v)}
                    className={
                      fieldType === t.v
                        ? 'rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white'
                        : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50'
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Suggestions
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Use clear names + descriptions so teams can find the right template quickly.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Library</div>
              <div className="text-xs text-slate-500">
                {loading ? 'Loading…' : `${filtered.length} templates`}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
              Loading templates…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Layers className="mx-auto h-12 w-12 text-slate-400" />
              <div className="mt-3 text-lg font-semibold text-slate-900">No matching templates</div>
              <div className="mt-1 text-sm text-slate-600">Try a different search or filter.</div>
              <div className="mt-4">
                <Link href="/blueprints/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create template
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((blueprint) => (
                <div key={blueprint.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-slate-900">{blueprint.name}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {blueprint.description || 'No description provided.'}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/blueprints/${blueprint.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => setDeleteDialog({ open: true, blueprint })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(blueprint.fields || []).slice(0, 6).map((field) => {
                      const Icon = getFieldIcon(field.type);
                      return (
                        <Badge key={field.id} variant="secondary" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {field.label}
                        </Badge>
                      );
                    })}
                    {(blueprint.fields || []).length > 6 && (
                      <Badge variant="outline">+{blueprint.fields.length - 6} more</Badge>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="text-xs text-slate-500">Created {formatDate(blueprint.createdAt)}</div>
                    <Link href={`/contracts/new?blueprintId=${blueprint.id}`}>
                      <Button size="sm" className="h-8 gap-2">
                        <FileText className="h-4 w-4" />
                        Use template
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, blueprint: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template</DialogTitle>
            <DialogDescription>
              Delete <span className="font-semibold">{deleteDialog.blueprint?.name}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, blueprint: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
