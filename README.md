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
      - "NEXT_PUBLIC_FILLOUT_SSSC_FORM=${_NEXT_PUBLIC_FILLOUT_SSSC_FORM}"
      - "--build-arg"
      - "NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID=${_NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID}"
      - "--build-arg"
      - "NEXT_PUBLIC_SITE_URL=${_NEXT_PUBLIC_SITE_URL}"
      - "-t"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksupplychain:$COMMIT_SHA"
      - "-t"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksupplychain:latest"
      - "."

  # Step 2: Deploy to Cloud Run with AlloyDB Auth Proxy sidecar
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk:latest"
    id: Deploy frontend service
    entrypoint: gcloud
    args:
      - "run"
      - "deploy"
      - "letstalksupplychain"
      - "--region"
      - "us-central1"
      - "--allow-unauthenticated"
      - "--service-account"
      - "service-acc-gcp@steam-genius-475213-t6.iam.gserviceaccount.com"
      
      # ✅ App container
      - "--container"
      - "letstalksupplychain"
      - "--image"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksupplychain:$COMMIT_SHA"
      # 👇 Ensures the proxy boots up before the Next.js app tries to connect to the DB
      - "--depends-on"
      - "alloydb-proxy" 
      - "--set-env-vars"
      - "SITE_URL=${_SITE_URL},WP_BASE=${_WP_BASE},DB_HOST=127.0.0.1,DB_PORT=5432,DB_USER=${_DB_USER},DB_NAME=${_DB_NAME},YOUTUBE_CHANNEL_ID=${_YOUTUBE_CHANNEL_ID},MAILCHIMP_FROM_EMAIL=${_MAILCHIMP_FROM_EMAIL}"
      - "--set-secrets"
      - "DB_PASSWORD=frontend-db-password:latest,YOUTUBE_API_KEY=frontend-youtube-api-key:latest,PRIVATE_STREAM_URL=frontend-private-stream-url:latest,MAILCHIMP_TRANSACTIONAL_API_KEY=mailchimp-transactional-api-key:latest"
      
      # ✅ Proxy sidecar
      - "--container"
      - "alloydb-proxy"
      - "--image"
      - "gcr.io/alloydb-connectors/alloydb-auth-proxy:latest"
      - "--args"
      - "projects/$PROJECT_ID/locations/us-central1/clusters/${_ALLOYDB_CLUSTER}/instances/${_ALLOYDB_INSTANCE}"

# Cloud Build will automatically push these images after Step 1 finishes
images:
  - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksupplychain:$COMMIT_SHA"
  - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksupplychain:latest"

options:
  logging: CLOUD_LOGGING_ONLY
