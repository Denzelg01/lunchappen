# Lunch Jämtland Basket

En mobilanpassad lunchapp för Jämtland Basket. Appen visar automatiskt dagens restaurang och hämtar aktuella lunchrätter från restaurangernas webbplatser.

**Liveversion:** [lunch-jb.onrender.com](https://lunch-jb.onrender.com/)

## Syfte

Lunch JB samlar lagets lunchinformation på ett ställe. Användaren behöver inte leta på flera restaurangwebbplatser och kan få dagens restaurang och meny som en automatisk notis på sin telefon.

## Funktioner

- Väljer dagens restaurang utifrån veckodagen
- Hämtar aktuella menyer från fyra olika restaurangwebbplatser
- Visar dagens rätter direkt på startsidan
- Visar lagets restaurangschema för hela veckan
- Länkar till restaurangernas originalmenyer
- Fungerar som installerbar PWA på mobilens hemskärm
- Skickar automatiska lunchnotiser på vardagsmorgnar
- Sparar pushprenumerationer i Supabase
- Förhindrar dubbla notiser under samma dag
- Visar tydliga felmeddelanden om en meny inte kan hämtas
- Har responsiv design för mobil och dator

## Veckoschema

| Dag     | Restaurang                 |
| ------- | -------------------------- |
| Måndag  | Hos Andreas Östersund City |
| Tisdag  | W Welcome                  |
| Onsdag  | LIME Odenskog              |
| Torsdag | Campusrestaurangen         |
| Fredag  | Campusrestaurangen         |

## Så fungerar appen

React-gränssnittet hämtar dagens meny från en Express-server. Servern läser och tolkar restaurangernas webbsidor med Cheerio.

Pushprenumerationer och genomförda utskick sparas i Supabase. Ett schemalagt GitHub Actions-jobb kontaktar servern varje vardagsmorgon. Servern hämtar dagens meny och skickar den som en webbpushnotis till användarna.

## Teknik

### Frontend

- React
- Vite
- JavaScript
- CSS
- Progressive Web App
- Service Worker

### Backend och data

- Node.js
- Express
- Cheerio
- Supabase
- Web Push och VAPID

### Drift och automation

- Render
- GitHub Actions
- Git och GitHub

## Köra projektet lokalt

Installera projektets paket:

```powershell
npm install
```

Starta frontend och backend tillsammans:

```powershell
npm run start
```

Frontend körs normalt på `http://localhost:5173` och backend på `http://localhost:3001`.

Projektet kräver en lokal `.env.local` med serverinställningar för Supabase, VAPID och skyddade notisanrop. Hemliga värden ska aldrig sparas i Git.

## Kvalitetskontroller

Kontrollera koden:

```powershell
npm run lint
```

Skapa ett produktionsbygge:

```powershell
npm run build
```

## Projektstatus

Den första fungerande versionen är publicerad. Appen kan installeras på en iPhone, hämta aktuella menyer och skicka automatiska lunchnotiser.

Möjliga framtida förbättringar:

- Knapp för att stänga av lunchnotiser
- Valbar tid för notiser
- Tydligare status för aktiverade notiser
- Bättre övervakning när restauranger ändrar sina webbplatser
- Vy med fler av veckans menyer

## Säkerhet

Hemliga Supabase-, VAPID- och utskicksnycklar hanteras med lokala miljövariabler, Render Environment Variables och GitHub Actions Secrets. De ska inte finnas i projektets versionshistorik.
