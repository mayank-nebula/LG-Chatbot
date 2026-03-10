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
      - "--build-arg"
      - "NEXT_PUBLIC_COOKIE_YES_ID=${_NEXT_PUBLIC_COOKIE_YES_ID}"
      - "--build-arg"
      - "NEXT_PUBLIC_GTM_ID=${_NEXT_PUBLIC_GTM_ID}"
      - "-t"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksupplychain:$COMMIT_SHA"
      - "-t"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/next-app-repo/letstalksupplychain:latest"
      - "."
   
[Warning] One or more build-args [NEXT_PUBLIC_COOKIE_YES_ID NEXT_PUBLIC_FILLOUT_SSSC_FORM NEXT_PUBLIC_GTM_ID NEXT_PUBLIC_SITE_URL] were not consumed
