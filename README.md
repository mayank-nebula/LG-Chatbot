steps:
  # Build the FastAPI (backend) image
  - name: 'gcr.io/cloud-builders/docker'
    id: Build backend image
    args:
      - build
      - --cache-from
      - us-central1-docker.pkg.dev/steam-genius-475213-t6/genaiapi-repo/genai-app:latest
      - -t
      - us-central1-docker.pkg.dev/steam-genius-475213-t6/genaiapi-repo/genai-app:latest
      - .

  # Push the image to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    id: Push backend image
    args:
      - push
      - us-central1-docker.pkg.dev/steam-genius-475213-t6/genaiapi-repo/genai-app:latest

  # Deploy the FastAPI service to Cloud Run, wiring env vars from Secret Manager
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk:latest'
    id: Deploy backend service
    entrypoint: gcloud
    args:
      - run
      - deploy
      - genai-app
      - --image
      - us-central1-docker.pkg.dev/steam-genius-475213-t6/genaiapi-repo/genai-app:latest
      - --region
      - us-central1
      - --platform
      - managed
      - --allow-unauthenticated
      - --service-account
      - service-acc-gcp@steam-genius-475213-t6.iam.gserviceaccount.com
      - --set-secrets
      - GOOGLE_API_KEY=backend-google-api-key:latest,ALLOYDB_INSTANCE_URI=backend-alloydb-instance-uri:latest,ALLOYDB_USER=backend-alloydb-user:latest,ALLOYDB_PASSWORD=backend-alloydb-password:latest,ALLOYDB_NAME=backend-alloydb-name:latest,VECTOR_SEARCH_INDEX_LOCATION=backend-vector-search-location:latest,VECTOR_SEARCH_INDEX_ENDPOINT_NAME=backend-vector-search-endpoint:latest,GCS_CLIENT_BUCKET_NAME=backend-gcs-client-bucket:latest,GCS_VECTOR_SEARCH_DATA_BUCKET_NAME=backend-gcs-vector-bucket:latest,WORDPRESS_COOKIE=wordpress_cookie:latest

images:
  - us-central1-docker.pkg.dev/steam-genius-475213-t6/genaiapi-repo/genai-app:latest

options:
  logging: CLOUD_LOGGING_ONLY














steps:
  # Build the container image
  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "build",
        "--build-arg",
        "NEXT_PUBLIC_FILLOUT_SUBSCRIBER_FORM=${_NEXT_PUBLIC_FILLOUT_SUBSCRIBER_FORM}",
        "--build-arg",
        "NEXT_PUBLIC_FILLOUT_WORK_WITH_US_FORM=${_NEXT_PUBLIC_FILLOUT_WORK_WITH_US_FORM}",
        "--build-arg",
        "NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID=${_NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID}",
        "-t",
        "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:$COMMIT_SHA",
        ".",
      ]

  # Push to Artifact Registry
  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "push",
        "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:$COMMIT_SHA",
      ]

  # Deploy to Cloud Run
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: gcloud
    args:
      - "run"
      - "deploy"
      - "letstalksuppychain"
      - "--image"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:$COMMIT_SHA"
      - "--region"
      - "us-central1"
      - "--allow-unauthenticated"
      - "--set-env-vars"
      - "PRIVATE_STREAM_URL=${_PRIVATE_STREAM_URL},YOUTUBE_API_KEY=${_YOUTUBE_API_KEY},YOUTUBE_CHANNEL_ID=${_YOUTUBE_CHANNEL_ID},SITE_URL=${_SITE_URL},WP_BASE=${_WP_BASE},DB_HOST=${_DB_HOST},DB_PORT=${_DB_PORT},DB_USER=${_DB_USER},DB_PASSWORD=${DB_PASSWORD},DB_NAME=${_DB_NAME}"

images:
  - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksuppychain:$COMMIT_SHA"





  
