// The catalog is the "template" behind the exported brief.
// To add a new building block, add an entry to COMPONENTS — nothing else needs to change.
//
// Fields:
//   type     unique id
//   label    technology name shown in the palette
//   category key of CATEGORIES
//   provider (optional) key of PROVIDERS — the cloud this component belongs to
//   tier     (optional) nesting level for boxes — see tierOf()
//   group    (optional) palette sub-branch within its category (see PALETTE_TREE)
//   blurb    one-line description shown in the palette
//   folder   (optional) top-level folder this component's code lives in
//   port     (optional) default local dev port
//   env      (optional) environment variables it needs
//   files    (optional) files / folders it adds at the repository root
//   setup    build instructions written into the brief

export const CATEGORIES = {
  repo: { label: 'Repository', color: '#a78bfa', order: 0 },
  aidev: { label: 'AI tool', color: '#2dd4bf', order: 0.5 },
  mcp: { label: 'MCP server', color: '#f59e0b', order: 0.6 },
  identity: { label: 'Service identity', color: '#818cf8', order: 0.8 },
  database: { label: 'Database', color: '#fbbf24', order: 1 },
  cache: { label: 'Cache / Queue', color: '#f87171', order: 2 },
  auth: { label: 'Auth', color: '#c084fc', order: 3 },
  storage: { label: 'File storage', color: '#fb923c', order: 3 },
  service: { label: 'External service', color: '#f472b6', order: 4 },
  analytics: { label: 'Analytics', color: '#facc15', order: 4 },
  ai: { label: 'AI model / framework', color: '#e879f9', order: 4 },
  other: { label: 'Custom', color: '#a3a3a3', order: 4 },
  backend: { label: 'API / Backend', color: '#34d399', order: 5 },
  frontend: { label: 'Frontend', color: '#38bdf8', order: 6 },
  hosting: { label: 'Hosting & deploy', color: '#94a3b8', order: 7 },
  cicd: { label: 'CI / CD', color: '#a3e635', order: 8 },
}

// Categories that support the build rather than being part of the running product.
export const INFRA_CATEGORIES = new Set(['repo', 'aidev', 'mcp', 'identity', 'hosting', 'cicd'])

export const PROVIDERS = {
  gcp: { label: 'GCP', name: 'Google Cloud', color: '#4285f4' },
  aws: { label: 'AWS', name: 'Amazon Web Services', color: '#ff9900' },
  azure: { label: 'Azure', name: 'Microsoft Azure', color: '#3b9cf5' },
}

// An existing MCP server that the AI tools in the plan connect to.
const mcp = (type, label, blurb, ...setup) => ({
  type: `mcp-${type}`,
  group: 'mcp',
  label: `${label} MCP`,
  category: 'mcp',
  blurb,
  env: [],
  setup: [
    ...setup,
    'Install it from its official source and follow its current setup documentation. Give it the narrowest access that covers the use above, and keep its token out of any committed file.',
  ],
})

