# Cross-Chain DEX Arbitrage Scanner

A real-time cross-chain arbitrage detection tool that fetches live token prices from decentralized exchanges across **Ethereum**, **BSC**, **Polygon**, and **Arbitrum**, identifies price discrepancies, and outputs ranked arbitrage opportunities. Ships with a production-ready Docker container and a fully automated CI/CD pipeline.

![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [One-Shot Scan Mode](#one-shot-scan-mode)
  - [Real-Time Streaming Mode](#real-time-streaming-mode)
- [Docker](#docker)
  - [Build the Image](#build-the-image)
  - [Run in Scan Mode](#run-in-scan-mode)
  - [Run in Streaming Mode](#run-in-streaming-mode)
- [CI/CD Pipeline](#cicd-pipeline)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
  - [Price Fetching](#price-fetching)
  - [Arbitrage Detection](#arbitrage-detection)
  - [SSE Streaming](#sse-streaming)
- [Example Output](#example-output)
- [Technologies Used](#technologies-used)
- [Lessons Learned](#lessons-learned)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Overview

The same token can trade at slightly different prices on different decentralized exchanges across different blockchains. Traders who spot these price gaps first can buy low on one chain and sell high on another — this is **cross-chain arbitrage**.

This project is a **command-line arbitrage scanner** that:
1. Fetches real-time prices from DEXs across 4 blockchains via the DexPaprika API
2. Compares prices to find cross-chain discrepancies
3. Outputs a ranked table of opportunities sorted by profit potential
4. Optionally streams prices in real time via Server-Sent Events (SSE)

---

## Features

- **Multi-Chain Price Scanning** — Queries live prices for WETH, USDC, and USDT across Ethereum, BSC, Polygon, and Arbitrum simultaneously
- **Resilient Parallel Fetching** — Uses `Promise.allSettled` to handle partial API failures gracefully without crashing
- **Arbitrage Detection Engine** — Groups prices by token, identifies the cheapest and most expensive chains, and calculates spread percentages
- **Real-Time SSE Streaming** — Persistent connections to DexPaprika's streaming endpoint for live price monitoring with configurable alert thresholds
- **Dual-Mode Docker Container** — Single image supports both one-shot scanning and continuous streaming via environment variables
- **Multi-Stage Docker Build** — Optimized production image using Alpine Linux for minimal size and attack surface
- **CI/CD Pipeline** — GitHub Actions workflow that automatically tests and builds the Docker image on every push to `main`
- **Zero External Dependencies** — Uses Node.js 22's built-in `fetch()` API — no axios, no node-fetch, no npm packages required

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    entrypoint.js                     │
│              (MODE=scan or MODE=stream)              │
├────────────────────┬────────────────────────────────┤
│                    │                                 │
│    index.js        │         stream.js               │
│  (One-Shot Scan)   │    (Real-Time Streaming)        │
│                    │                                 │
├────────────────────┴────────────────────────────────┤
│                                                      │
│    scanner.js              arbitrage.js               │
│  (Price Fetching)      (Opportunity Detection)        │
│                                                      │
├──────────────────────────────────────────────────────┤
│                     config.js                        │
│         (Tokens, Chains, Contract Addresses)         │
├──────────────────────────────────────────────────────┤
│                  DexPaprika API                      │
│     REST: /networks/{chain}/tokens/{address}         │
│     SSE:  streaming.dexpaprika.com/stream            │
└──────────────────────────────────────────────────────┘
```

---

## Prerequisites

- **Node.js** 22 or higher (required for built-in `fetch()`)
- **Docker** (for containerized deployment)
- **Git** (for version control)
- **GitHub account** (for CI/CD pipeline)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/arb-scanner.git
cd arb-scanner
```

### 2. Verify Node.js version

```bash
node --version
# Should show v22.x.x or higher
```

### 3. Run the scanner

```bash
node src/index.js
```

No `npm install` required — this project uses zero external dependencies.

---

## Usage

### One-Shot Scan Mode

Fetches current prices across all configured chains, detects arbitrage opportunities, and exits.

```bash
node src/index.js
```

### Real-Time Streaming Mode

Opens persistent SSE connections to DexPaprika's streaming endpoint and prints alerts whenever a spread exceeds the configured threshold.

```bash
node src/stream.js
```

Customize the alert threshold:

```bash
# Only alert on spreads above 0.05%
ALERT_THRESHOLD=0.05 node src/stream.js
```

Press `Ctrl+C` to stop the stream.

---

## Docker

### Build the Image

```bash
docker build -t arb-scanner .
```

### Run in Scan Mode

```bash
docker run --rm arb-scanner
```

### Run in Streaming Mode

```bash
docker run --rm -e MODE=stream arb-scanner
```

### Run with Custom Alert Threshold

```bash
docker run --rm -e MODE=stream -e ALERT_THRESHOLD=0.05 arb-scanner
```

---

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every push to `main` and on pull requests.

### Pipeline Jobs

| Job | Trigger | Description |
|-----|---------|-------------|
| **Test Scanner** | Push & PR | Checks out code, sets up Node.js 22, and runs `node src/index.js` to verify the scanner executes without errors |
| **Build and Push Docker Image** | Push to `main` only | Builds the Docker image using Buildx and pushes to Docker Hub with `latest` and commit SHA tags |

### Required Repository Secrets

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token with Read/Write permissions |

Configure these in **Settings → Secrets and variables → Actions** in your GitHub repository.

---

## Project Structure

```
arb-scanner/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD pipeline
├── src/
│   ├── config.js               # Token addresses, chains, and API configuration
│   ├── scanner.js              # Price fetching (fetchTokenPrice, fetchAllPrices)
│   ├── arbitrage.js            # Arbitrage detection (findOpportunities)
│   ├── index.js                # One-shot scan entry point
│   ├── stream.js               # Real-time SSE streaming client
│   └── entrypoint.js           # Dual-mode router (scan vs stream)
├── .dockerignore               # Files excluded from Docker build context
├── .gitignore                  # Files excluded from version control
├── Dockerfile                  # Multi-stage production build
├── package.json                # Project metadata and scripts
└── README.md                   # This file
```

---

## Configuration

All configuration lives in `src/config.js`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `apiBaseUrl` | `https://api.dexpaprika.com` | DexPaprika REST API base URL (no API key required) |
| `minSpreadPercent` | `0.1` | Minimum spread % to display in one-shot scan results |

### Tracked Tokens

| Token | Ethereum | BSC | Polygon | Arbitrum |
|-------|----------|-----|---------|----------|
| WETH  | ✅       |     | ✅      | ✅       |
| USDC  | ✅       | ✅  | ✅      | ✅       |
| USDT  | ✅       | ✅  | ✅      | ✅       |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MODE` | `scan` | `scan` for one-shot, `stream` for real-time SSE |
| `ALERT_THRESHOLD` | `0.5` | Minimum spread % to trigger alerts in streaming mode |

---

## How It Works

### Price Fetching

`scanner.js` calls the DexPaprika REST endpoint `GET /networks/{network}/tokens/{token_address}` for each token/chain combination. All requests fire in parallel using `Promise.allSettled`, which ensures the scanner returns results even if some chains are temporarily unreachable.

```
Ethereum  ──┐
BSC       ──┼── Promise.allSettled ──► Filter fulfilled results ──► Price array
Polygon   ──┤
Arbitrum  ──┘
```

### Arbitrage Detection

`arbitrage.js` takes the flat array of price points, groups them by token symbol, and for each token:

1. Finds the chain with the **lowest price** (buy chain)
2. Finds the chain with the **highest price** (sell chain)
3. Calculates the **spread percentage**: `((highest - lowest) / lowest) × 100`
4. Sorts all opportunities by spread descending (best opportunities first)

### SSE Streaming

`stream.js` opens persistent HTTP connections to DexPaprika's SSE endpoint at `streaming.dexpaprika.com/stream`. Each connection:

1. Receives real-time `data:` events with JSON payloads containing price updates
2. Updates an **in-memory price cache** keyed by `{token}:{chain}`
3. Recalculates arbitrage spreads on every price update
4. Prints a timestamped alert if any spread exceeds `ALERT_THRESHOLD`

---

## Example Output

### One-Shot Scan

```
Cross-Chain DEX Arbitrage Scanner
=================================

Fetching prices across chains...

Received 11 price points.

Found 3 opportunities (min spread: 0.1%):

Token   Buy Chain   Sell Chain  Buy Price     Sell Price    Spread
----------------------------------------------------------------------
WETH    arbitrum    polygon     $2738.4500    $2740.1200    0.0610%
USDC    bsc         ethereum    $0.9998       $1.0001       0.0300%
USDT    polygon     ethereum    $0.9997       $1.0002       0.0500%

Scan complete.
```

### Streaming Mode

```
Cross-Chain DEX Arbitrage Scanner - STREAMING MODE
===================================================

Alert threshold: 0.5%
Connecting to price streams...

Connected: WETH on ethereum
Connected: WETH on arbitrum
Connected: WETH on polygon
Connected: USDC on ethereum
Connected: USDC on bsc
...

[2026-05-15T14:32:01.234Z] ALERT: USDT | Buy on polygon @ $0.9994 | Sell on ethereum @ $1.0002 | Spread: 0.0800%
[2026-05-15T14:32:15.891Z] ALERT: WETH | Buy on arbitrum @ $2737.20 | Sell on polygon @ $2741.85 | Spread: 0.1699%
```

---

## Technologies Used

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 22 (built-in `fetch()`, no external dependencies) |
| **API** | DexPaprika REST API & SSE Streaming |
| **Containerization** | Docker (multi-stage Alpine builds) |
| **CI/CD** | GitHub Actions |
| **Chains** | Ethereum, BSC, Polygon, Arbitrum |
| **Tokens** | WETH, USDC, USDT |

---

## Lessons Learned

- **`Promise.allSettled` over `Promise.all`** — When querying multiple external APIs in parallel, `Promise.allSettled` prevents a single failure from crashing the entire batch. This is critical for production systems that depend on multiple data sources.

- **Multi-stage Docker builds** — Separating the build environment from the production image reduces image size and attack surface. The final image contains only what's needed to run.

- **Zero-dependency architecture** — Node.js 22's built-in `fetch()` eliminates the need for HTTP libraries. Fewer dependencies means fewer security vulnerabilities and simpler Docker builds.

- **Dual-mode containers via environment variables** — A single Docker image can serve multiple use cases (scan vs. stream) by routing through an entrypoint that checks `process.env.MODE`.

- **Server-Sent Events for real-time data** — SSE provides a lightweight alternative to WebSockets for one-directional data streaming, perfect for consuming live price feeds.

---

## Future Improvements

- [ ] Add more tokens and chains (Avalanche, Optimism, Base)
- [ ] Implement profit calculations factoring in gas costs and bridge fees
- [ ] Add WebSocket notifications or Telegram/Discord alerts
- [ ] Store historical spread data in a database for trend analysis
- [ ] Add unit tests with mocked API responses
- [ ] Implement automatic trade execution for detected opportunities

---

## License

This project is licensed under the MIT License.
