import "server-only";

/**
 * Lazy environment access.
 * Nothing is read at import time.
 */
export const env = {
  // ─── PUBLIC (safe anywhere) ────────────────────────────────
  get PRIVATE_STREAM_URL() {
    return process.env.NEXT_PUBLIC_PRIVATE_STREAM_URL;
  },

  get FILLOUT_SUBSCRIBER_FORM() {
    return process.env.NEXT_PUBLIC_FILLOUT_SUBSCRIBER_FORM;
  },

  get FILLOUT_WORK_WITH_US_FORM() {
    return process.env.NEXT_PUBLIC_FILLOUT_WORK_WITH_US_FORM;
  },

  get ELFSIGHT_LINKEDIN_ID() {
    return process.env.NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID;
  },

  // ─── YOUTUBE ───────────────────────────────────────────────
  get YOUTUBE_API_KEY() {
    return process.env.YOUTUBE_API_KEY;
  },

  get YOUTUBE_CHANNEL_ID() {
    return process.env.YOUTUBE_CHANNEL_ID ?? "UCjjcxxsvx5sDR0F33ciy1QQ";
  },

  // ─── WORDPRESS ─────────────────────────────────────────────
  get WP_BASE() {
    return process.env.WP_BASE;
  },

  get SITE_URL() {
    return process.env.SITE_URL;
  },

  // ─── DATABASE ──────────────────────────────────────────────
  get DB_HOST() {
    return process.env.DB_HOST ?? "127.0.0.1";
  },

  get DB_PORT() {
    return Number(process.env.DB_PORT ?? 5432);
  },

  get DB_USER() {
    return process.env.DB_USER;
  },

  get DB_PASSWORD() {
    return process.env.DB_PASSWORD;
  },

  get DB_NAME() {
    return process.env.DB_NAME;
  },

  // ─── MAILCHIMP ─────────────────────────────────────────────
  get MAILCHIMP_FROM_EMAIL() {
    return process.env.MAILCHIMP_FROM_EMAIL;
  },

  get MAILCHIMP_TRANSACTIONAL_API_KEY() {
    return process.env.MAILCHIMP_TRANSACTIONAL_API_KEY;
  },
};
