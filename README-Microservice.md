# CREDEBL migration to Microservices

## Run CREDEBL Micro-services

```bash
$ npm install
```
## Creating the individual microservice mode structure as follows:
`nest generate app [my-app]`

## Starting the individual Microservices
`nest start [my-app] [--watch]`

## Creating the libraries
`nest g library [my-library]`

### library schematic prompts you for a prefix (credebl alias) for the library:
`What prefix would you like to use for the library (default: @app)? credebl`
## Health endpoints
Each microservice can expose `/health/live` and `/health/ready` when `HEALTH_PORT` is set. See [docs/microservice-health-endpoints.md](docs/microservice-health-endpoints.md).
