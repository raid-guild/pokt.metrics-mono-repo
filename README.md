# POKT Metrics Monorepo

![Architecture Model](architecture.png)

Cross-chain DeFi dashboard for tracking POKT prices, pool TVLs, and transaction volumes across Ethereum, Base, and Solana.

---

## Monorepo Structure

```
/packages
├── indexer             # Fetch + normalize current data from The Graph + Moralis APIs into TimescaleDB
├── historical-sync     # Fetch + normalize historical data
├── api                 # Express + Apollo GraphQL API exposing time-series data
├── client              # Frontend application
```

---

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up indexer environment (optional)

```bash
cp packages/indexer/.env.sample packages/indexer/.env
```

### 2.1 Set database schemas (optional)

```bash
pnpm setup:db
```

### 3 Run indexer (optional)

```bash
pnpm dev:indexer
```

### 4. Set up API environment

```bash
cp packages/api/.env.sample packages/api/.env
```

- Make sure to set missing envs

### 5. Start API server (GraphQL) and frontend

```bash
pnpm dev
```

GraphQL API: [http://localhost:4000/graphql](http://localhost:4000/graphql)

---

## Alternative Docker Setup

### 1. Set up root environment

```bash
cp .env.sample .env
```

### 2. Set up indexer environment

```bash
cp packages/indexer/.env.sample packages/indexer/.env
```

### 3. Set up API environment

```bash
cp packages/api/.env.sample packages/api/.env
```

### 4. Set up client environment

```bash
cp packages/client/.env.sample packages/client/.env
```

- Make sure to set missing envs

### 5. Run Docker Compose

```bash
docker compose up --build
```

GraphQL API: http://localhost:4000/graphql

---

## Historical Sync Server

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up historical sync environment

```bash
cp packages/historical-sync/.env.sample packages/historical-sync/.env
```

### 3. Run historical sync

```bash
pnpm start:historical-sync
```

---

## Tech Stack

- **TypeScript** monorepo (`pnpm`)
- **TimescaleDB** (PostgreSQL 16)
- **Moralis API** (EVM + Solana)
- **BullMQ + Redis** for job scheduling
- **Apollo Server** (GraphQL over Express)

---

## Dev Tips

- Use `psql` or `pgAdmin` to inspect the TimescaleDB
- All timestamps are stored in **milliseconds**
- Use `to_timestamp(timestamp / 1000.0)` in raw SQL
