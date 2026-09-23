# PARA — Modern React Frontend + PARA AI

**PARA** means **Pricing Analytics and Recommendation Assistant**.

This project is a **frontend-only React + TypeScript application** focused on a polished pricing analytics and decision-support experience. It is designed so the frontend remains organized while a backend can be connected later without rewriting the page structure.

## Frontend Stack

- React 18
- TypeScript
- Vite
- React Router
- Lucide React icons
- Recharts
- CSS design system with glassmorphism
- localStorage for frontend preferences/demo state

No backend code is included.

## Modern UI Features

- Glassmorphism cards, top bar, sidebar, modal, and login form
- Responsive desktop/tablet/mobile layout
- Slide-away desktop sidebar
- Mobile sidebar drawer
- Browser fullscreen button
- Light and dark themes
- Theme preference saved in the browser
- Animated ambient gradient background
- Accessible focus states and readable typography
- Sticky table headers
- Responsive charts
- Polished buttons, badges, inputs, forms, tables, toasts, and loading/error states
- Reduced-motion support
- Floating PARA AI Assistant available on every protected screen
- PARA AI compact/expanded glass chat modes
- Context-aware demo responses using current PARA mock data
- Quick prompts and page navigation commands
- Ctrl+/ keyboard shortcut to open PARA AI
- Chat history stored locally during frontend development
- Backend-ready `POST /assistant/chat` service boundary

## Pages

```text
src/pages/
├── ConstraintCenterPage.tsx
├── DashboardPage.tsx
├── DemandPredictionPage.tsx
├── ExplainabilityPage.tsx
├── FairnessMonitorPage.tsx
├── InventoryPage.tsx
├── LoginPage.tsx
├── ModelMonitoringPage.tsx
├── PriceOptimizationPage.tsx
├── PriceRecommendationPage.tsx
├── PricingHistoryPage.tsx
├── ProductsPage.tsx
├── SalesDataPage.tsx
├── SensitivityAnalysisPage.tsx
└── SettingsPage.tsx
```

## Important Frontend Folders

```text
src/
├── components/
│   ├── layout/       # Sidebar, topbar, application shell
│   └── ui/           # Reusable buttons, cards, badges, modal, states
├── context/          # Auth demo, toast system, light/dark theme
├── data/             # Demo/mock datasets
├── hooks/            # Frontend React hooks
├── pages/            # Screen-level components
├── services/         # Frontend service abstraction / demo data access
├── styles/           # Global responsive glassmorphism design system
├── types/            # Shared TypeScript models
└── utils/            # Formatting and CSV helpers
```

## How to Run in VS Code

Open the project folder in VS Code, then open a terminal in the project root.

```bash
npm install
npm run dev
```

Vite will normally show:

```text
http://localhost:5173/
```

Open that address in your browser.

### TypeScript Check

```bash
npm run typecheck
```

### Production Build

```bash
npm run build
```

## Demo Login

When mock/demo mode is active:

```text
Email: admin@para.local
Password: password123
```

## Full-width Workspace

On desktop, use **Hide menu** in the top bar or the collapse control inside the sidebar. The navigation slides away and the content automatically expands across the screen.

Use **Full screen** to enter the browser's fullscreen mode. Press `Esc` or use the same button to exit.

## Frontend-only Note

The pricing recommendations, analytics, demand values, model metrics, fairness scores, and history in this version are demo frontend data. The UI structure is intentionally separated into pages, components, types, and services so a backend can be connected later without mixing backend logic into visual components.


## PARA AI Assistant

The floating **Ask PARA AI** button is available across the authenticated application. The assistant can:

- explain product price recommendations;
- summarize demand, sales, inventory, fairness, and model signals;
- identify low-stock products;
- explain pricing limits and human-approval rules;
- open PARA screens when asked (for example, `Open Pricing History`);
- keep a short local chat history; and
- switch to a real backend assistant later without changing the chat UI.

While `VITE_USE_MOCK_API=true`, responses are generated from the same frontend mock store used by the rest of PARA. When the backend is ready, set mock mode to `false` and implement:

```text
POST /api/assistant/chat
```

Suggested request body:

```json
{
  "message": "Why did Bottled Water increase?",
  "page": "Price Recommendation",
  "history": []
}
```

Suggested response:

```json
{
  "message": "The recommendation increased because demand is high...",
  "suggestions": ["Is this recommendation fair?", "Open Demand Prediction"]
}
```
