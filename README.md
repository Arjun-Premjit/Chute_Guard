# ChuteGuard AIoT

Vercel-deployable React dashboard for automated material chute blockage detection.

## Stack
- React + Vite
- Recharts
- Vercel serverless API routes
- Supabase Postgres + Realtime
- OpenCV.js in-browser camera analysis
- ESP32 HTTP telemetry ingestion and command polling
- Prototype logistic blockage model
- Rule-based operator chatbot

## Local start
1. Install Node.js LTS.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add values.
4. Run `npm run dev`.
5. Open the displayed Vite URL.

Without Supabase credentials, the dashboard runs in demo mode.

## Production
1. Create a GitHub repository and push this folder.
2. Create a Supabase project and run `supabase/schema.sql`.
3. Import the GitHub repository into Vercel.
4. Set the required Vercel environment variables.
5. Deploy.
6. Flash the ESP32 firmware in `hardware/esp32_chuteguard.ino`.
7. Replace demo coefficients in `/api/predict.js` with the validated model exported from `ml/train.py`.
8. Add authentication, device tokens, audit logs, rate limits, and operator confirmations before field deployment.

## API
- POST /api/telemetry/ingest
- GET /api/telemetry/latest
- GET /api/telemetry/history?hours=6
- POST /api/predict
- POST /api/command
- GET /api/commands/next
- POST /api/chat
