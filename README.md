# AgreementHub

AgreementHub is a full-stack **document lifecycle management** application built with **Next.js (App Router)** and **MongoDB**. It lets teams create reusable **templates**, generate **documents** from those templates, and move documents through a controlled **workflow lifecycle** with full status history.

## Key Features

- **Template management**: create, edit, and delete reusable templates with dynamic fields
- **Dynamic documents**: create documents from templates and fill values (text/date/checkbox/signature-as-text)
- **Workflow lifecycle**: controlled transitions (Created → Approved → Sent → Signed → Locked / Revoked)
- **History & timeline**: per-document status history + visual timeline view
- **Dashboard**: card-based overview and “recent documents” with quick actions
- **Modern UI shell**: sidebar + topbar navigation (consistent layout across pages)

Live Deployment - 
https://aggrementhub.vercel.app?_vercel_share=4tuA1PjXWcjBcA8aXJhSXVxXX0ETydIe


## Screenshots 
<img width="1906" height="865" alt="image" src="https://github.com/user-attachments/assets/278269a4-8be0-4380-83cb-4e0a41e029ab" />
<img width="1919" height="854" alt="image" src="https://github.com/user-attachments/assets/bba93619-0f54-48e0-ac16-a4f98932f018" />


## Tech stack rationale

- **Next.js 14 (App Router)** unifies frontend and backend in one codebase, keeps routing/server handlers colocated, and is deployment-ready for edge/static hosting.
- **MongoDB + native driver** fit the flexible document shape (templates with nested fields and status history) without an ORM layer, keeping inserts/updates predictable.
- **Tailwind CSS + shadcn/ui (Radix)** provide accessible primitives, consistent spacing/typography tokens, and fast feature delivery without maintaining a bespoke design system.
- **React Hook Form** keeps forms performant with minimal re-renders while handling complex field sets; validation stays close to inputs.
- **Recharts + date-fns** cover lightweight dashboard charting and timezone-safe date handling without pulling heavier analytics stacks.
  




## Setup Instructions

### Prerequisites

- **Node.js**: 18+ (recommended)
- **MongoDB**: local or cloud (MongoDB Atlas)

### 1) Clone and install

```bash
git clone <repository-url>
cd AgreementHub
npm install
```

### 2) Environment variables

Create a `.env` file in the project root:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=agreementhub
```

### 3) Run locally

```bash
npm run dev:no-reload
```

- App/API: `http://localhost:3001`

### Production build

```bash
npm run build
npm run start
```

## Architecture and design decisions

### Project layout (Next.js App Router)

- **UI routes**: `app/`
- **API routes**: `app/api/`
- **Shared modules**: `lib/`
- **Reusable UI + shell**: `components/`

### API strategy

- REST-style endpoints implemented using **Next.js route handlers**
  - Templates: `/api/blueprints`
  - Documents: `/api/contracts`
  - Lifecycle transitions: `/api/contracts/[id]/transition`
  - Dashboard stats: `/api/stats`

### Lifecycle rules (state machine)

- Lifecycle logic is centralized in `lib/lifecycle.js` to keep rules consistent.
- Backend rejects invalid transitions; frontend only exposes valid actions.

Lifecycle map:

```
Created → Approved → Sent → Signed → Locked
              ↘ Revoked (terminal)
```

### Data modeling (MongoDB)

- **Templates (blueprints)** store field definitions: type, label, required, and position metadata.
- **Documents (contracts)** store:
  - `blueprintId` and **denormalized** `blueprintName`
  - field snapshot + values (to keep documents stable even if template changes)
  - embedded `statusHistory` for timeline rendering

### UI/UX decisions

- **App shell** (`components/app-shell.jsx`) provides consistent navigation and spacing.
- **Card-first layouts** reduce “table-heavy” UI and improve scanability.
- **Template filters** (search + field-type chips) improve discovery and reuse.

## API overview

### Templates (Blueprints)

- `GET /api/blueprints` – list templates
- `POST /api/blueprints` – create template
- `GET /api/blueprints/[id]` – get template
- `PUT /api/blueprints/[id]` – update template
- `DELETE /api/blueprints/[id]` – delete template

### Documents (Contracts)

- `GET /api/contracts` – list documents (`?status=...`, `?category=...`, `?blueprintId=...`)
- `POST /api/contracts` – create document from template
- `GET /api/contracts/[id]` – get document
- `PUT /api/contracts/[id]` – update field values
- `DELETE /api/contracts/[id]` – delete (only when status is `created`)
- `POST /api/contracts/[id]/transition` – change status

### Stats

- `GET /api/stats` – dashboard counts

Error format:

```json
{ "error": "Human-readable message" }
```

## Assumptions and limitations

### Assumptions

- **No authentication** is included (intended for demo / single-user use).
- Signatures are handled as **typed text** (not legal e-signature).
- MongoDB is available and reachable using `MONGO_URL`.

### Limitations

- **No RBAC** (role-based access control).
- **No server-side pagination** (okay for small datasets).
- **No attachments** (files are not stored).
- **No async jobs** (no email reminders/scheduling).

## Project Structure

```
AgreementHub
├── app/
│   ├── api/                       # Next.js API routes (blueprints, contracts, stats)
│   ├── blueprints/                # Templates pages
│   ├── contracts/                 # Documents pages
│   ├── page.js                    # Dashboard
│   └── layout.js                  # Root layout
├── components/
│   ├── app-shell.jsx              # Sidebar/topbar shell
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── db.js                      # MongoDB connection
│   ├── lifecycle.js               # Lifecycle rules
│   └── utils.js
├── scripts/
│   └── backend_test.py            # API smoke tests (set BASE_URL env to run)
├── app/globals.css
├── package.json
└── README.md
```

## License

MIT