export const COMPONENTS = [
  // ---------- Frontend ----------
  {
    type: 'react',
    label: 'React (Vite)',
    category: 'frontend',
    blurb: 'Single-page app',
    folder: 'frontend',
    port: 5173,
    env: ['VITE_API_URL'],
    setup: [
      'Scaffold with Vite using the React template (`npm create vite@latest frontend -- --template react`).',
      'Read the API base URL from `VITE_API_URL`; never hard-code it.',
      'Put all HTTP calls in a single `src/api/` module so components do not call `fetch` directly.',
      'Add client-side routing (React Router) only if the MVP has more than one screen.',
    ],
  },
  {
    type: 'nextjs',
    label: 'Next.js',
    category: 'frontend',
    blurb: 'React framework with SSR',
    folder: 'frontend',
    port: 3000,
    env: ['NEXT_PUBLIC_API_URL'],
    setup: [
      'Scaffold with `npx create-next-app@latest frontend` using the App Router.',
      'Read the API base URL from `NEXT_PUBLIC_API_URL`.',
      'Default to server components; mark components `"use client"` only where interactivity is needed.',
    ],
  },
  {
    type: 'vue',
    label: 'Vue (Vite)',
    category: 'frontend',
    blurb: 'Single-page app',
    folder: 'frontend',
    port: 5173,
    env: ['VITE_API_URL'],
    setup: [
      'Scaffold with `npm create vue@latest frontend`.',
      'Read the API base URL from `VITE_API_URL`.',
      'Use the Composition API with `<script setup>` and keep HTTP calls in a single `src/api/` module.',
    ],
  },
  {
    type: 'svelte',
    label: 'SvelteKit',
    category: 'frontend',
    blurb: 'Svelte app framework',
    folder: 'frontend',
    port: 5173,
    env: ['PUBLIC_API_URL'],
    setup: [
      'Scaffold with `npx sv create frontend`.',
      'Read the API base URL from `PUBLIC_API_URL`.',
    ],
  },
  {
    type: 'react-native',
    label: 'React Native (Expo)',
    category: 'frontend',
    blurb: 'iOS / Android app',
    folder: 'mobile',
    env: ['EXPO_PUBLIC_API_URL'],
    setup: [
      'Scaffold with `npx create-expo-app mobile`.',
      'Read the API base URL from `EXPO_PUBLIC_API_URL`. On a physical device this must be a LAN address, not `localhost`.',
    ],
  },

  // ---------- Backend ----------
  {
    type: 'fastapi',
    label: 'FastAPI',
    category: 'backend',
    blurb: 'Python API',
    folder: 'backend',
    port: 8000,
    env: [],
    setup: [
      'Create a Python virtual environment and a `requirements.txt` with `fastapi` and `uvicorn[standard]`.',
      'Structure: `app/main.py` (app + middleware), `app/routers/` (one file per resource), `app/models/` (Pydantic schemas), `app/config.py` (settings loaded from environment via `pydantic-settings`).',
      'Expose a `GET /health` endpoint that returns `{"status": "ok"}`.',
      'Run locally with `uvicorn app.main:app --reload --port 8000`. Interactive docs are served at `/docs`.',
    ],
  },
  {
    type: 'express',
    label: 'Express',
    category: 'backend',
    blurb: 'Node.js API',
    folder: 'backend',
    port: 3001,
    env: ['PORT'],
    setup: [
      'Initialise a Node project with `express` and `dotenv`.',
      'Structure: `src/index.js` (server), `src/routes/` (one router per resource), `src/config.js` (environment).',
      'Parse JSON bodies with `express.json()` and add a central error-handling middleware.',
      'Expose a `GET /health` endpoint that returns `{"status": "ok"}`.',
    ],
  },
  {
    type: 'django',
    label: 'Django REST',
    category: 'backend',
    blurb: 'Python API with admin',
    folder: 'backend',
    port: 8000,
    env: ['DJANGO_SECRET_KEY', 'DJANGO_DEBUG'],
    setup: [
      'Create a virtual environment and install `django` and `djangorestframework`.',
      'Start a project plus one app per domain area; expose resources with DRF viewsets and routers.',
      'Load the secret key and debug flag from the environment.',
    ],
  },
  {
    type: 'nestjs',
    label: 'NestJS',
    category: 'backend',
    blurb: 'TypeScript API',
    folder: 'backend',
    port: 3001,
    env: ['PORT'],
    setup: [
      'Scaffold with `npx @nestjs/cli new backend`.',
      'Create one module per resource (controller + service). Load configuration with `@nestjs/config`.',
      'Expose a `GET /health` endpoint.',
    ],
  },

  // ---------- Database ----------
  {
    type: 'mongodb',
    label: 'MongoDB',
    category: 'database',
    blurb: 'Document database',
    port: 27017,
    env: ['MONGODB_URI', 'MONGODB_DB_NAME'],
    setup: [
      'For local development run MongoDB in Docker (`mongo:7`) or use a free MongoDB Atlas cluster.',
      'Connect using `MONGODB_URI`; the database name comes from `MONGODB_DB_NAME`.',
      'Define one collection per core entity and create indexes for any field used in lookups.',
    ],
  },
  {
    type: 'postgres',
    label: 'PostgreSQL',
    category: 'database',
    blurb: 'Relational database',
    port: 5432,
    env: ['DATABASE_URL'],
    setup: [
      'For local development run PostgreSQL in Docker (`postgres:16`).',
      'Connect using `DATABASE_URL`.',
      'Manage the schema with migrations from the start (e.g. Alembic, Prisma or Django migrations — whichever fits the backend).',
    ],
  },
  {
    type: 'mysql',
    label: 'MySQL',
    category: 'database',
    blurb: 'Relational database',
    port: 3306,
    env: ['DATABASE_URL'],
    setup: [
      'For local development run MySQL in Docker (`mysql:8`).',
      'Connect using `DATABASE_URL` and manage the schema with migrations.',
    ],
  },
  {
    type: 'sqlite',
    label: 'SQLite',
    category: 'database',
    blurb: 'File-based database',
    env: ['DATABASE_PATH'],
    setup: [
      'Store the database file at the path given by `DATABASE_PATH` and exclude it from version control.',
      'Suitable for a single-instance MVP; keep data access behind one module so it can be swapped later.',
    ],
  },
  {
    type: 'firestore',
    provider: 'gcp',
    label: 'Firebase Firestore',
    category: 'database',
    blurb: 'Hosted document database',
    env: ['FIREBASE_PROJECT_ID'],
    setup: [
      'Requires a Firebase project. Use the Firebase emulator for local development.',
      'Write security rules before any client reads or writes directly.',
    ],
  },
  {
    type: 'supabase',
    label: 'Supabase',
    category: 'database',
    blurb: 'Hosted Postgres + APIs',
    env: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    setup: [
      'Requires a Supabase project. Keep schema changes in SQL migration files.',
      'Enable row-level security on every table. The service-role key must only ever be used server-side.',
    ],
  },

  // ---------- Cache / Queue ----------
  {
    type: 'redis',
    label: 'Redis',
    category: 'cache',
    blurb: 'Cache & key-value store',
    port: 6379,
    env: ['REDIS_URL'],
    setup: [
      'For local development run Redis in Docker (`redis:7`).',
      'Connect using `REDIS_URL`. Set a TTL on every cached key.',
    ],
  },
  {
    type: 'rabbitmq',
    label: 'RabbitMQ',
    category: 'cache',
    blurb: 'Message queue',
    port: 5672,
    env: ['RABBITMQ_URL'],
    setup: [
      'For local development run RabbitMQ in Docker (`rabbitmq:3-management`).',
      'Connect using `RABBITMQ_URL`. Define named queues for each background job type.',
    ],
  },

  // ---------- Auth ----------
  {
    type: 'jwt',
    label: 'Custom JWT auth',
    category: 'auth',
    blurb: 'Email + password, self-hosted',
    env: ['JWT_SECRET', 'JWT_EXPIRES_IN'],
    setup: [
      'Implement register, login and "current user" endpoints.',
      'Hash passwords with bcrypt or argon2; never store or log plain-text passwords.',
      'Sign tokens with `JWT_SECRET` and protect private routes with an auth dependency/middleware.',
    ],
  },
  {
    type: 'auth0',
    label: 'Auth0',
    category: 'auth',
    blurb: 'Hosted login',
    env: ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_AUDIENCE'],
    setup: [
      'Requires an Auth0 tenant with an Application (for the client) and an API (for the backend audience).',
      'The client uses the Auth0 SDK for login; the backend validates the access token against the tenant JWKS.',
    ],
  },
  {
    type: 'clerk',
    label: 'Clerk',
    category: 'auth',
    blurb: 'Hosted login + user UI',
    env: ['CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
    setup: [
      'Requires a Clerk application. Use Clerk\'s prebuilt sign-in / sign-up components in the client.',
      'The backend verifies the session token using the secret key.',
    ],
  },
  {
    type: 'firebase-auth',
    provider: 'gcp',
    label: 'Firebase Auth',
    category: 'auth',
    blurb: 'Hosted login',
    env: ['FIREBASE_PROJECT_ID', 'FIREBASE_API_KEY'],
    setup: [
      'Requires a Firebase project with the chosen sign-in providers enabled.',
      'The client signs in with the Firebase SDK; the backend verifies ID tokens with the Firebase Admin SDK.',
    ],
  },

  // ---------- Storage ----------
  {
    type: 's3',
    provider: 'aws',
    label: 'AWS S3',
    category: 'storage',
    blurb: 'Object storage',
    env: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'S3_BUCKET'],
    setup: [
      'Requires an S3 bucket and an IAM user or role scoped to that bucket only.',
      'Upload via presigned URLs so files do not pass through the API server.',
    ],
  },
  {
    type: 'cloudinary',
    label: 'Cloudinary',
    category: 'storage',
    blurb: 'Image & video hosting',
    env: ['CLOUDINARY_URL'],
    setup: [
      'Requires a Cloudinary account. Sign upload requests server-side.',
    ],
  },

  // ---------- External services ----------
  {
    type: 'stripe',
    label: 'Stripe',
    category: 'service',
    blurb: 'Payments',
    env: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
    setup: [
      'Use Stripe Checkout (hosted page) rather than building a custom payment form.',
      'Add a webhook endpoint that verifies the signature and treats the webhook — not the browser redirect — as the source of truth for payment status.',
      'Use test-mode keys throughout development.',
    ],
  },
  {
    type: 'email',
    label: 'Email (SendGrid / Resend)',
    category: 'service',
    blurb: 'Transactional email',
    env: ['EMAIL_API_KEY', 'EMAIL_FROM_ADDRESS'],
    setup: [
      'Wrap sending in a single `send_email` function so the provider can be swapped.',
      'In development, log emails to the console instead of sending when no API key is set.',
    ],
  },
  {
    type: 'llm',
    label: 'LLM API (any provider)',
    category: 'ai',
    blurb: 'AI text generation',
    env: ['LLM_API_KEY'],
    setup: [
      'Call the provider only from the server; the API key must never reach the browser.',
      'Keep prompts in one module and set a request timeout and a maximum output length.',
    ],
  },

  // ---------- Hosting ----------
  {
    type: 'docker',
    label: 'Docker Compose',
    category: 'hosting',
    blurb: 'Run everything locally',
    env: [],
    setup: [
      'Add a `Dockerfile` for each connected component that has its own code folder.',
      'Add a root `docker-compose.yml` that starts every connected component with one `docker compose up`.',
      'Inside Compose, services reach each other by service name, not `localhost`.',
    ],
  },
  {
    type: 'vercel',
    label: 'Vercel',
    category: 'hosting',
    blurb: 'Frontend hosting',
    env: [],
    setup: [
      'Deploy from the Git repository; set the project root to the connected component\'s folder.',
      'Configure the production environment variables in the Vercel dashboard.',
    ],
  },
  {
    type: 'render',
    label: 'Render',
    category: 'hosting',
    blurb: 'App & database hosting',
    env: [],
    setup: [
      'Describe the services in a `render.yaml` blueprint so the deployment is reproducible.',
      'Configure production environment variables in the Render dashboard.',
    ],
  },
  {
    type: 'aws',
    provider: 'aws',
    label: 'AWS',
    category: 'hosting',
    blurb: 'Cloud hosting',
    env: [],
    setup: [
      'Choose the simplest managed option that fits (e.g. App Runner or ECS Fargate for containers). Confirm the choice with the user before provisioning anything.',
    ],
  },

  // ---------- Google Cloud ----------
  {
    type: 'gcp-cloud-run',
    provider: 'gcp',
    label: 'Cloud Run',
    category: 'hosting',
    blurb: 'Serverless containers',
    env: ['GCP_PROJECT_ID', 'GCP_REGION'],
    setup: [
      'Each connected component is deployed as its own Cloud Run service from a container image (add a `Dockerfile` per component).',
      'The container must listen on the port given by the `PORT` environment variable.',
      'Deploy with `gcloud run deploy`; set environment variables on the service and pull secrets from Secret Manager rather than baking them into the image.',
      'Services scale to zero, so nothing may rely on in-memory state between requests.',
    ],
  },
  {
    type: 'gcp-functions',
    provider: 'gcp',
    label: 'Cloud Functions',
    category: 'backend',
    blurb: 'Serverless functions',
    folder: 'functions',
    env: ['GCP_PROJECT_ID', 'GCP_REGION'],
    setup: [
      'Use 2nd-gen Cloud Functions (Cloud Run functions). One function per endpoint or event handler.',
      'Develop locally with the Functions Framework so functions can be run and tested without deploying.',
      'Functions are stateless and may cold-start; create database / API clients outside the handler so they are reused.',
    ],
  },
  {
    type: 'gcp-app-engine',
    provider: 'gcp',
    label: 'App Engine',
    category: 'hosting',
    blurb: 'Managed app platform',
    env: ['GCP_PROJECT_ID'],
    setup: [
      'Use the App Engine standard environment with an `app.yaml` per connected component.',
      'Deploy with `gcloud app deploy`.',
    ],
  },
  {
    type: 'gcp-gke',
    provider: 'gcp',
    label: 'GKE',
    category: 'hosting',
    blurb: 'Managed Kubernetes',
    env: ['GCP_PROJECT_ID', 'GCP_REGION'],
    setup: [
      'Use a GKE Autopilot cluster. Keep Kubernetes manifests in a `k8s/` folder (Deployment + Service per component).',
      'Kubernetes is heavy for an MVP — confirm with the user that Cloud Run would not be sufficient before provisioning a cluster.',
    ],
  },
  {
    type: 'gcp-firebase-hosting',
    provider: 'gcp',
    label: 'Firebase Hosting',
    category: 'hosting',
    blurb: 'Static site hosting + CDN',
    env: ['FIREBASE_PROJECT_ID'],
    setup: [
      "Add a `firebase.json` that serves the connected frontend's build output, with a rewrite of all routes to `index.html` for single-page apps.",
      'Deploy with `firebase deploy --only hosting`.',
    ],
  },
  {
    type: 'gcp-cloud-build',
    provider: 'gcp',
    label: 'Cloud Build',
    category: 'cicd',
    blurb: 'CI / CD pipeline',
    files: ['cloudbuild.yaml'],
    env: ['GCP_PROJECT_ID'],
    setup: [
      'Add a `cloudbuild.yaml` that builds, tests and deploys the connected components on push to the main branch.',
      'Push container images to Artifact Registry.',
    ],
  },
  {
    type: 'gcp-cloud-sql',
    provider: 'gcp',
    label: 'Cloud SQL (Postgres)',
    category: 'database',
    blurb: 'Managed relational database',
    port: 5432,
    env: ['DATABASE_URL', 'CLOUD_SQL_CONNECTION_NAME'],
    setup: [
      'For local development run plain PostgreSQL in Docker (`postgres:16`); use Cloud SQL only in deployed environments.',
      'From Cloud Run / Functions, connect through the built-in Cloud SQL connection (unix socket) or the Cloud SQL connector library — do not open the instance to public IPs.',
      'Manage the schema with migrations from the start.',
    ],
  },
  {
    type: 'gcp-bigquery',
    provider: 'gcp',
    label: 'BigQuery',
    category: 'database',
    blurb: 'Analytics data warehouse',
    env: ['GCP_PROJECT_ID', 'BIGQUERY_DATASET'],
    setup: [
      "Use BigQuery for analytics and reporting queries only — it is not a transactional database for the app's live data.",
      'Always select specific columns and filter on the partition column to keep query cost down.',
    ],
  },
  {
    type: 'gcp-storage',
    provider: 'gcp',
    label: 'Cloud Storage',
    category: 'storage',
    blurb: 'Object storage',
    env: ['GCP_PROJECT_ID', 'GCS_BUCKET'],
    setup: [
      'Requires a bucket with uniform bucket-level access and a service account scoped to that bucket.',
      'Upload and download via signed URLs so files do not pass through the API server.',
    ],
  },
  {
    type: 'gcp-pubsub',
    provider: 'gcp',
    label: 'Pub/Sub',
    category: 'cache',
    blurb: 'Messaging & events',
    env: ['GCP_PROJECT_ID', 'PUBSUB_TOPIC'],
    setup: [
      'Define one topic per event type and one subscription per consumer.',
      'Delivery is at-least-once: message handlers must be idempotent.',
      'Use the Pub/Sub emulator for local development.',
    ],
  },
  {
    type: 'gcp-tasks',
    provider: 'gcp',
    label: 'Cloud Tasks / Scheduler',
    category: 'cache',
    blurb: 'Background & scheduled jobs',
    env: ['GCP_PROJECT_ID', 'GCP_REGION'],
    setup: [
      'Use Cloud Tasks for deferred background work and Cloud Scheduler for cron-style jobs; both call an HTTP endpoint on the backend.',
      "Those endpoints must verify the request's OIDC token so they cannot be triggered publicly.",
    ],
  },
  {
    type: 'gcp-memorystore',
    provider: 'gcp',
    label: 'Memorystore (Redis)',
    category: 'cache',
    blurb: 'Managed Redis',
    port: 6379,
    env: ['REDIS_URL'],
    setup: [
      'For local development run plain Redis in Docker (`redis:7`).',
      'Memorystore is only reachable inside the VPC: serverless services need Direct VPC egress or a VPC connector to reach it.',
    ],
  },
  {
    type: 'gcp-vertex',
    provider: 'gcp',
    label: 'Vertex AI',
    category: 'ai',
    blurb: 'Hosted AI models',
    env: ['GCP_PROJECT_ID', 'GCP_REGION'],
    setup: [
      'Call Vertex AI only from the server, authenticating with the service account (no API keys in the client).',
      'Keep prompts in one module and set a request timeout and a maximum output length.',
    ],
  },
  {
    type: 'gcp-secret-manager',
    provider: 'gcp',
    label: 'Secret Manager',
    category: 'service',
    blurb: 'Secrets storage',
    env: ['GCP_PROJECT_ID'],
    setup: [
      'Store every production secret here and expose them to the connected components as environment variables at deploy time.',
      'Local development keeps using a `.env` file; the code should not need to know which is in use.',
    ],
  },

  // ---------- AWS ----------
  {
    type: 'aws-lambda',
    provider: 'aws',
    label: 'Lambda',
    category: 'backend',
    blurb: 'Serverless functions',
    folder: 'functions',
    env: ['AWS_REGION'],
    setup: [
      'One function per endpoint or event handler, exposed over HTTP with API Gateway or a function URL.',
      'Functions are stateless and may cold-start; create database / API clients outside the handler so they are reused.',
    ],
  },
  {
    type: 'aws-rds',
    provider: 'aws',
    label: 'RDS (Postgres)',
    category: 'database',
    blurb: 'Managed relational database',
    port: 5432,
    env: ['DATABASE_URL'],
    setup: [
      'For local development run plain PostgreSQL in Docker (`postgres:16`); use RDS only in deployed environments.',
      'Keep the instance in a private subnet and manage the schema with migrations.',
    ],
  },
  {
    type: 'aws-dynamodb',
    provider: 'aws',
    label: 'DynamoDB',
    category: 'database',
    blurb: 'Serverless key-value database',
    env: ['AWS_REGION', 'DYNAMODB_TABLE'],
    setup: [
      'Design the table around the queries the MVP needs (partition key + sort key) before writing any code.',
      'Use on-demand capacity and DynamoDB Local for development.',
    ],
  },
  {
    type: 'aws-sqs',
    provider: 'aws',
    label: 'SQS',
    category: 'cache',
    blurb: 'Message queue',
    env: ['AWS_REGION', 'SQS_QUEUE_URL'],
    setup: [
      'One queue per background job type, each with a dead-letter queue.',
      'Delivery is at-least-once: message handlers must be idempotent.',
    ],
  },
  {
    type: 'aws-cognito',
    provider: 'aws',
    label: 'Cognito',
    category: 'auth',
    blurb: 'Hosted login',
    env: ['COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID', 'AWS_REGION'],
    setup: [
      'Requires a Cognito user pool and app client.',
      'The client signs in with the hosted UI or Amplify Auth; the backend validates tokens against the user pool JWKS.',
    ],
  },

  {
    type: 'aws-bedrock',
    provider: 'aws',
    label: 'Bedrock',
    category: 'ai',
    blurb: 'Hosted AI models',
    env: ['AWS_REGION', 'BEDROCK_MODEL_ID'],
    setup: [
      'Call Bedrock only from the server, authenticating with the IAM role (no keys in the client). Model access must be enabled in the AWS account first.',
      'Keep prompts in one module and set a request timeout and a maximum output length.',
    ],
  },

  // ---------- Azure ----------
  {
    type: 'azure-container-apps',
    provider: 'azure',
    label: 'Container Apps',
    category: 'hosting',
    blurb: 'Serverless containers',
    env: ['AZURE_SUBSCRIPTION_ID', 'AZURE_RESOURCE_GROUP'],
    setup: [
      'Each connected component is deployed as its own container app from a container image (add a `Dockerfile` per component).',
      'Deploy with `az containerapp up`. Store secrets as Container Apps secrets or Key Vault references, not in the image.',
      'Apps can scale to zero, so nothing may rely on in-memory state between requests.',
    ],
  },
  {
    type: 'azure-app-service',
    provider: 'azure',
    label: 'App Service',
    category: 'hosting',
    blurb: 'Managed web app hosting',
    env: ['AZURE_SUBSCRIPTION_ID', 'AZURE_RESOURCE_GROUP'],
    setup: [
      'Deploy each connected component as a Web App on a Linux App Service plan (`az webapp up`).',
      'Configure environment variables as App Settings.',
    ],
  },
  {
    type: 'azure-static-web-apps',
    provider: 'azure',
    label: 'Static Web Apps',
    category: 'hosting',
    blurb: 'Static site hosting + CDN',
    env: [],
    files: ['staticwebapp.config.json'],
    setup: [
      "Serves the connected frontend's build output. Add a `staticwebapp.config.json` with a navigation fallback to `index.html` for single-page apps.",
      'Deployment runs from the repository through the generated CI workflow.',
    ],
  },
  {
    type: 'azure-aks',
    provider: 'azure',
    label: 'AKS',
    category: 'hosting',
    blurb: 'Managed Kubernetes',
    env: ['AZURE_SUBSCRIPTION_ID', 'AZURE_RESOURCE_GROUP'],
    setup: [
      'Keep Kubernetes manifests in a `k8s/` folder (Deployment + Service per component).',
      'Kubernetes is heavy for an MVP — confirm with the user that Container Apps would not be sufficient before provisioning a cluster.',
    ],
  },
  {
    type: 'azure-functions',
    provider: 'azure',
    label: 'Azure Functions',
    category: 'backend',
    blurb: 'Serverless functions',
    folder: 'functions',
    env: ['AZURE_SUBSCRIPTION_ID', 'AZURE_RESOURCE_GROUP'],
    setup: [
      'One function per endpoint or event handler. Develop and run locally with Azure Functions Core Tools.',
      'Functions are stateless and may cold-start; create database / API clients outside the handler so they are reused.',
    ],
  },
  {
    type: 'azure-sql',
    provider: 'azure',
    label: 'Azure SQL Database',
    category: 'database',
    blurb: 'Managed SQL Server',
    port: 1433,
    env: ['DATABASE_URL'],
    setup: [
      'Use the serverless tier for an MVP. Manage the schema with migrations from the start.',
      'Restrict the firewall to the app and developer IPs; do not allow all networks.',
    ],
  },
  {
    type: 'azure-postgres',
    provider: 'azure',
    label: 'Azure Database for PostgreSQL',
    category: 'database',
    blurb: 'Managed relational database',
    port: 5432,
    env: ['DATABASE_URL'],
    setup: [
      'For local development run plain PostgreSQL in Docker (`postgres:16`); use the Flexible Server only in deployed environments.',
      'Require TLS on connections and manage the schema with migrations.',
    ],
  },
  {
    type: 'azure-cosmos',
    provider: 'azure',
    label: 'Cosmos DB',
    category: 'database',
    blurb: 'Serverless document database',
    env: ['COSMOS_ENDPOINT', 'COSMOS_KEY', 'COSMOS_DATABASE'],
    setup: [
      'Use the NoSQL API in serverless capacity mode for an MVP.',
      'Choose each container\'s partition key from the queries the MVP needs before writing any code — it cannot be changed later.',
      'Use the Cosmos DB emulator for local development.',
    ],
  },
  {
    type: 'azure-blob',
    provider: 'azure',
    label: 'Blob Storage',
    category: 'storage',
    blurb: 'Object storage',
    env: ['AZURE_STORAGE_ACCOUNT', 'AZURE_STORAGE_CONTAINER'],
    setup: [
      'Requires a storage account and a private container.',
      'Upload and download via short-lived SAS URLs so files do not pass through the API server. Use Azurite for local development.',
    ],
  },
  {
    type: 'azure-service-bus',
    provider: 'azure',
    label: 'Service Bus',
    category: 'cache',
    blurb: 'Message queue & topics',
    env: ['SERVICE_BUS_CONNECTION_STRING'],
    setup: [
      'One queue per background job type, with dead-lettering enabled.',
      'Delivery is at-least-once: message handlers must be idempotent.',
    ],
  },
  {
    type: 'azure-redis',
    provider: 'azure',
    label: 'Azure Redis',
    category: 'cache',
    blurb: 'Managed Redis',
    port: 6380,
    env: ['REDIS_URL'],
    setup: [
      'For local development run plain Redis in Docker (`redis:7`).',
      'The managed service requires TLS; set a TTL on every cached key.',
    ],
  },
  {
    type: 'azure-entra',
    provider: 'azure',
    label: 'Microsoft Entra ID',
    category: 'auth',
    blurb: 'Microsoft sign-in',
    env: ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID'],
    setup: [
      'Requires an app registration (use Entra External ID if the users are customers rather than staff).',
      'The client signs in with MSAL; the backend validates access tokens against the tenant\'s signing keys and checks the audience.',
    ],
  },
  {
    type: 'azure-key-vault',
    provider: 'azure',
    label: 'Key Vault',
    category: 'service',
    blurb: 'Secrets storage',
    env: ['AZURE_KEY_VAULT_URL'],
    setup: [
      'Store every production secret here and expose them to the connected components at deploy time, accessed through a managed identity.',
      'Local development keeps using a `.env` file; the code should not need to know which is in use.',
    ],
  },
  {
    type: 'azure-openai',
    provider: 'azure',
    label: 'Azure OpenAI',
    category: 'ai',
    blurb: 'Hosted AI models',
    env: ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_DEPLOYMENT'],
    setup: [
      'Requires a model deployment in the Azure resource; the code refers to the deployment name, not the model name.',
      'Call it only from the server. Keep prompts in one module and set a request timeout and a maximum output length.',
    ],
  },
  {
    type: 'azure-repos',
    provider: 'azure',
    label: 'Azure Repos',
    category: 'repo',
    blurb: 'Git hosting (Azure DevOps)',
    env: [],
    setup: [
      'Single repository for the whole MVP (monorepo). Protect the main branch with a branch policy that requires a pull request.',
    ],
  },
  {
    type: 'azure-pipelines',
    provider: 'azure',
    label: 'Azure Pipelines',
    category: 'cicd',
    blurb: 'CI / CD pipeline (Azure DevOps)',
    env: [],
    files: ['azure-pipelines.yml'],
    setup: [
      'Add an `azure-pipelines.yml` that installs, lints, tests and builds each connected component on every push and pull request.',
      'Keep deploy credentials in a service connection or secret variables, never in the YAML.',
    ],
  },

  // ---------- Repositories & CI/CD ----------
  {
    type: 'github',
    label: 'GitHub',
    category: 'repo',
    blurb: 'Git hosting',
    env: [],
    setup: [
      'Single repository for the whole MVP (monorepo), with one top-level folder per component.',
      'Protect the main branch: changes land through pull requests.',
      'Commit a `.gitignore` before the first push so dependencies, build output and `.env` files never enter history.',
    ],
  },
  {
    type: 'gitlab',
    label: 'GitLab',
    category: 'repo',
    blurb: 'Git hosting',
    env: [],
    setup: [
      'Single project for the whole MVP (monorepo), with one top-level folder per component.',
      'Protect the main branch: changes land through merge requests.',
      'Commit a `.gitignore` before the first push so dependencies, build output and `.env` files never enter history.',
    ],
  },
  {
    type: 'bitbucket',
    label: 'Bitbucket',
    category: 'repo',
    blurb: 'Git hosting',
    env: [],
    setup: [
      'Single repository for the whole MVP (monorepo), with one top-level folder per component.',
      'Restrict direct pushes to the main branch: changes land through pull requests.',
    ],
  },
  {
    type: 'github-actions',
    label: 'GitHub Actions',
    category: 'cicd',
    blurb: 'CI / CD pipeline',
    env: [],
    files: ['.github/workflows/'],
    setup: [
      'Add a workflow in `.github/workflows/ci.yml` that installs, lints, tests and builds each connected component on every push and pull request.',
      'Use path filters so a change to one component does not rebuild the others.',
      'Keep deploy credentials in repository secrets; prefer OIDC federation to long-lived cloud keys.',
    ],
  },
  {
    type: 'gitlab-ci',
    label: 'GitLab CI',
    category: 'cicd',
    blurb: 'CI / CD pipeline',
    env: [],
    files: ['.gitlab-ci.yml'],
    setup: [
      'Add a `.gitlab-ci.yml` with lint, test and build stages for each connected component, run on every push and merge request.',
      'Keep deploy credentials in masked, protected CI/CD variables.',
    ],
  },

  // ---------- AI coding tools ----------
  {
    type: 'claude-code',
    label: 'Claude Code',
    category: 'aidev',
    blurb: 'Agentic coding tool',
    env: [],
    files: ['CLAUDE.md'],
    setup: [
      'Create a `CLAUDE.md` at the repository root: what the project is, the folder layout, and the exact commands to install, run, test and lint each component.',
      'Record the conventions from this brief there (configuration via environment variables, where API calls live, naming) so every session follows them.',
      'Keep it short and factual; update it whenever a command or convention changes.',
    ],
  },
  {
    type: 'cursor',
    group: 'desktop',
    label: 'Cursor',
    category: 'aidev',
    blurb: 'AI code editor',
    env: [],
    files: ['.cursor/rules/'],
    setup: [
      'Add project rules under `.cursor/rules/`: what the project is, the folder layout, and the exact commands to install, run, test and lint each component.',
      'Record the conventions from this brief there so every session follows them.',
    ],
  },
  {
    type: 'copilot',
    label: 'GitHub Copilot',
    category: 'aidev',
    blurb: 'AI pair programmer',
    env: [],
    files: ['.github/copilot-instructions.md'],
    setup: [
      'Create `.github/copilot-instructions.md`: what the project is, the folder layout, and the exact commands to install, run, test and lint each component.',
      'Record the conventions from this brief there so suggestions follow them.',
    ],
  },
  {
    type: 'codex',
    label: 'Codex CLI',
    category: 'aidev',
    blurb: 'Agentic coding tool',
    env: [],
    files: ['AGENTS.md'],
    setup: [
      'Create an `AGENTS.md` at the repository root: what the project is, the folder layout, and the exact commands to install, run, test and lint each component.',
      'Record the conventions from this brief there so every session follows them.',
    ],
  },
  {
    type: 'gemini-cli',
    label: 'Gemini CLI',
    category: 'aidev',
    blurb: 'Agentic coding tool',
    env: [],
    files: ['GEMINI.md'],
    setup: [
      'Create a `GEMINI.md` at the repository root: what the project is, the folder layout, and the exact commands to install, run, test and lint each component.',
      'Record the conventions from this brief there so every session follows them.',
    ],
  },

  // ---------- AI desktop apps ----------
  {
    type: 'claude-desktop',
    group: 'desktop',
    label: 'Claude Desktop',
    category: 'aidev',
    blurb: 'Claude app for Mac / Windows',
    env: [],
    files: ['CLAUDE.md'],
    setup: [
      'This brief is handed to Claude in the desktop app, working on the project folder.',
      'Create a `CLAUDE.md` at the repository root: what the project is, the folder layout, and the exact commands to install, run, test and lint each component.',
      'Record the conventions from this brief there so every session follows them.',
    ],
  },
  {
    type: 'chatgpt-desktop',
    group: 'desktop',
    label: 'ChatGPT desktop',
    category: 'aidev',
    blurb: 'ChatGPT app for Mac / Windows',
    env: [],
    setup: [
      'This brief is pasted into ChatGPT as the starting context for the build.',
      'If the app is not working directly on the project files, give every change as complete files with their full path so they can be copied in without guesswork.',
    ],
  },
  {
    type: 'codex-app',
    group: 'desktop',
    label: 'Codex app',
    category: 'aidev',
    blurb: 'OpenAI coding agent app',
    env: [],
    files: ['AGENTS.md'],
    setup: [
      'Create an `AGENTS.md` at the repository root: what the project is, the folder layout, and the exact commands to install, run, test and lint each component.',
      'Record the conventions from this brief there so every session follows them.',
    ],
  },
  {
    type: 'windsurf',
    group: 'desktop',
    label: 'Windsurf',
    category: 'aidev',
    blurb: 'AI code editor',
    env: [],
    files: ['.windsurf/rules/'],
    setup: [
      'Add project rules under `.windsurf/rules/`: what the project is, the folder layout, and the exact commands to install, run, test and lint each component.',
      'Record the conventions from this brief there so every session follows them.',
    ],
  },
  {
    type: 'kiro',
    group: 'desktop',
    label: 'Kiro',
    category: 'aidev',
    blurb: 'Spec-driven AI editor',
    env: [],
    files: ['.kiro/steering/'],
    setup: [
      'Add steering files under `.kiro/steering/` covering the product, the folder layout and the tech stack from this brief.',
      'Turn the build order in this brief into the spec / task list the editor works through.',
    ],
  },
  {
    type: 'antigravity',
    group: 'desktop',
    label: 'Google Antigravity',
    category: 'aidev',
    blurb: 'Agentic AI editor',
    env: [],
    setup: [
      'Record what the project is, the folder layout, the run / test commands and the conventions from this brief in the editor\'s project rules (check its documentation for the current file location).',
    ],
  },

  // ---------- AI models & agent frameworks ----------
  {
    type: 'claude-api',
    label: 'Claude API',
    category: 'ai',
    blurb: 'Anthropic models',
    env: ['ANTHROPIC_API_KEY'],
    setup: [
      'Use the official Anthropic SDK for the backend language, and check the current model list in the Anthropic docs rather than assuming a model id.',
      'Call it only from the server; the API key must never reach the browser.',
      'Keep prompts in one module, set a maximum output length, and stream responses to the client where the UI shows generated text.',
    ],
  },
  {
    type: 'openai-api',
    label: 'OpenAI API',
    category: 'ai',
    blurb: 'OpenAI models',
    env: ['OPENAI_API_KEY'],
    setup: [
      'Use the official OpenAI SDK for the backend language, and check the current model list in the OpenAI docs rather than assuming a model id.',
      'Call it only from the server; the API key must never reach the browser.',
      'Keep prompts in one module and set a request timeout and a maximum output length.',
    ],
  },
  {
    type: 'ollama',
    label: 'Ollama',
    category: 'ai',
    blurb: 'Local open models',
    port: 11434,
    env: ['OLLAMA_HOST', 'OLLAMA_MODEL'],
    setup: [
      'Runs models locally; the README must say which model to pull (`ollama pull <model>`) before first run.',
      'Read the host and model name from the environment so a hosted model can be swapped in later.',
    ],
  },
  {
    type: 'claude-agent-sdk',
    label: 'Claude Agent SDK',
    category: 'ai',
    blurb: 'Agent framework',
    folder: 'agent',
    env: ['ANTHROPIC_API_KEY'],
    setup: [
      'Build the agent with the Claude Agent SDK (Python or TypeScript). Follow the current SDK documentation rather than relying on remembered APIs.',
      'Define explicitly: the system prompt, the tools the agent may use, and its permission mode. Allow only the tools the MVP needs.',
      'Log every tool call the agent makes, and cap turns / spend per run.',
    ],
  },
  {
    type: 'langgraph',
    label: 'LangChain / LangGraph',
    category: 'ai',
    blurb: 'Agent & chain framework',
    folder: 'agent',
    env: [],
    setup: [
      'Model the flow as an explicit graph of steps; keep each node a small, testable function.',
      'Follow the current library documentation — these APIs change often — and pin the versions used.',
      'The model provider is whichever model component this is connected to.',
    ],
  },
  {
    type: 'mcp-server',
    group: 'mcp',
    label: 'Build your own MCP server',
    category: 'ai',
    blurb: 'New server, part of the product',
    folder: 'mcp-server',
    env: [],
    setup: [
      'Build with an official Model Context Protocol SDK. Expose one tool per action, each with a clear description and a strict input schema.',
      'Use the stdio transport for a local server, or streamable HTTP with authentication for a remote one.',
      'Tools that change data must validate their inputs and say so in their description.',
    ],
  },

  // ---------- Analytics & tracking ----------
  {
    type: 'ga4',
    label: 'Google Analytics (GA4)',
    category: 'analytics',
    blurb: 'Web & app analytics',
    env: ['GA_MEASUREMENT_ID'],
    setup: [
      'Requires a GA4 property with a web data stream. Read the Measurement ID (`G-…`) from the environment; with no ID set (local development) tracking stays off.',
      'If this is connected to Google Tag Manager, do not add gtag.js to the app — GA4 is deployed as a Google tag inside the GTM container. Otherwise load gtag.js once in the app shell.',
      'In a single-page app, make sure a page view is recorded on every route change, and only once (check enhanced measurement before also sending `page_view` manually).',
      'Agree the event list before coding: snake_case names, GA4 recommended event names where one exists, and the parameters each event carries. Never send personal data (names, emails, phone numbers).',
      'If the site has visitors who must give consent, implement Consent Mode and do not record until consent is given.',
    ],
  },
  {
    type: 'gtm',
    label: 'Google Tag Manager',
    category: 'analytics',
    blurb: 'Tag management & dataLayer',
    env: ['GTM_CONTAINER_ID'],
    setup: [
      'Requires a GTM web container. Install the container snippet once in the app shell (script in `<head>`, noscript fallback after `<body>`), reading the container ID (`GTM-…`) from the environment.',
      'The app code only pushes events to `window.dataLayer` (an event name plus parameters). It must not load or call individual tracking tools directly — those are tags configured in GTM.',
      'Write a tracking plan in `docs/tracking.md`: every dataLayer event, when it fires, and its parameters. Implement exactly that list.',
      'In a single-page app, push a page-view event to the dataLayer on every route change.',
      'The tags, triggers and variables themselves are created in the GTM interface, not in code: list in the README exactly what the user needs to create and publish there.',
    ],
  },

  // ---------- Service identities ----------
  {
    type: 'service-account',
    label: 'Service account',
    category: 'identity',
    blurb: 'Non-human identity for a service',
    env: [],
    setup: [
      'A dedicated identity for the component(s) connected to it — never a personal user account and never shared with unrelated services.',
      'Grant only the permissions named in the connections of this brief. Do not use owner / admin roles.',
      'Prefer the platform attaching the identity to the workload over a downloaded key. If a key or secret is unavoidable, keep it in a secret store and out of the repository.',
    ],
  },
  {
    type: 'gcp-service-account',
    provider: 'gcp',
    label: 'Service account',
    category: 'identity',
    blurb: 'Identity for a GCP workload',
    env: ['GCP_SERVICE_ACCOUNT'],
    setup: [
      'Create a dedicated service account for the component(s) connected to it and attach it to the workload (e.g. the Cloud Run service) — do not use the default compute service account.',
      'Grant only the IAM roles needed for the resources it is connected to in this brief, at the narrowest scope available (the bucket, the database), not project-wide Editor / Owner.',
      'Do not create or download service account keys. For local development use `gcloud auth application-default login`; for CI use Workload Identity Federation.',
    ],
  },
  {
    type: 'aws-iam-role',
    provider: 'aws',
    label: 'IAM role',
    category: 'identity',
    blurb: 'Identity for an AWS workload',
    env: [],
    setup: [
      'Create a dedicated IAM role for the component(s) connected to it and attach it as the task / function / instance role.',
      'Its policy allows only the actions needed on the specific resources it is connected to in this brief — no wildcards on resources.',
      'Do not create long-lived access keys. For CI, assume the role through OIDC federation.',
    ],
  },
  {
    type: 'azure-managed-identity',
    provider: 'azure',
    label: 'Managed identity',
    category: 'identity',
    blurb: 'Identity for an Azure workload',
    env: ['AZURE_CLIENT_ID'],
    setup: [
      'Create a user-assigned managed identity for the component(s) connected to it and assign it to the workload.',
      'Grant it only the role assignments needed on the specific resources it is connected to in this brief.',
      "The code authenticates with `DefaultAzureCredential`, so no secret is stored; local development uses the developer's `az login`.",
    ],
  },

  // ---------- Extra boxes that wrap other components ----------
  {
    type: 'docker-container',
    tier: 3,
    label: 'Docker container',
    category: 'hosting',
    blurb: 'One image wrapping a component',
    env: [],
    setup: [
      'Add a `Dockerfile` (and `.dockerignore`) for the component placed inside this box.',
      'Use a small official base image, a multi-stage build where there is a build step, and run as a non-root user.',
      'All configuration comes from environment variables passed at run time — nothing is baked into the image.',
    ],
  },
  {
    type: 'kubernetes',
    label: 'Kubernetes cluster',
    category: 'hosting',
    blurb: 'Any Kubernetes cluster',
    env: [],
    setup: [
      'Keep Kubernetes manifests in a `k8s/` folder (Deployment + Service per component inside this box).',
      'Kubernetes is heavy for an MVP — confirm with the user that a simpler host would not be sufficient.',
    ],
  },
  {
    type: 'gcp-project',
    tier: 1,
    provider: 'gcp',
    label: 'Google Cloud project',
    category: 'hosting',
    blurb: 'Wraps everything on GCP',
    env: ['GCP_PROJECT_ID', 'GCP_REGION'],
    setup: [
      'Everything inside this box lives in one Google Cloud project and, unless stated otherwise, one region.',
      'Enable only the APIs the components inside need, and give each service its own least-privilege service account.',
    ],
  },
  {
    type: 'aws-account',
    tier: 1,
    provider: 'aws',
    label: 'AWS account',
    category: 'hosting',
    blurb: 'Wraps everything on AWS',
    env: ['AWS_REGION'],
    setup: [
      'Everything inside this box lives in one AWS account and, unless stated otherwise, one region.',
      'Give each service its own least-privilege IAM role; do not use root or long-lived user keys.',
    ],
  },
  {
    type: 'azure-resource-group',
    tier: 1,
    provider: 'azure',
    label: 'Azure resource group',
    category: 'hosting',
    blurb: 'Wraps everything on Azure',
    env: ['AZURE_SUBSCRIPTION_ID', 'AZURE_RESOURCE_GROUP'],
    setup: [
      'Everything inside this box lives in one resource group and, unless stated otherwise, one region.',
      'Use managed identities for access between the services inside it.',
    ],
  },
  {
    type: 'group',
    container: true,
    label: 'Group / boundary',
    category: 'other',
    blurb: 'Any box: environment, network, team',
    env: [],
    setup: [],
  },

  // ---------- MCP servers (used by the AI tools) ----------
  mcp('github', 'GitHub', 'Issues, PRs & repo access', 'Used by the AI tool to read issues, open pull requests and check CI results in the project repository.'),
  mcp('gitlab', 'GitLab', 'Issues, MRs & repo access', 'Used by the AI tool to read issues, open merge requests and check pipeline results in the project repository.'),
  mcp('playwright', 'Playwright', 'Drive a real browser', 'Used by the AI tool to open the running app in a browser and verify each screen and flow actually works, not just that it compiles.'),
  mcp('context7', 'Context7', 'Up-to-date library docs', 'Used by the AI tool to look up current documentation for the libraries in this brief instead of relying on remembered APIs.'),
  mcp('figma', 'Figma', 'Read designs', 'Used by the AI tool to read the designs the frontend should match. Ask the user for the file link if it is not given in this brief.'),
  mcp('atlassian', 'Atlassian', 'Jira & Confluence', 'Used by the AI tool to read requirements from Confluence and to read / update Jira tickets for this work.'),
  mcp('linear', 'Linear', 'Issue tracking', 'Used by the AI tool to read and update the issues that describe this work.'),
  mcp('notion', 'Notion', 'Docs & specs', 'Used by the AI tool to read the specs and notes for this project.'),
  mcp('slack', 'Slack', 'Team messaging', 'Used by the AI tool to read relevant channel context and post progress updates. Ask before posting anywhere not named by the user.'),
  mcp('sentry', 'Sentry', 'Errors & traces', 'Used by the AI tool to read real errors from the running app when debugging.'),
  mcp('mongodb', 'MongoDB', 'Inspect the database', 'Used by the AI tool to inspect collections, schemas and indexes while building. Connect it read-only, and never to production data without the user saying so.'),
  mcp('postgres', 'PostgreSQL', 'Inspect the database', 'Used by the AI tool to inspect tables and run queries while building. Connect it read-only, and never to production data without the user saying so.'),
  mcp('supabase', 'Supabase', 'Manage the Supabase project', 'Used by the AI tool to inspect the schema and apply migrations. Scope it to the development project only.'),
  mcp('stripe', 'Stripe', 'Payments setup', 'Used by the AI tool to create and inspect products, prices and test payments. Use a test-mode key only.'),
  mcp('other', 'Other', 'Any MCP server not listed', 'Rename this component to the MCP server it stands for and describe in the notes what the AI tool should use it for.'),

  // ---------- Custom ----------
  {
    type: 'custom',
    label: 'Custom component',
    category: 'other',
    blurb: 'Anything not listed',
    env: [],
    setup: [],
  },
]

