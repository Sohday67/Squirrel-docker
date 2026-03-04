# Squirrel

Squirrel is a simple, fast and powerful expense tracker for iOS built with privacy in mind.

![Images](README/Screenshots/GitHubHeader_v5.png)

[![Download on the App Store](README/Resources/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg)](https://apps.apple.com/app/squirrel-expense-tracker/id6477331498)

Available for iOS 15.0 and later.

## Highlights:

- Simple and intuitive interface. Fast expense input with quick category and place suggestions.
- No account or tracking.
- All data is stored locally on your device with optional iCloud integration.
- Free forever. Squirrel is designed to have very little ongoing cost to make it free for everyone.
- Zero AI features and 100% organic human code.

## Features:

### Fast and Detailed Expense Tracking

Add your expenses quickly - Squirrel suggests most used categories and autocompletes places right as you type. Track returns when a friend pays you back or an order is canceled. Back up your data to iCloud, but only if you want to.
![Charts](README/Screenshots/GitHubInput_v5.png)


### Simple and Clear Charts

Evaluate your expenses at a glance. Quickly see your weekly total or daily average right on the home screen. Or switch to the stats view for more detailed analytics.
![Charts](README/Screenshots/GitHubCharts_v5.png)

### Track Your Expenses Across Currencies and Timezones

Track expenses in 150+ currencies that are updated every hour. Squirrel automatically converts currencies and records timezones so you won't be guessing when or how much. You can also separate the display and default input currency when travelling.
![Currencies](README/Screenshots/GitHubCurrencies_v5.png)

### Advanced Filters and Data Export

Filter expenses by date, category, currency and more with powerful and simple filters. Export filtered data to CSV with many formatting options and back up your expenses locally to a JSON file.
![Filters and Export](README/Screenshots/GitHubFilters_v5.png)

## Web Version & Server Deployment

Squirrel now includes a web version and a Docker-based backend server for cross-platform data sync with user authentication and two-factor authentication (2FA) via TOTP (compatible with Ente Auth, Google Authenticator, etc.).

### Hosting with Tailscale (HTTPS via `*.ts.net`)

The recommended way to expose Squirrel with automatic HTTPS is through [Tailscale](https://tailscale.com). Tailscale assigns your machine a DNS name like `squirrel.<tailnet>.ts.net` and provisions a TLS certificate automatically — no port-forwarding, no Certbot, no public IP required.

#### Prerequisites

1. A [Tailscale account](https://login.tailscale.com) (free tier works).
2. [MagicDNS](https://tailscale.com/kb/1081/magicdns) enabled on your tailnet (enabled by default).
3. [HTTPS certificates](https://tailscale.com/kb/1153/enabling-https) enabled on your tailnet (Tailscale admin console → DNS → Enable HTTPS).
4. An **auth key** generated at <https://login.tailscale.com/admin/settings/keys>. Check _Reusable_ and _Ephemeral_ if you want automatic reconnects.

#### Setup

```bash
# Clone the repository
git clone https://github.com/Sohday67/Squirrel-docker.git
cd Squirrel-docker

# Configure environment variables
cat > .env <<EOF
JWT_SECRET=$(openssl rand -hex 32)
TS_AUTHKEY=tskey-auth-XXXX          # paste your Tailscale auth key
TS_HOSTNAME=squirrel                # machine name on your tailnet
EOF

# Start the stack with the Tailscale overlay
docker compose -f docker-compose.yml -f docker-compose.tailscale.yml up -d
```

Once the containers are running, Squirrel is reachable at:

```
https://squirrel.<your-tailnet>.ts.net
```

Only devices on your Tailscale network can access this URL. Traffic between your device and the Tailscale container is encrypted with a valid TLS certificate; internal traffic between containers stays on an isolated Docker network.

#### How it works

| Container   | Role |
|-------------|------|
| `tailscale` | Joins your tailnet, obtains a TLS cert, and reverse-proxies HTTPS traffic to the `web` and `server` containers using [Tailscale Serve](https://tailscale.com/kb/1312/serve). |
| `web`       | Nginx serving the Squirrel web frontend (no host port exposed). |
| `server`    | Node.js API backend (no host port exposed). |
| `db`        | PostgreSQL database (internal only). |

The Tailscale Serve config (`tailscale/serve.json`) routes:
- `/api/*` → `http://server:3001` (backend API)
- `/*` → `http://web:80` (web frontend)

#### iOS app configuration

In the Squirrel iOS app, go to **Settings → Account & Sync** and set the server URL to:

```
https://squirrel.<your-tailnet>.ts.net
```

Make sure your iOS device is connected to the same Tailscale network (install the [Tailscale iOS app](https://apps.apple.com/app/tailscale/id1470499037)).

#### Tailscale without the overlay

If you prefer to run Tailscale on the host instead of in Docker, simply start the stack with the base compose file (`docker compose up -d`) and use [`tailscale serve`](https://tailscale.com/kb/1312/serve) on the host to proxy to `localhost:3000`.

### Quick Start with Docker (no Tailscale)

```bash
# Clone the repository
git clone https://github.com/Sohday67/Squirrel-docker.git
cd Squirrel-docker

# Set a secure JWT secret in .env
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Start all services
docker compose up -d
```

This starts three services:
- **Web Frontend**: http://localhost:3000
- **API Server**: http://localhost:3001
- **PostgreSQL Database**: Internal (port 5432)

### Features (Web & iOS)

- **User Authentication**: Register/login with username, email, and password
- **Two-Factor Authentication**: TOTP-based 2FA compatible with Ente Auth
- **Data Sync**: Spendings, categories, and returns sync between iOS app and web
- **iCloud Backup**: Optional iCloud backup toggle in iOS settings
- **Full Expense Tracking**: Same features as the iOS app—categories, multi-currency, statistics, charts, CSV/JSON export

### iOS App Configuration

After building the iOS app, configure the server URL in **Settings → Account & Sync** to point to your deployed server. Sign in or create an account to start syncing data.

### Building the Unsigned IPA

The repository includes a GitHub Actions workflow that automatically builds an unsigned IPA on every push to `main`. You can also trigger it manually from the Actions tab. The IPA artifact is available for download from the workflow run.

## Testing

Squirrel does not have automated tests for now, but it is actively tested on devices running the latest iOS 15, 18, and 26. Feel free to open [an issue](https://github.com/PinkXaciD/Squirrel/issues/new) if anything goes wrong.

## License and Copyright

*This code is lisenced under GPLv3. [Learn more.](LICENSE)*

*The Squirrel logo, app icon or any promotional materials cannot be used for any commercial purpose without explicit permission. © Copyright 2026, PinkXaciD.*