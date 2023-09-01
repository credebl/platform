# CREDEBL SSI Platform

This repository host codebase for CREDEBL SSI Platform backend.

## Pre-requisites

Install Docker and docker-compose
</br>See: https://docs.docker.com/engine/install/

Install Node: >= 18.17.0
</br>See: https://nodejs.dev/en/learn/how-to-install-nodejs/

**Install NestJS**
```bash
npm i @nestjs/cli@latest 
```

**Setup & run postgres**
Start the postgresql service using the docker:

```bash
docker run --name some-postgres -p 5432:5432 -e POSTGRES_PASSWORD=<secretpassword> -e POSTGRES_USER=credebl -d postgres
```

**Run prisma to generate db schema**

```bash
cd ./libs/prisma-servie/prisma
npx prisma generate
npx prisma db push
```

**Seed initial data**

```bash
cd ./libs/prisma-servie
npx prisma db seed
```

# Install NATS Message Broker
## Pull NATS docker image

NATS is used for inter-service communication. The only pre-requisite here is to install docker.

```
docker pull nats:latest
```

## Run NATS using `docker-compose`
The `docker-compose.yml` file is available in the root folder.

```
docker-compose up
```


## Run CREDEBL Micro-services

```bash
npm install
```

## Configure environment variables in `.env` before you start the API Gateway

## Running the API Gateway app
You can optionally use the `--watch` flag during development / testing.

```bash
nest start [--watch]
```

## Starting the individual Micro-services

### e.g. for starting `organization service` micro-service run below command in a separate terminal window

```bash
nest start organization [--watch]
```

### Likewise you can start all the micro-services one after another in separate terminal window

```bash
nest start user [--watch]
nest start ledger [--watch]
nest start connection [--watch]
nest start issuance [--watch]
nest start verification [--watch]
nest start agent-provisioning [--watch]
nest start agent-service [--watch]
```

## To access micro-service endpoints using the API Gateway. Navigate to

```
http://localhost:5000/api
```

## Credit

The CREDEBL platform is built by Blockster Labs (Product division of AyanWorks) team. 
For the core SSI capabilities, it leverages the great work from multiple open-source projects such as Hyperledger Aries, Bifold, Asker, Indy, etc.

## Contributing

Pull requests are welcome! Please read our [contributions guide](https://github.com/credebl/platform/blob/main/CONTRIBUTING.md) and submit your PRs. We enforce [developer certificate of origin](https://developercertificate.org/) (DCO) commit signing — [guidance](https://github.com/apps/dco) on this is available. We also welcome issues submitted about problems you encounter in using CREDEBL.

## License

[Apache License Version 2.0](https://github.com/credebl/platform/blob/main/LICENSE)