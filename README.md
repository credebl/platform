# CREDEBL SSI Platform

This repository hosts the codebase for CREDEBL SSI Platform backend.

## Prerequisites

### • Install Docker and Docker Compose
See: https://docs.docker.com/engine/install/

### • Install Node.js
Version: >= 18.17.0  
See: https://nodejs.dev/en/learn/how-to-install-nodejs/

### • Install NestJS CLI
```bash
npm i @nestjs/cli@latest 
```

## Setup Instructions

### • Setup and Run PostgreSQL
Start the PostgreSQL service using Docker:

```bash
docker run --name credebl-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=credebl \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=credebl \
  -v credebl_pgdata:/var/lib/postgresql/data \
  -d postgres:16
```

### • Run Prisma to Generate Database Schema

```bash
cd ./libs/prisma-service/prisma
npx prisma generate
npx prisma db push
```

### • Seed Initial Data

```bash
cd ./libs/prisma-service
npx prisma db seed
```

## Install NATS Message Broker

### • Pull NATS Docker Image

NATS is used for inter-service communication. The only prerequisite here is to install Docker.

```bash
docker pull nats:latest
```

### • Run NATS using Docker Compose
The `docker-compose.yml` file is available in the root folder.

```bash
docker-compose up
```

## OpenBao Secret Storage (Optional)

The platform can source the credentials used by email and file-storage integrations from an [OpenBao](https://openbao.org) server instead of plain environment variables. This is opt-in and disabled by default.

### • Run OpenBao using Docker Compose

```bash
docker compose -f docker-compose.openbao.yml up -d
```

This starts an OpenBao server on `http://127.0.0.1:8200` with file-backed storage persisted on a named volume. Server settings live in `config.hcl`.

### • Provision the server

OpenBao starts sealed and uninitialized. Run the one-shot provisioning script (idempotent — safe to re-run):

```bash
./openbao-init.sh
```

The script initializes and unseals the server, enables the KV v2 secrets engine at `secret/`, enables the AppRole auth method, creates a `credebl` role scoped to the `credebl_*` secret paths, stores the secret values found in the environment (e.g. `RESEND_API_KEY`, `SMTP_HOST`, `AWS_ACCESS_KEY`), and prints the values to copy into your env file:

```bash
BAO_URL=http://127.0.0.1:8200
BAO_SECRET_PATH=secret/data/credebl_resend_api_key
BAO_ROLE_ID=<generated>
BAO_SECRET_ID=<generated>
```

Keep the printed `BAO_UNSEAL_KEY` and `BAO_ROOT_TOKEN` safe — they are shown only once. On later runs, pass `BAO_ROOT_TOKEN` (and `BAO_SECRET_ID` to re-print it).

### • Configure the platform

Add the following to your `.env` (values are already present as placeholders in `.env.demo`):

```bash
ENABLE_BAO=true
SECRETS_PROVIDER=openbao
BAO_URL=http://127.0.0.1:8200
BAO_SECRET_PATH=secret/data/credebl_resend_api_key
BAO_ROLE_ID=<from openbao-init.sh>
BAO_SECRET_ID=<from openbao-init.sh>
```

At startup every microservice authenticates to OpenBao via AppRole, fetches the secrets at `BAO_SECRET_PATH`, and injects them into `process.env` before the NATS listener starts. Email and S3 integrations re-fetch their own credential paths on demand (e.g. `secret/data/credebl_smtp_config`, `secret/data/credebl_aws_keys`) with a 10-minute TTL cache.

Set `ENABLE_BAO=false` (or omit it) to fall back to local environment variables.

## Run CREDEBL Microservices

### • Install Dependencies
```bash
npm install
```

### • Configure Environment Variables
Configure environment variables in `.env` before you start the API Gateway.

### • Running the API Gateway
You can optionally use the `--watch` flag during development/testing.

```bash
nest start [--watch]
```

### • Starting Individual Microservices

For example, to start the `organization service` microservice, run the following command in a separate terminal window:

```bash
nest start organization [--watch]
```

Start all the microservices one after another in separate terminal windows:

```bash
nest start user [--watch]
nest start ledger [--watch]
nest start connection [--watch]
nest start issuance [--watch]
nest start verification [--watch]
nest start agent-provisioning [--watch]
nest start agent-service [--watch]
```

## Access Microservice Endpoints

To access microservice endpoints using the API Gateway, navigate to:

```
http://localhost:5000/api
```

## Credit

The CREDEBL platform is built by AYANWORKS team. 
For the core SSI capabilities, it leverages the great work from multiple open-source projects such as Hyperledger Aries, Bifold, Asker, Indy, etc.

## Contributing

Pull requests are welcome! Please read our [contributions guide](https://github.com/credebl/platform/blob/main/CONTRIBUTING.md) and submit your PRs. We enforce [developer certificate of origin](https://developercertificate.org/) (DCO) commit signing — [guidance](https://github.com/apps/dco) on this is available. We also welcome issues submitted about problems you encounter in using CREDEBL.

## License

[Apache License Version 2.0](https://github.com/credebl/platform/blob/main/LICENSE)