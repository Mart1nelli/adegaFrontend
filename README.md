# AdegaDoPaiFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.5.

## Development server

## Mercado Pago Transparente

O checkout usa o Payment Brick do Mercado Pago. Configure a chave pública em
`src/environments/environment.ts`:

```ts
mercadoPagoPublicKey: 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
```

O token privado continua configurado somente no backend pela variável
`MERCADOPAGO_ACCESS_TOKEN`.

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

### Docker

A `Dockerfile` is included in this folder that builds the Angular app and serves it via Nginx.  The accompanying `docker-compose.yml` no longer needs a `version` field; it’s ignored by newer Docker.

You can either build independently:

```bash
cd adega-do-pai-frontend
docker build -t adega-frontend .
docker run --rm -p4200:80 adega-frontend
```

or simply start all services via `docker-compose` from the repository root; the frontend container will be reachable at `http://localhost:4200`.

