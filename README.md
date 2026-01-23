steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/app-repo/my-next-app:$COMMIT_SHA', '.']

  # Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'us-central1-docker.pkg.dev/$PROJECT_ID/app-repo/my-next-app:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'my-next-app'
      - '--image'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/app-repo/my-next-app:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--allow-unauthenticated'
      # Handling your 10 runtime variables
      - '--set-env-vars'
      - 'DB_URL=${_DB_URL},API_KEY=${_API_KEY},VAR3=${_VAR3},VAR4=${_VAR4},VAR5=${_VAR5},VAR6=${_VAR6},VAR7=${_VAR7},VAR8=${_VAR8},VAR9=${_VAR9},VAR10=${_VAR10}'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/app-repo/my-next-app:$COMMIT_SHA'
