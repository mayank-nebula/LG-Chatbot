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
      - '--image=us-central1-docker.pkg.dev/$PROJECT_ID/app-repo/my-next-app:$COMMIT_SHA'
      - '--region=us-central1'
      - '--allow-unauthenticated'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/app-repo/my-next-app:$COMMIT_SHA'
