
# ActiveAging Lab - Smart Elderly Fitness App

A modern healthcare platform for elderly fitness and rehabilitation, built with React, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Authentication**: Secure login with localStorage-based auth
- 🌍 **Bilingual**: Arabic/English support with RTL/LTR layouts
- 🏥 **Physical Screening**: Initial diagnostic assessment
- 👨‍⚕️ **Doctor Portal**: Create personalized treatment plans
- 🏋️ **Training Mode**: AI-powered exercise tracking with MediaPipe
- 📊 **Dashboard**: Track progress and statistics

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS + Radix UI components
- **API**: React Query + Axios
- **i18n**: i18next (Arabic/English)
- **Auth**: localStorage-based authentication
- **AI**: MediaPipe Pose for motion tracking

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your API configuration:
   ```
   # Using local proxy to bypass CORS - see vite.config.ts
   VITE_API_BASE_URL=/api
   ```
   
   **Note:** The app uses a Vite proxy to connect to the external API at `http://activeaginglab.tryasp.net/api`. The proxy is configured in `vite.config.ts`.

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/        # React components
│   ├── Login.tsx     # Login page
│   ├── Home.tsx      # Home page
│   ├── Dashboard.tsx # Dashboard
│   ├── doctor/       # Doctor portal
│   ├── screening/    # Physical screening
│   ├── training/     # Training mode
│   └── ui/           # Reusable UI components
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── hooks/            # Custom hooks
│   └── useLanguage.ts
├── i18n/             # Internationalization
│   └── config.ts
├── lib/              # Libraries and utilities
│   └── axios.ts
├── utils/            # Utility functions
└── App.tsx           # Main app component
```

## API Integration

The app uses Axios with React Query for API calls. Update the auth endpoint in `src/contexts/AuthContext.tsx`:

```typescript
const response = await api.post('/auth/login', { email, password });
```

Create API hooks using React Query:

```typescript
export function useGetData() {
  return useQuery({
    queryKey: ['data'],
    queryFn: () => api.get('/endpoint').then(res => res.data),
  });
}
```

## Language Support

Toggle between Arabic and English using the language button. The app automatically:
- Switches text direction (RTL/LTR)
- Updates all UI text
- Saves preference to localStorage

## Original Design

This project is based on the Figma design: [Smart Elderly Fitness App](https://www.figma.com/design/I5trfiZNhiaqlqN38Kn38D/Smart-Elderly-Fitness-App)

## License

Private project for graduation/research purposes.

  # ActiveAgingLab.v1
