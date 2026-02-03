steps:
  # Step 1: Build the Docker image
  - name: "gcr.io/cloud-builders/docker"
    id: Build frontend image
    args:
      - "build"
      - "--build-arg"
      - "NEXT_PUBLIC_FILLOUT_SUBSCRIBER_FORM=${_NEXT_PUBLIC_FILLOUT_SUBSCRIBER_FORM}"
      - "--build-arg"
      - "NEXT_PUBLIC_FILLOUT_WORK_WITH_US_FORM=${_NEXT_PUBLIC_FILLOUT_WORK_WITH_US_FORM}"
      - "--build-arg"
      - "NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID=${_NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID}"
      - "-t"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:$COMMIT_SHA"
      - "-t"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:latest"
      - "."

  # Step 2: Push the image to Artifact Registry
  - name: "gcr.io/cloud-builders/docker"
    id: Push frontend image
    args:
      - "push"
      - "--all-tags"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain"

  # Step 3: Deploy to Cloud Run
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk:latest"
    id: Deploy frontend service
    entrypoint: gcloud
    args:
      - "run"
      - "deploy"
      - "letstalksuppychain"
      - "--image"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:$COMMIT_SHA"
      - "--region"
      - "us-central1"
      - "--platform"
      - "managed"
      - "--allow-unauthenticated"
      # Use the same service account as Cloud Build
      - "--service-account"
      - "service-acc-gcp@steam-genius-475213-t6.iam.gserviceaccount.com"
      # Environment variables
      - "--set-env-vars"
      - >
        SITE_URL=${_SITE_URL},
        WP_BASE=${_WP_BASE},
        DB_HOST=34.58.164.47,
        DB_PORT=${_DB_PORT},
        DB_USER=${_DB_USER},
        DB_NAME=${_DB_NAME},
        YOUTUBE_CHANNEL_ID=${_YOUTUBE_CHANNEL_ID},
        MAILCHIMP_FROM_EMAIL=${_MAILCHIMP_FROM_EMAIL}
      # Secrets (now all using :latest)
      - "--set-secrets"
      - >
        DB_PASSWORD=frontend-db-password:latest,
        YOUTUBE_API_KEY=frontend-youtube-api-key:latest,
        PRIVATE_STREAM_URL=frontend-private-stream-url:latest,
        MAILCHIMP_TRANSACTIONAL_API_KEY=mailchimp-transactional-api-key:latest

images:
  - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:$COMMIT_SHA"
  - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:latest"

options:
  logging: CLOUD_LOGGING_ONLY