const BY_TYPE = Object.fromEntries(COMPONENTS.map((c) => [c.type, c]))
export const getDef = (type) => BY_TYPE[type] ?? BY_TYPE.custom

// Containers are drawn as boxes that other components can be placed inside.
// Every hosting component is one; others opt in with `container: true`.
export const isContainer = (type) => {
  const def = getDef(type)
  return def.container ?? def.category === 'hosting'
}

// Decides which of two overlapping boxes is the outer one: a lower tier wraps a higher
// one (1 cloud account, 2 host / platform, 3 single container). Boxes without a tier,
// or with equal tiers, are ordered by size instead.
export const tierOf = (type) => {
  const def = getDef(type)
  return def.tier ?? (def.category === 'hosting' ? 2 : undefined)
}

// How two categories relate when connected. Looked up as "a>b", then "b>a".
const PAIRS = {
  'frontend>backend': {
    label: 'HTTP / REST',
    text: (a, b) =>
      `${a} calls ${b} over HTTP (JSON). ${b} must enable CORS for the ${a} origin, and ${a} must read the API base URL from an environment variable.`,
  },
  'backend>database': {
    label: 'reads / writes',
    text: (a, b) =>
      `${a} reads and writes data in ${b}. Create one shared client / connection pool at startup and keep the connection string in an environment variable.`,
  },
  'backend>cache': {
    label: 'cache / queue',
    text: (a, b) =>
      `${a} uses ${b} for caching or background work. The app must still start and report a clear error if ${b} is unreachable.`,
  },
  'backend>auth': {
    label: 'verifies users',
    text: (a, b) =>
      `${a} uses ${b} to authenticate requests. Every non-public endpoint must reject requests without a valid token (HTTP 401).`,
  },
  'frontend>auth': {
    label: 'sign-in',
    text: (a, b) =>
      `${a} signs users in through ${b}, stores the session, and attaches the token to API requests. Add sign-in, sign-out and a protected-route guard.`,
  },
  'backend>storage': {
    label: 'file uploads',
    text: (a, b) =>
      `${a} stores files in ${b}, and saves only the file URL / key in the database.`,
  },
  'frontend>storage': {
    label: 'direct uploads',
    text: (a, b) =>
      `${a} uploads files directly to ${b} using a short-lived signed URL. Storage credentials must never be shipped to the client.`,
  },
  'backend>service': {
    label: 'API calls',
    text: (a, b) =>
      `${a} calls ${b} server-side. Keep the integration in one module and keep its keys in environment variables.`,
  },
  'frontend>service': {
    label: 'client SDK',
    text: (a, b) =>
      `${a} uses the ${b} client SDK. Only publishable / public keys may be used in the client.`,
  },
  'frontend>database': {
    label: 'direct access',
    text: (a, b) =>
      `${a} talks to ${b} directly from the client. This is only safe if ${b} enforces access rules itself (e.g. security rules / row-level security) — set those up first.`,
  },
  'backend>ai': {
    label: 'model calls',
    text: (a, b) =>
      `${a} calls ${b} server-side. Keep prompts and model settings in one module, keep credentials in environment variables, and handle timeouts and rate limits.`,
  },
  'frontend>ai': {
    label: 'AI requests',
    text: (a, b) =>
      `${a} uses ${b}, but must not call it directly with a secret key — route the requests through a server-side endpoint.`,
  },
  'ai>ai': {
    label: 'uses',
    text: (a, b) => `${a} uses ${b} as its model or tool provider.`,
  },
  'ai>database': {
    label: 'reads / writes',
    text: (a, b) => `${a} stores or retrieves data in ${b} (e.g. memory, documents or embeddings).`,
  },
  'ai>service': {
    label: 'tool calls',
    text: (a, b) => `${a} calls ${b} as a tool. Validate everything the model passes in before acting on it.`,
  },
  'frontend>analytics': {
    label: 'tracks events',
    text: (a, b) =>
      `${a} sends page views and user events through ${b}. Keep every tracking call in one small module so components never reference the tracking tool directly.`,
  },
  'backend>analytics': {
    label: 'server events',
    text: (a, b) =>
      `${a} sends server-side events to ${b} (for GA4, the Measurement Protocol) for things the browser cannot see reliably, such as completed payments. Never include personal data.`,
  },
  'analytics>analytics': {
    label: 'tag setup',
    text: (a, b) =>
      `${a} and ${b} work together: the tag manager container loads and configures the analytics tag, so the app talks only to the dataLayer and never to the analytics tool directly.`,
  },
  'analytics>database': {
    label: 'exports to',
    text: (a, b) =>
      `${a} exports its raw event data to ${b} (for GA4, the BigQuery export link) for reporting. This is set up in the analytics product's admin settings, not in code.`,
  },
  'backend>backend': {
    label: 'service call',
    text: (a, b) => `${a} calls ${b} over HTTP. Document the endpoints ${a} depends on.`,
  },
}

