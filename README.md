# CREDEBL SSI Platform

This repository hosts the codebase for the CREDEBL SSI Platform backend.

> **Note:** This guide covers the GitHub repo-based local setup. For the hosted/cloud setup, see [docs.credebl.id](https://docs.credebl.id).

---

## Prerequisites

### • Install Docker and Docker Compose
See: https://docs.docker.com/engine/install/

### • Install Node.js
Version: >= 18.17.0  
See: https://nodejs.dev/en/learn/how-to-install-nodejs/

### • Install pnpm

> ⚠️ **This project uses `pnpm` as its package manager.** Using `npm install` will fail or produce incorrect results. Do not use `npm`.

```bash
npm install -g pnpm
```

The project is pinned to `pnpm@9.15.3` (see `"packageManager"` in `package.json`).

### • Install NestJS CLI
```bash
pnpm add -g @nestjs/cli
```

---

## Setup Instructions

### Step 1 — Clone the repo and copy env

```bash
git clone https://github.com/credebl/platform.git
cd platform
cp .env.demo .env
```

Edit `.env` with your actual values before proceeding. Key variables are called out in each step below.

---

### Step 2 — Set Up and Run PostgreSQL

Start PostgreSQL via Docker. The credentials and DB name **must match** what you set in `DATABASE_URL` / `POOL_DATABASE_URL` in your `.env`.

```bash
docker run --name credebl-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=credebl \
  -v credebl_pgdata:/var/lib/postgresql/data \
  --network platform_default \
  -d postgres:16
```

> ⚠️ **If you later run `docker compose up`, Docker Compose also defines a service named `credebl-postgres`.** To avoid a container name collision, stop and remove the manually started container first (`docker rm -f credebl-postgres`) before running `docker compose up`.

Then update your `.env` to match those credentials:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/credebl"
POOL_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/credebl"
```

> ⚠️ **Do not use `localhost` in `DATABASE_URL` when services run inside Docker containers.** Inside a container, `localhost` resolves to the container itself — not the host. Use your machine's LAN IP (e.g. `192.168.x.x`) or a Docker service name instead. This applies to `KEYCLOAK_DOMAIN` and `KEYCLOAK_ADMIN_URL` as well (see Step 5).

---

### Step 3 — Install Dependencies

```bash
# From repo root — use pnpm, not npm
pnpm install
```

---

### Step 4 — Run Prisma Migrations (Schema Generation)

> ⚠️ **Migrations must run before seeding.** If you seed first, it will fail because the tables don't exist yet.

From the repo root:

```bash
cd libs/prisma-service
npx prisma migrate deploy
```

Or use the root-level script:

```bash
# From repo root
npx prisma migrate deploy --schema=./libs/prisma-service/prisma/schema.prisma
```

---

### Step 5 — Set Up Keycloak

Keycloak is required for authentication. It is **not started automatically** — you must run it separately and configure it fully before seeding.

#### 5a — Run the Keycloak container

> ⚠️ **Keycloak must be on the same Docker network as the platform services** (`platform_default`), otherwise the containers cannot reach it. Include `--network platform_default` when creating the container.

```bash
docker run --name credebl-keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  --network platform_default \
  -d quay.io/keycloak/keycloak:latest start-dev
```

#### 5b — Create a Realm

1. Open the Keycloak Admin Console: `http://localhost:8080`
2. Log in with `admin` / `admin`
3. Create a new **Realm** named exactly: `credebl-platform`

#### 5c — Create Client 1: `adminClient`

This client is used by the platform seed script and user-service to authenticate platform admin users.

1. In the `credebl-platform` realm → **Clients** → **Create client**
2. **Client ID:** `adminClient`
3. **Client authentication:** ON (confidential)
4. **Service accounts enabled:** ON  
5. Go to **Service account roles** tab → **Assign role** → filter by `realm-management` → add:
   - `manage-users`
   - `view-users`
   - `query-users`
6. Go to **Credentials** tab → copy the **Client Secret**
7. Update `.env`:

```env
ADMIN_KEYCLOAK_ID=adminClient
ADMIN_KEYCLOAK_SECRET=<copied-secret-from-keycloak>
```

#### 5d — Create Client 2: `credeblClient`

This client is the management client used for general Keycloak operations.

1. **Clients** → **Create client**
2. **Client ID:** `credeblClient`
3. **Client authentication:** ON (confidential)
4. **Service accounts enabled:** ON
5. Go to **Service account roles** tab → **Assign role** → filter by `realm-management` → add:
   - `manage-users`
   - `view-users`
   - `query-users`
   - `manage-realm`
6. Go to **Credentials** tab → copy the **Client Secret**
7. Update `.env`:

```env
KEYCLOAK_MANAGEMENT_CLIENT_ID=credeblClient
KEYCLOAK_MANAGEMENT_CLIENT_SECRET=<copied-secret-from-keycloak>
KEYCLOAK_REALM=credebl-platform
KEYCLOAK_MASTER_REALM=master
```

#### 5e — Set Keycloak domain in `.env`

> ⚠️ **If platform services run in Docker containers, do NOT use `localhost` for Keycloak URLs.**  
> Use your machine's LAN IP address instead (e.g. `192.168.1.x`). You can find it with `ip addr show` or `hostname -I`.

```env
# For Docker-based deployments — replace with your actual LAN IP:
KEYCLOAK_DOMAIN=http://192.168.x.x:8080/
KEYCLOAK_ADMIN_URL=http://192.168.x.x:8080

# For host-only (no Docker for platform services):
# KEYCLOAK_DOMAIN=http://localhost:8080/
# KEYCLOAK_ADMIN_URL=http://localhost:8080
```

---

### Step 6 — Configure Remaining `.env` Values

Set the following before seeding:

```env
PLATFORM_ADMIN_EMAIL=platform.admin@yopmail.com
CRYPTO_PRIVATE_KEY=YourSecretPrivateKeyHere
```

> `CRYPTO_PRIVATE_KEY` is used to encrypt/decrypt Keycloak client credentials stored in the DB. Keep it consistent across all runs — changing it after seeding will break decryption.

---

### Step 7 — Seed Initial Data

```bash
# From repo root
cd libs/prisma-service
npx prisma db seed
```

The seed script will:
1. Create org roles, agent types, ecosystem roles, ledgers, and user roles
2. Create the platform admin user and organization
3. Create the Keycloak user for the platform admin (or look up an existing one — see note below)
4. Encrypt and store Keycloak `clientId` / `clientSecret` in the DB

> **Re-seeding note:** If the Keycloak user already exists (e.g. on a re-seed), the script will look up the existing user's Keycloak ID and still update the DB record — so `keycloakUserId`, `clientId`, and `clientSecret` are always kept in sync.

---

### Step 8 — Install NATS Message Broker

NATS is used for inter-service communication.

```bash
docker pull nats:latest
```

Then start it (along with other infrastructure) using Docker Compose:

```bash
docker compose up -d
```

---

### Step 9 — Run CREDEBL Microservices

#### Configure environment variables

Ensure all values in `.env` are set correctly before starting services (see Steps 5–6 above).

#### Running the API Gateway

```bash
nest start [--watch]
```

#### Starting Individual Microservices

Start each microservice in a separate terminal window:

```bash
nest start user [--watch]
nest start ledger [--watch]
nest start connection [--watch]
nest start issuance [--watch]
nest start verification [--watch]
nest start agent-provisioning [--watch]
nest start agent-service [--watch]
```

---

## Access Microservice Endpoints

Once the API Gateway is running, Swagger UI is available at:

```text
http://localhost:5000/api
```

---

## Troubleshooting

### Sign-in returns 401 after setup

1. **Check `keycloakUserId` in the DB** — it must not be empty for the platform admin user. If it is, re-run the seed (it will now look up and fix this automatically).
2. **Check `KEYCLOAK_DOMAIN`** — if services run in Docker, `localhost` won't resolve to your host machine. Use your LAN IP.
3. **Check Keycloak logs** to confirm the password grant is succeeding.

### Seeding fails with Prisma errors

Ensure `prisma migrate deploy` ran successfully **before** running `prisma db seed`. The tables must exist first.

### Seeding fails with connection errors

Ensure `DATABASE_URL` in `.env` is reachable from where you're running the seed command (host vs. inside Docker makes a difference).

### `npm install` fails or produces wrong results

Use `pnpm install` — the project is configured for `pnpm` and will not work correctly with `npm`.

---

## Credit

The CREDEBL platform is built by the AYANWORKS team.  
For core SSI capabilities, it leverages the great work from multiple open-source projects such as Hyperledger Aries, Bifold, Askar, Indy, and others.

## Contributing

Pull requests are welcome! Please read our [contributions guide](https://github.com/credebl/platform/blob/main/CONTRIBUTING.md) and submit your PRs. We enforce [developer certificate of origin](https://developercertificate.org/) (DCO) commit signing — [guidance](https://github.com/apps/dco) on this is available. We also welcome issues submitted about problems you encounter in using CREDEBL.

## License

[Apache License Version 2.0](https://github.com/credebl/platform/blob/main/LICENSE)