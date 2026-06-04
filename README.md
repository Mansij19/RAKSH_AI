# RakshAI

**Community-Powered AI Safety Navigation**

RakshAI is a hackathon-ready Women Safety Advisor platform for community incident reporting, safety-rated maps, AI route risk analysis, SOS support, nearby alerts, and an AI Safety Assistant.

## Project Structure

```text
RakshAI/
  client/                 React + Vite + Tailwind frontend
  server/                 Express + MongoDB backend
  .env.example            Environment variable template
  package.json            Root scripts
```

## Features

- Report unsafe locations with GPS auto-detection
- View safety-rated map using OpenStreetMap and React Leaflet
- Browse community incident feed with filters
- Analyze route risk using Nominatim geocoding and incident proximity
- Generate AI explanations, incident classifications, and safety recommendations with Featherless AI
- Floating SOS emergency modal with coordinates and Google Maps link
- Nearby incident alerts within 1 km
- AI Safety Assistant chat
- Dashboard with Recharts analytics
- Dark mode, glassmorphism UI, responsive layout

## Installation

1. Install Node.js 18+ and npm 9+.
2. Install MongoDB locally or use MongoDB Atlas.
3. Copy `.env.example` to `server/.env`.
4. Fill in `server/.env`.

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Environment Variables

Never commit real secrets. The Featherless API key must live only in `server/.env`.

```env
MONGODB_URI=mongodb://localhost:27017/raksh-ai
PORT=5000
CLIENT_URL=http://localhost:5173
FEATHERLESS_API_KEY=your_key_here
FEATHERLESS_MODEL=deepseek-ai/DeepSeek-V3
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1
ENABLE_MEMORY_FALLBACK=true
```

If MongoDB Atlas is unavailable during a demo, `ENABLE_MEMORY_FALLBACK=true` lets the API boot with seeded in-memory incident data. MongoDB remains the primary persistence layer whenever `MONGODB_URI` is reachable.

## API Documentation

### Health

`GET /api/health`

### Incidents

`POST /api/incidents`

```json
{
  "type": "Harassment",
  "description": "Unsafe activity near bus stop",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

`GET /api/incidents?type=Harassment&risk=High`

### Risk

`GET /api/risk/:lat/:lng`

Returns:

```json
{
  "score": 80,
  "level": "High Risk",
  "reasons": ["3 reports within 1 km", "Average severity is 2.7"]
}
```

### Route Analyzer

`POST /api/routes/analyze`

```json
{
  "source": "Indiranagar, Bengaluru",
  "destination": "Koramangala, Bengaluru"
}
```

### AI Safety Assistant

`POST /api/ai/chat`

```json
{
  "message": "Is it safe to travel here after 9 PM?"
}
```

### Dashboard

`GET /api/dashboard/summary`

## Production Notes

- Add authentication before storing personal user data.
- Put the backend behind HTTPS.
- Add rate limits for public AI and geocoding endpoints.
- Use MongoDB Atlas network restrictions and secret management for deployment.