// a, b: { name, category } in the direction the user drew the connection.
export function relate(a, b) {
  const pick = (cat) => (a.category === cat ? [a, b] : b.category === cat ? [b, a] : null)
  let m

  if ((m = pick('aidev'))) {
    const [tool, x] = m
    if (x.category === 'repo')
      return {
        label: 'works in',
        text: `${tool.name} works inside the ${x.name} repository. Commit its instruction file to the repository.`,
      }
    if (x.category === 'mcp')
      return {
        label: 'uses MCP',
        text: `${tool.name} connects to the ${x.name} server. Register it in the tool's MCP configuration (for example \`.mcp.json\` for Claude Code or \`.cursor/mcp.json\` for Cursor) and confirm its tools are available before relying on it.`,
      }
    return {
      label: 'builds',
      text: `${tool.name} is the AI coding tool used to build ${x.name}. Its instruction file must cover ${x.name}'s commands and conventions.`,
    }
  }
  if ((m = pick('identity'))) {
    const [id, x] = m
    // Things that hold data or expose an API are what the identity is given access to;
    // everything else is a workload that runs as the identity.
    if (['database', 'cache', 'storage', 'service', 'ai', 'auth', 'repo'].includes(x.category))
      return {
        label: 'has access to',
        text: `${id.name} is granted access to ${x.name} — only the permissions the MVP needs (read-only unless it must write). Nothing else may reach ${x.name} with broader rights.`,
      }
    return {
      label: 'runs as',
      text: `${x.name} runs as ${id.name} and authenticates to other services with that identity instead of stored keys or passwords.`,
    }
  }
  if ((m = pick('mcp'))) {
    const [server, x] = m
    if (x.category === 'ai')
      return {
        label: 'agent tools',
        text: `${x.name} uses the tools exposed by the ${server.name} server at runtime. Allow only the tools the MVP needs and validate what the model passes to them.`,
      }
    return {
      label: 'accesses',
      text: `The ${server.name} server gives the AI tools access to ${x.name}. Use least-privilege credentials, and development data only.`,
    }
  }
  if ((m = pick('cicd'))) {
    const [ci, x] = m
    if (x.category === 'repo')
      return { label: 'triggered by', text: `${ci.name} runs on every push and pull request in ${x.name}.` }
    if (x.category === 'hosting')
      return {
        label: 'deploys to',
        text: `${ci.name} deploys to ${x.name} after the checks pass on the main branch. Deploy credentials are stored as CI secrets.`,
      }
    return { label: 'builds & tests', text: `${ci.name} installs, lints, tests and builds ${x.name} on every push.` }
  }
  if ((m = pick('repo'))) {
    const [repo, x] = m
    if (x.category === 'hosting')
      return { label: 'deploys from', text: `${x.name} deploys from the ${repo.name} repository.` }
    return { label: 'source in', text: `The code for ${x.name} lives in the ${repo.name} repository.` }
  }
  if ((m = pick('hosting'))) {
    const [host, app] = m
    return { label: 'deployed on', text: `${app.name} is deployed / run on ${host.name}.` }
  }
  const fwd = PAIRS[`${a.category}>${b.category}`]
  if (fwd) return { label: fwd.label, text: fwd.text(a.name, b.name) }
  const rev = PAIRS[`${b.category}>${a.category}`]
  if (rev) return { label: rev.label, text: rev.text(b.name, a.name) }
  return { label: 'connects to', text: `${a.name} connects to ${b.name}.` }
}

