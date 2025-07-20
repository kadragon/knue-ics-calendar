# KNUE ICS Calendar Project

## Project Overview

This project aims to provide a serverless solution for regularly parsing a target website, generating an ICS (iCalendar) file, and serving it via a URL. This is achieved using Cloudflare Workers, KV (Key-Value store), and Cron Triggers, offering a highly flexible and maintainable approach.

## Key Features

- **Automated Parsing & ICS Generation**: Periodically fetches and parses data from a target website, then generates an ICS string using `ical-generator`.
- **Serverless Hosting**: The generated ICS file is stored in Cloudflare KV and served via an HTTP endpoint, leveraging Cloudflare's global network for low-latency access.
- **Scheduled Updates**: Utilizes Cron Triggers to automatically update the ICS file at regular intervals without requiring a dedicated server.
- **Scalability & Cost-Effectiveness**: Built on Cloudflare's serverless platform, ensuring high scalability and minimal operational costs.

## Technology Stack

- **Cloudflare Workers**: Serverless execution environment for handling HTTP requests and scheduled tasks.
- **Cloudflare KV**: Distributed key-value store for storing the latest ICS file, providing near-zero read latency globally.
- **Cloudflare Cron Triggers**: Enables scheduled execution of Workers for periodic data updates.
- **`ical-generator`**: npm package for generating iCalendar (RFC 5545) strings.
- **TypeScript**: For robust and maintainable code.
- **Wrangler**: Cloudflare's CLI tool for developing and deploying Workers.

## Project Structure

- `src/index.ts`: Main Worker script handling HTTP requests and scheduled tasks.
- `src/parser.ts` (conceptual): Logic for fetching and parsing data from the target site.
- `wrangler.toml`: Configuration file for Cloudflare Worker, including KV namespace binding and Cron Triggers.

## Development Setup

### Prerequisites

- Node.js
- npm (or yarn)
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Local Development

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd knue-ics-calendar
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Login to Cloudflare (first time only)**:

   ```bash
   wrangler login
   ```

4. **Configure `wrangler.toml`**:
   - Update `name` to your desired Worker name.
   - Create a KV namespace in your Cloudflare dashboard and update `kv_namespaces.id` with its ID.
   - Adjust `crons` schedule as needed.
5. **Run locally with Miniflare**:

   ```bash
   wrangler dev --local
   ```

   This will emulate KV and Cron Triggers locally.

### Deployment

1. **Build and deploy**:

   ```bash
   wrangler deploy
   ```

## Operational Tips

- **HTTP Headers**: Ensure `text/calendar; charset=utf-8`, `Content-Disposition: attachment; filename="events.ics"`, and appropriate `Cache-Control` headers are set for optimal client compatibility and caching.
- **Error Handling**: Implement robust error handling for parsing logic to prevent service disruption (e.g., keep the old ICS if crawling fails).
- **Security**: For non-public calendars, consider implementing `Authorization` header checks or Cloudflare Workers Access tokens.

## Alternative Architectures

- **Pages + R2**: Suitable if the ICS file updates less than once a day. Generates ICS via Pages build hook and uploads to R2 for cost-effective egress.
- **Workers + Durable Objects**: For per-user or custom calendars requiring dynamic generation and caching.
- **Workers Stream Response**: For very large ICS files (several MBs), streaming from R2 or on-the-fly generation can be used.

This `GEMINI.md` file provides a comprehensive overview of the project, its technical details, and operational guidelines.
