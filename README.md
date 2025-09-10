volume_init:
    image: alpine:3.20
    container_name: volume_init
    command: >
      sh -c "
      mkdir -p /mnt/staging-share/mongodb_data &&
      mkdir -p /mnt/staging-share/redis_data &&
      mkdir -p /mnt/staging-share/chromadb_data &&
      mkdir -p /mnt/staging-share/logs/daily_logs &&
      mkdir -p /mnt/staging-share/uploads &&
      chown -R 999:999 /mnt/staging-share/mongodb_data &&
      chown -R 999:999 /mnt/staging-share/redis_data &&
      chown -R 1001:1001 /mnt/staging-share/chromadb_data &&
      echo 'Volume initialization completed'
      "
    volumes:
      - /mnt/staging-share:/mnt/staging-share
    restart: "no"
    networks:
      - app-network