// Returns the two providers when a connection spans different clouds, otherwise null.
export function crossCloud(typeA, typeB) {
  const a = getDef(typeA).provider
  const b = getDef(typeB).provider
  return a && b && a !== b ? [PROVIDERS[a], PROVIDERS[b]] : null
}

// Layout of the palette sidebar. A leaf lists either the vendor-neutral components of
// some categories (`cats`, optionally narrowed to one `group`) or everything belonging
// to one cloud (`provider`).
export const PALETTE_TREE = [
  { label: 'Frontend', cats: ['frontend'] },
  { label: 'API / Backend', cats: ['backend'] },
  {
    label: 'Data',
    children: [
      { label: 'Databases', cats: ['database'] },
      { label: 'Cache & queues', cats: ['cache'] },
      { label: 'File storage', cats: ['storage'] },
    ],
  },
  {
    label: 'Auth & identity',
    children: [
      { label: 'User sign-in', cats: ['auth'] },
      { label: 'Service identities', cats: ['identity'] },
    ],
  },
  { label: 'External services', cats: ['service'] },
  { label: 'Analytics & tracking', cats: ['analytics'] },
  {
    label: 'AI',
    children: [
      { label: 'Desktop apps', cats: ['aidev'], group: 'desktop' },
      { label: 'CLI & editor tools', cats: ['aidev'] },
      { label: 'MCP servers', cats: ['mcp', 'ai'], group: 'mcp' },
      { label: 'Models & agent frameworks', cats: ['ai'] },
    ],
  },
  {
    label: 'Repo & CI/CD',
    children: [
      { label: 'Repositories', cats: ['repo'] },
      { label: 'CI / CD', cats: ['cicd'] },
    ],
  },
  { label: 'Hosting & deploy', cats: ['hosting'] },
  {
    label: 'Cloud',
    children: Object.entries(PROVIDERS).map(([provider, p]) => ({
      label: `${p.name} (${p.label})`,
      provider,
    })),
  },
  { label: 'Custom', cats: ['other'] },
]
