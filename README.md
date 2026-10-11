# Jazeera Airways — Terminal 5 & In-Flight Media Sales CRM

A production-ready local B2B Media Sales CRM & Inventory Booking System explicitly customized for **Jazeera Airways** (Terminal 5 & In-Flight media network).

![Jazeera Airways CRM](https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80)

---

## 🛫 Key Capabilities & Architecture

- **Aviation Approval Gate Enforcement**: Enforces regulatory aviation safety checks (**FAA FAR 25.853 / EASA CS-25** cabin material flammability certification & **IATA 722e** optical scanner reflection compatibility). Stage transitions to `IO_SIGNED` are strictly blocked until verified.
- **T5 & In-Flight Avails Engine**: Real-time capacity and occupancy tracking for digital screen loops (e.g., 10-second spots in 6-client synchronized loops on the Departures Mega Screen) and fleet-wide allocations (across 24 Airbus A320 aircraft).
- **Official Jazeera Rate Cards**: Preloaded with authentic rates, duration multipliers (1M, 3M, 6M, 12M in Kuwaiti Dinars - KWD), technical specifications, and production lead times.
- **One-Click Insertion Order (IO) PDF Engine**: Generates professional, branded insertion orders with Kuwait DGCA compliance disclaimers, 4-week production lead time rules, and dual signature blocks.
- **Proof of Performance (PoP) & Flight Audit**: Flight and ground installation certifications featuring photo logs, inspection timestamps, and certification stamps from Jazeera Airport Operations.
- **Pitch Deck Stats Helper**: Integrated slide-out drawer providing immediate copy-to-clipboard metrics (4.9M+ annual passengers, 30.5% market share, 24 A320 fleet, 15-minute check-in to gate dwell time).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS with authentic Jazeera Airways Navy (`#002B66`), Sky Blue (`#00A3E0`), and Sun Yellow (`#FFC72C`)
- **Database & ORM**: Self-contained SQLite with Prisma ORM
- **Table Engine**: TanStack Table (v8) for high-density inventory exploration
- **PDF Generation**: `jspdf` & `jspdf-autotable`
- **Icons & Effects**: `lucide-react`, `canvas-confetti`

---

## 📊 Pipeline Stages & Probability Weighting

| Stage | Probability | Description |
|---|---|---|
| `RFP_RECEIVED` | 10% | Initial agency brief or client inquiry |
| `CONCEPT_PITCH` | 25% | Creative mockups & preliminary avails shared |
| `MEDIA_PLAN_SENT` | 50% | Itemized proposal submitted for review |
| `AVIATION_SAFETY_APPROVAL` | 70% | Flammability & scanner compliance gate |
| `IO_SIGNED` | 85% | Official Insertion Order legally executed |
| `IN_PRODUCTION` | 95% | Fabrication under 4-week airline lead time |
| `INSTALLED_POP_DELIVERED`| 100% | Installed in cabin / T5 with signed certificate |
| `CLOSED_WON` | 100% | Recognized airline media revenue |
| `CLOSED_LOST` | 0% | Lost or cancelled proposal |

---

## 🚀 Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Push Schema
```bash
npx prisma db push
```

### 3. Seed Authentic Jazeera Products & Deals
```bash
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Commercial Governance
Operated exclusively by Jazeera Airways K.S.C.P. Commercial Media & In-Flight Sales Division, Kuwait.
