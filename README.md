# MVP Stack Planner

Drag infrastructure components onto a canvas, connect and nest them, and download a
Markdown build brief to hand to an AI coding tool. It is a planner only — it does not
create any infrastructure. Plans are saved in the browser's local storage; there is no
backend.

## Run locally

```
npm install
npm run dev
```

## Where things live

- `src/catalog.js` — every component, its brief text, and how components relate. Add or edit building blocks here.
- `src/generateMarkdown.js` — the layout of the exported brief.
- `src/App.jsx` — the canvas, palette and inspector.

## Deploy (Cloud Build → Cloud Run)

`cloudbuild.yaml` builds the `Dockerfile` (Vite build served by nginx on port 8080),
pushes the image to Artifact Registry and deploys it to Cloud Run.

One-time setup in the Google Cloud project:

1. Enable the Cloud Build, Cloud Run and Artifact Registry APIs.
2. Create the Docker repository the image is pushed to (name and region must match
   `_AR_REPO` and `_REGION` in `cloudbuild.yaml`):
   ```
   gcloud artifacts repositories create mvp-stack-planner --repository-format=docker --location=australia-southeast1
   ```
3. Give the service account the build runs as these roles: Cloud Run Admin,
   Service Account User, Artifact Registry Writer and Logs Writer.
4. Create a Cloud Build trigger for the repository that uses `cloudbuild.yaml`.

To deploy by hand instead of through a trigger:

```
gcloud builds submit --config cloudbuild.yaml
```

The region, service name and repository name are substitutions at the top of
`cloudbuild.yaml`; change them there or override them on the trigger.
