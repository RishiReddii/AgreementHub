'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Code,
  FileJson,
  Server,
  Database,
  CheckCircle,
  XCircle
} from 'lucide-react';

const endpoints = {
  blueprints: [
    {
      method: 'GET',
      path: '/api/blueprints',
      description: 'List all blueprints',
      response: `[
  {
    "id": "uuid",
    "name": "Employment Agreement",
    "description": "Standard employment contract",
    "fields": [...],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]`
    },
    {
      method: 'POST',
      path: '/api/blueprints',
      description: 'Create a new blueprint',
      body: `{
  "name": "Employment Agreement",
  "description": "Standard employment contract",
  "fields": [
    {
      "type": "text",
      "label": "Employee Name",
      "required": true,
      "position": { "x": 0, "y": 0 }
    },
    {
      "type": "date",
      "label": "Start Date",
      "required": true
    },
    {
      "type": "signature",
      "label": "Employee Signature",
      "required": true
    },
    {
      "type": "checkbox",
      "label": "Agree to Terms",
      "required": false
    }
  ]
}`,
      response: `{
  "id": "uuid",
  "name": "Employment Agreement",
  ...
}`
    },
    {
      method: 'GET',
      path: '/api/blueprints/[id]',
      description: 'Get a single blueprint by ID',
      response: `{
  "id": "uuid",
  "name": "Employment Agreement",
  "description": "...",
  "fields": [...],
  "createdAt": "...",
  "updatedAt": "..."
}`
    },
    {
      method: 'PUT',
      path: '/api/blueprints/[id]',
      description: 'Update a blueprint (fails if contracts exist)',
      body: `{
  "name": "Updated Name",
  "description": "Updated description",
  "fields": [...]
}`,
      response: `{ "id": "uuid", ... }`
    },
    {
      method: 'DELETE',
      path: '/api/blueprints/[id]',
      description: 'Delete a blueprint (fails if contracts exist)',
      response: `{ "message": "Blueprint deleted successfully" }`
    }
  ],
  contracts: [
    {
      method: 'GET',
      path: '/api/contracts',
      description: 'List contracts with optional filtering',
      queryParams: [
        { name: 'status', description: 'Filter by exact status (created, approved, sent, signed, locked, revoked)' },
        { name: 'category', description: 'Filter by category (pending, active, signed, revoked)' },
        { name: 'blueprintId', description: 'Filter by blueprint ID' }
      ],
      response: `[
  {
    "id": "uuid",
    "name": "John Doe Contract",
    "blueprintId": "...",
    "blueprintName": "Employment Agreement",
    "status": "created",
    "fields": [...],
    "statusHistory": [...],
    "createdAt": "...",
    "updatedAt": "..."
  }
]`
    },
    {
      method: 'POST',
      path: '/api/contracts',
      description: 'Create a contract from a blueprint',
      body: `{
  "name": "John Doe Employment Contract",
  "blueprintId": "blueprint-uuid",
  "fieldValues": {
    "field-id-1": "John Doe",
    "field-id-2": "2024-02-01",
    "field-id-3": true
  }
}`,
      response: `{
  "id": "uuid",
  "name": "John Doe Employment Contract",
  "status": "created",
  ...
}`
    },
    {
      method: 'GET',
      path: '/api/contracts/[id]',
      description: 'Get a single contract by ID',
      response: `{
  "id": "uuid",
  "name": "...",
  "blueprintId": "...",
  "blueprintName": "...",
  "status": "created",
  "fields": [
    {
      "id": "field-uuid",
      "type": "text",
      "label": "Employee Name",
      "position": { "x": 0, "y": 0 },
      "required": true,
      "value": "John Doe"
    }
  ],
  "statusHistory": [
    {
      "status": "created",
      "timestamp": "...",
      "note": "Contract created"
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}`
    },
    {
      method: 'PUT',
      path: '/api/contracts/[id]',
      description: 'Update contract field values (fails for locked/revoked)',
      body: `{
  "name": "Updated Contract Name",
  "fieldValues": {
    "field-id-1": "Updated Value"
  }
}`,
      response: `{ "id": "uuid", ... }`
    },
    {
      method: 'DELETE',
      path: '/api/contracts/[id]',
      description: 'Delete a contract (only allowed for "created" status)',
      response: `{ "message": "Contract deleted successfully" }`
    },
    {
      method: 'POST',
      path: '/api/contracts/[id]/transition',
      description: 'Change contract lifecycle status',
      body: `{
  "newStatus": "approved",
  "note": "Optional note about the transition"
}`,
      response: `{
  "id": "uuid",
  "status": "approved",
  "statusHistory": [
    { "status": "created", "timestamp": "..." },
    { "status": "approved", "previousStatus": "created", "timestamp": "...", "note": "..." }
  ],
  ...
}`
    }
  ],
  stats: [
    {
      method: 'GET',
      path: '/api/stats',
      description: 'Get dashboard statistics',
      response: `{
  "totalContracts": 10,
  "totalBlueprints": 3,
  "byStatus": {
    "created": 2,
    "approved": 1,
    "sent": 3,
    "signed": 2,
    "locked": 1,
    "revoked": 1
  },
  "byCategory": {
    "active": 3,
    "pending": 3,
    "signed": 3,
    "revoked": 1
  }
}`
    }
  ]
};

