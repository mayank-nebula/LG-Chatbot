steps:
  # Build the container image
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
      - "--cache-from"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:latest"
      - "-t"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:$COMMIT_SHA"
      - "-t"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:latest"
      - "."
      
  # Push to Artifact Registry
  - name: "gcr.io/cloud-builders/docker"
    id: Push frontend image
    args:
      - "push"
      - "--all-tags"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain"
      
  # Deploy to Cloud Run
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
      - "--set-env-vars"
      - "SITE_URL=${_SITE_URL},WP_BASE=${_WP_BASE},DB_HOST=${_DB_HOST},DB_PORT=${_DB_PORT},DB_USER=${_DB_USER},DB_NAME=${_DB_NAME},YOUTUBE_CHANNEL_ID=${_YOUTUBE_CHANNEL_ID}"
      - "--set-secrets"
      - "DB_PASSWORD=frontend-db-password:latest,YOUTUBE_API_KEY=frontend-youtube-api-key:latest,PRIVATE_STREAM_URL=frontend-private-stream-url:latest"
      
images:
  - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:$COMMIT_SHA"
  - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:latest"
  
options:
  logging: CLOUD_LOGGING_ONLY
