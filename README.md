# KNUE ICS Calendar Worker

This project is a Cloudflare Worker that parses the academic calendar from the Korea National University of Education (KNUE) website and converts it into an ICS (iCalendar) format. This allows users to subscribe to the KNUE academic calendar using their preferred calendar applications (e.g., Google Calendar, Apple Calendar, Outlook).

## Features

- Parses academic events from the official KNUE website.
- Generates an ICS file compatible with most calendar applications.
- Automatically updates the calendar data periodically using Cloudflare Workers' cron triggers.
- Supports ETag for efficient caching.
- Optional basic authentication for restricted access.

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/kadragon/knue-ics-calendar.git
   cd knue-ics-calendar
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Cloudflare KV Namespace:**

   This worker uses a Cloudflare KV Namespace to store the generated ICS file. You need to create a KV Namespace in your Cloudflare account and bind it to your worker.

   - Go to your Cloudflare dashboard.
   - Navigate to "Workers & Pages" > "KV" > "Create a namespace".
   - Give it a name (e.g., `KNUE_CALENDAR_KV`).
   - Update `wrangler.toml` with your KV Namespace ID and binding name:

   ```toml
   [[kv_namespaces]]

   binding = "KNUE_CAL_KV" # This should match the binding name in wrangler.toml and the property in the Env interface in src/index.ts
   id = "YOUR_KV_NAMESPACE_ID"
   ```

4. **Configure Cron Trigger:**

   The worker is scheduled to run periodically to update the calendar. The cron schedule is defined in `wrangler.toml`:

   ```toml
   [triggers]
   crons = ["*/30 * * * *"] # Runs every 30 minutes
   ```

   Adjust the cron expression as needed.

## Local Development

To run the worker locally with mock data for testing:

```bash
npm run dev
```

This will start a local development server. You can access the ICS file at `http://localhost:8787/events.ics` (or the port indicated by Wrangler).

To manually trigger the scheduled function locally (e.g., to force ICS regeneration):

```bash
curl "http://localhost:8787/cdn-cgi/handler/scheduled"
```

## Deployment

To deploy the worker to Cloudflare:

```bash
npm run deploy
```

To deploy to a specific environment (e.g., production):

```bash
npm run deploy:prod
```

## Configuration Options

### Timezone

The timezone for the calendar is set to `Asia/Seoul` in `src/index.ts`. Modify it if your target audience is in a different timezone.

## Maintenance Guidelines

- **Monitor Worker Logs:** Regularly check your Cloudflare Worker logs for any errors or warnings related to parsing or ICS generation.
- **KV Data:** The `latest` key in your KV namespace stores the most recent ICS data. Do not manually modify or delete this key unless you intend to force a regeneration.
- **Website Changes:** If the KNUE academic calendar website structure changes, the `src/parser.ts` file will need to be updated to reflect those changes.

## Calendar Subscription

To subscribe to this calendar, replace `your-worker-domain.workers.dev` with your actual Worker URL.

### Apple Calendar / iOS

1. Go to Settings > Calendar > Accounts > Add Account > Other
2. Select "Add Subscribed Calendar"
3. Enter the URL: `https://your-worker-domain.workers.dev/events.ics`

### Google Calendar

1. Open Google Calendar
2. Click the + next to "Other calendars"
3. Select "From URL"
4. Enter the URL: `https://your-worker-domain.workers.dev/events.ics`
5. Click "Add Calendar"

### Microsoft Outlook

1. Open Outlook Calendar
2. Right-click on "Calendars" and select "Add Calendar" > "From Internet"
3. Enter the URL: `https://your-worker-domain.workers.dev/events.ics`
4. Click "OK"