const getMethodColor = (method) => {
  const colors = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800'
  };
  return colors[method] || 'bg-gray-100 text-gray-800';
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Code className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold text-gray-900">API Documentation</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              API Overview
            </CardTitle>
            <CardDescription>RESTful API for Contract Management Platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Base URL</p>
                <code className="text-sm font-mono">/api</code>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Content Type</p>
                <code className="text-sm font-mono">application/json</code>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Authentication</p>
                <code className="text-sm font-mono">None (optional)</code>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-3">Valid Lifecycle Transitions</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">created → approved</Badge>
                <Badge variant="outline">created → revoked</Badge>
                <Badge variant="outline">approved → sent</Badge>
                <Badge variant="outline">approved → revoked</Badge>
                <Badge variant="outline">sent → signed</Badge>
                <Badge variant="outline">sent → revoked</Badge>
                <Badge variant="outline">signed → locked</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Tabs defaultValue="blueprints">
          <TabsList className="mb-6">
            <TabsTrigger value="blueprints">Blueprints</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="blueprints">
            <div className="space-y-4">
              {endpoints.blueprints.map((endpoint, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                    </div>
                    <CardDescription>{endpoint.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {endpoint.body && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Request Body:</p>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                          {endpoint.body}
                        </pre>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium mb-2">Response:</p>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        {endpoint.response}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contracts">
            <div className="space-y-4">
              {endpoints.contracts.map((endpoint, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                    </div>
                    <CardDescription>{endpoint.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {endpoint.queryParams && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Query Parameters:</p>
                        <div className="space-y-2">
                          {endpoint.queryParams.map((param, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <code className="bg-gray-100 px-2 py-1 rounded">{param.name}</code>
                              <span className="text-muted-foreground">{param.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {endpoint.body && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Request Body:</p>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                          {endpoint.body}
                        </pre>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium mb-2">Response:</p>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        {endpoint.response}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="space-y-4">
              {endpoints.stats.map((endpoint, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                    </div>
                    <CardDescription>{endpoint.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="text-sm font-medium mb-2">Response:</p>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        {endpoint.response}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Responses */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Error Responses</CardTitle>
            <CardDescription>Standard error format for all endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto mb-4">
{`{
  "error": "Human-readable error message"
}`}
            </pre>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">200</Badge>
                <span className="text-sm">Success</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">201</Badge>
                <span className="text-sm">Created</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50">400</Badge>
                <span className="text-sm">Bad Request</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50">404</Badge>
                <span className="text-sm">Not Found</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
