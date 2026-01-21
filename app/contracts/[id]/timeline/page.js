'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle,
  Send,
  PenTool,
  Lock,
  XCircle,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';

const getStatusInfo = (status) => {
  const statusMap = {
    created: { label: 'Created', color: 'bg-indigo-500', icon: FileText },
    approved: { label: 'Approved', color: 'bg-amber-500', icon: CheckCircle },
    sent: { label: 'Sent', color: 'bg-teal-500', icon: Send },
    signed: { label: 'Signed', color: 'bg-emerald-500', icon: PenTool },
    locked: { label: 'Locked', color: 'bg-slate-500', icon: Lock },
    revoked: { label: 'Revoked', color: 'bg-rose-500', icon: XCircle }
  };
  return statusMap[status] || { label: status, color: 'bg-slate-500', icon: Clock };
};

const LIFECYCLE_ORDER = ['created', 'approved', 'sent', 'signed', 'locked'];

export default function ContractTimelinePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    fetchContract();
  }, [params.id]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contracts/${params.id}`);
      if (res.ok) {
        setContract(await res.json());
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIndex = (status) => {
    if (status === 'revoked') return -1;
    return LIFECYCLE_ORDER.indexOf(status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-teal-50/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading timeline...</p>
      </div>
    );
  }

  if (!contract) return null;

  const currentStatusIndex = getStatusIndex(contract.status);
  const isRevoked = contract.status === 'revoked';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-teal-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href={`/contracts/${params.id}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">Workflow Timeline</h1>
                <p className="text-sm text-muted-foreground">{contract.name}</p>
              </div>
            </div>
            <Badge variant="outline" className={`${getStatusInfo(contract.status).color} text-white border-0`}>
              {getStatusInfo(contract.status).label}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visual Lifecycle Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Lifecycle Progress</CardTitle>
            <CardDescription>Visual representation of the contract's journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded">
                <div 
                  className={`h-full rounded transition-all duration-500 ${isRevoked ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: isRevoked ? '100%' : `${(currentStatusIndex / (LIFECYCLE_ORDER.length - 1)) * 100}%` }}
                />
              </div>

              {/* Status Points */}
              <div className="relative flex justify-between">
                {LIFECYCLE_ORDER.map((status, index) => {
                  const info = getStatusInfo(status);
                  const Icon = info.icon;
                  const isPast = index <= currentStatusIndex && !isRevoked;
                  const isCurrent = index === currentStatusIndex && !isRevoked;
                  const historyEntry = contract.statusHistory?.find(h => h.status === status);

                  return (
                    <div key={status} className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                          isCurrent
                            ? `${info.color} border-white shadow-lg scale-110`
                            : isPast
                            ? `${info.color} border-white`
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isPast || isCurrent ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <span className={`mt-2 text-sm font-medium ${
                        isCurrent ? 'text-gray-900' : isPast ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {info.label}
                      </span>
                      {historyEntry && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatDate(historyEntry.timestamp).split(',')[0]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Revoked Indicator */}
              {isRevoked && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-3 px-4 py-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800 font-medium">Contract Revoked</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed History */}
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
            <CardDescription>Detailed log of all status changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Timeline Items */}
              <div className="space-y-6">
                {contract.statusHistory?.map((entry, index) => {
                  const info = getStatusInfo(entry.status);
                  const Icon = info.icon;
                  const isLatest = index === contract.statusHistory.length - 1;

                  return (
                    <div key={index} className="relative flex gap-4">
                      {/* Icon */}
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${info.color} ${isLatest ? 'ring-4 ring-opacity-30 ring-current' : ''}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{info.label}</h4>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(entry.timestamp)}
                            </span>
                          </div>
                          {entry.previousStatus && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <span className="capitalize">{entry.previousStatus}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="capitalize font-medium text-gray-700">{entry.status}</span>
                            </div>
                          )}
                          {entry.note && (
                            <p className="text-sm text-gray-600">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contract Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Contract Name</p>
                <p className="font-medium">{contract.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blueprint</p>
                <p className="font-medium">{contract.blueprintName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(contract.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(contract.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
