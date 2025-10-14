# KNUE ICS Calendar Worker

A robust Cloudflare Worker that automatically parses the academic calendar from Korea National University of Education (KNUE) and converts it into RFC 5545-compliant ICS format for seamless calendar application integration.

## ✨ Features

- **Automatic Calendar Parsing**: Extracts academic events from the official KNUE website
- **RFC 5545 Compliant**: Generates ICS files compatible with all major calendar applications
- **Smart Event Processing**:
  - Filters out holidays and makeup classes (수업보강)
  - Handles long events by splitting them into start/end markers
  - Sanitizes event titles for better compatibility
- **Robust Error Handling**: Built-in retry mechanism with exponential backoff and jitter
- **Efficient Caching**: ETag-based HTTP caching for optimal performance
- **Comprehensive Testing**: 100% test coverage with 52 passing tests
- **Scheduled Updates**: Automatic calendar refresh using Cloudflare Workers cron triggers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers enabled
- Basic familiarity with Cloudflare Workers and KV

### Installation

1. **Clone and setup:**

   ```bash
   git clone https://github.com/kadragon/knue-ics-calendar.git
   cd knue-ics-calendar
   npm install
   ```

2. **Configure Cloudflare KV:**

   - Create a KV namespace in your Cloudflare dashboard
   - Update `wrangler.toml` with your namespace details:

   ```toml
   [[kv_namespaces]]
   binding = "KNUE_CAL_KV"
   id = "YOUR_KV_NAMESPACE_ID"
   preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID"
   ```

3. **Deploy:**

   ```bash
   npm run deploy
   ```

### Local Development

Start the development server:

```bash
npm run dev
```

Access endpoints:

- Calendar: `http://localhost:8787/events.ics`
- Manual trigger: `http://localhost:8787/cdn-cgi/handler/scheduled`

## 📅 Calendar Subscription

Replace `your-worker-domain.workers.dev` with your actual Worker URL:

### Apple Calendar (iOS/macOS)

1. Settings → Calendar → Accounts → Add Account → Other
2. Add Subscribed Calendar
3. URL: `https://your-worker-domain.workers.dev/events.ics`

### Google Calendar

1. Google Calendar → Other calendars (+) → From URL
2. URL: `https://your-worker-domain.workers.dev/events.ics`

### Outlook

1. Calendar → Add calendar → Subscribe from web
2. URL: `https://your-worker-domain.workers.dev/events.ics`

## 🛠️ Configuration

### Cron Schedule

Update the schedule in `wrangler.toml`:

```toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

### Cache Settings

Modify cache duration in `src/constants.ts`:

```typescript
export const CACHE_CONFIG = {
  maxAge: 60 * 60 * 24, // 24 hours in seconds
} as const;
```

### Retry Configuration

Adjust retry behavior in `src/constants.ts`:

```typescript
export const REQUEST_CONFIG = {
  timeout: 10000, // 10 seconds
  maxRetries: 3, // 3 retry attempts
  retryDelayMs: 2000, // 2 second base delay
} as const;
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm test -- --coverage     # With coverage report
```

Test categories:

- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end worker functionality
- **Parser Tests**: Academic calendar parsing logic
- **Utility Tests**: Retry mechanism, ETag generation, logging

## 📁 Project Structure

```text
src/
├── index.ts              # Main worker entry point
├── parser.ts             # KNUE website parsing logic
├── types.ts              # TypeScript type definitions
├── constants.ts          # Configuration constants
└── utils/
    ├── calendar.ts       # ICS generation utilities
    ├── etag.ts          # ETag generation for caching
    ├── logger.ts        # Structured logging
    └── retry.ts         # Retry mechanism with jitter

tests/
├── index.test.ts         # Main worker tests
├── parser.test.ts        # Parser functionality tests
├── constants.test.ts     # Constants validation tests
├── helpers/
│   └── mocks.ts         # Test utilities and mocks
└── utils/
    ├── calendar.test.ts  # Calendar generation tests
    ├── etag.test.ts     # ETag utility tests
    ├── logger.test.ts   # Logger functionality tests
    └── retry.test.ts    # Retry mechanism tests
```

## 🔧 Architecture Details

### Event Processing Pipeline

1. **Fetch**: Retrieve HTML from KNUE academic calendar
2. **Parse**: Extract event data using CSS selectors
3. **Filter**: Remove holidays and maintenance events
4. **Sanitize**: Clean titles for ICS compliance
5. **Transform**: Convert to RFC 5545 format
6. **Cache**: Store in Cloudflare KV with ETag

### Error Handling

- **Exponential Backoff**: Gradual retry delay increase
- **Jitter**: Random delay to prevent thundering herd
- **Graceful Degradation**: Preserve existing calendar on errors
- **Comprehensive Logging**: Structured error reporting

### Performance Optimizations

- **HTTP Caching**: ETag-based conditional requests
- **KV Storage**: Fast edge-cached calendar delivery
- **Minimal Dependencies**: Lightweight runtime footprint
- **Academic Year Logic**: Smart date parsing for cross-year events

## 🚨 Troubleshooting

### Common Issues

**Calendar not updating:**

- Check worker logs for parsing errors
- Verify cron trigger is active
- Manually trigger: `curl https://your-worker.dev/cdn-cgi/handler/scheduled`

**Events missing or incorrect:**

- KNUE website structure may have changed
- Update CSS selectors in `src/parser.ts`
- Check holiday filtering logic

**Performance issues:**

- Monitor KV usage and cache hit rates
- Adjust retry settings if timeouts occur
- Consider increasing cache duration

### Debug Mode

Enable verbose logging in development:

```bash
# Set log level in wrangler.toml
[vars]
LOG_LEVEL = "debug"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines

- Maintain 100% test coverage
- Follow TypeScript strict mode
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Korea National University of Education for providing the academic calendar data
- Cloudflare Workers platform for serverless infrastructure
- The open-source community for excellent tooling and libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/kadragon/knue-ics-calendar/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kadragon/knue-ics-calendar/discussions)
- **Security**: Report vulnerabilities privately via GitHub Security tab

---

Last updated: 2025-07-27
