add_action('rest_api_init', function () {

    /*
    -----------------------------
    1. PASSWORD VERIFICATION API
    -----------------------------
    */

    register_rest_route('site/v1', '/verify-media-password', [
        'methods'  => 'POST',
        'callback' => function ($request) {

            $entered_password = $request->get_param('password');

            $stored_password = get_field('media_kit_password', 'media_kit_settings');

            if (!$stored_password) {
                return new WP_Error(
                    'password_not_set',
                    'Media kit password not configured',
                    ['status' => 500]
                );
            }

            if ($entered_password === $stored_password) {
                return [
                    'authorized' => true
                ];
            }

            return new WP_Error(
                'invalid_password',
                'Incorrect password',
                ['status' => 403]
            );
        },

        'permission_callback' => '__return_true'
    ]);



    /*
    --------------------------------
    2. OPTIONS PAGE DATA ENDPOINT
    --------------------------------
    */

    register_rest_route('site/v1', '/options/(?P<slug>[a-zA-Z0-9_-]+)', [
        'methods'  => 'GET',

        'callback' => function ($data) {

            $slug    = $data['slug'];
            $post_id = str_replace('-', '_', $slug);

            $fields = get_fields($post_id);

            if (!$fields) {
                return new WP_Error(
                    'no_options_found',
                    'No options found for this slug',
                    ['status' => 404]
                );
            }

            /*
            Remove sensitive fields so they are never exposed
            */

            $sensitive_fields = [
                'media_kit_password'
            ];

            foreach ($sensitive_fields as $field) {
                unset($fields[$field]);
            }

            return $fields;
        },


        'permission_callback' => function ($request) {

            $protected_slugs = [
                'media-kit-settings'
            ];

            $slug = $request['slug'];

            if (in_array($slug, $protected_slugs)) {

                $api_key = $request->get_header('x-options-key');

                if ($api_key !== OPTIONS_API_KEY) {
                    return new WP_Error(
                        'forbidden',
                        'Invalid API key',
                        ['status' => 403]
                    );
                }
            }

            return true;
        }

    ]);

});













import { NextResponse } from "next/server";
import { emailSchema } from "@/lib/validators/email";

const ATTIO_API = "https://api.attio.com/v2";
const API_KEY = process.env.ATTIO_API_KEY!;
const OBJECT = process.env.ATTIO_OBJECT_SLUG || "people";

export async function POST(req: Request) {
  try {
    const json = await req.json();

    const { email } = emailSchema.parse(json);

    const response = await fetch(
      `${ATTIO_API}/objects/${OBJECT}/records/upsert`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            match_on: ["email_addresses"],
            values: {
              email_addresses: [
                {
                  email_address: email,
                },
              ],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Attio API error:", error);

      return NextResponse.json(
        { error: "Failed to sync with Attio" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}




















Hi [Name],

I hope you're doing well.

To complete the integration with Attio from our Next.js application, I’ll need a couple of details from your Attio workspace:

1. **Attio API Key** – This will allow our server to securely send data to Attio.
2. **Object Slug** – The specific object where the data should be stored (for example: `people`, `companies`, or any custom object slug you have created).

Once I have these details, I can configure the API integration and start sending the required data (currently just the email address) from the application to Attio.

Please let me know if you prefer to share the API key through a secure channel.

Thanks!

Best regards,
[Your Name]

















Hi Chris,

Thanks for sharing the follow-up questions. I’ve drafted responses based on the current implementation of the website and how the YouTube integration is set up. Could you please review them before sending, as there may be some details (especially organizational information) that you might be able to confirm or refine better.

---

### Describe your organization's work as it relates to YouTube

The organization produces and hosts podcast content that is streamed and published on its YouTube channel. The organization’s website serves as a podcast platform where users can browse and watch podcast episodes. The website integrates with YouTube to display videos from the organization’s YouTube channel, including live streams, upcoming live events, past live streams, playlists, and regular uploaded videos. Each episode page embeds the YouTube video along with additional information such as descriptions and related podcast content.

---

### Google representative email address

N/A – There is currently no direct Google representative associated with this project.

---

### Content Owner ID (if available)

N/A

---

# API Client Information

### Please list all your API Client(s)

The organization’s public podcast website which displays podcast episodes and YouTube livestream events from the organization’s YouTube channel.

---

### Is this a publicly or privately available API Client?

Publicly accessible.

---

### Where can we find each API Client(s)?

The API client is the organization’s public website where users can browse podcast episodes and watch embedded YouTube videos. No login is required to view video content.

---

### Does your API Client commercialize YouTube Data?

No. The website does not sell or monetize YouTube data. The YouTube API is used only to retrieve metadata for the organization’s own YouTube videos so they can be displayed on the website.

---

### Choose the option that best resembles your API Client's use case

Video streaming site/app.

---

### Specify all YouTube API Services used by this API Client

Data API
Embeds

---

### Select the primary audience for your API Client

Viewers

---

### Approximately how many users use your API Client?

Approximately 1,000 – 10,000 users.

---

### Explain how your API Client is used by your users

Users visit the website to browse and watch podcast episodes produced by the organization. The site uses the YouTube Data API to retrieve video metadata such as titles, thumbnails, playlist information, and livestream status from the organization’s YouTube channel.

The website displays multiple sections including:
• Currently live podcast streams
• Upcoming live streams where users can register to receive email notifications before the event starts
• Past live streams
• Regular uploaded podcast episodes
• Playlist-based collections of podcast content

All videos are played using the official YouTube embedded player (iframe).

---

### Does your API Client use multiple projects to access YouTube APIs?

No

---

### Does this API Client create, access or use any metrics derived from YouTube data?

No

---

### Does this API Client display data from, or provide features or services across multiple platforms?

No. The YouTube integration displays content from the organization’s YouTube channel only. The website may link to other platforms such as LinkedIn, but their data is not integrated alongside YouTube data.

---

### Do you create or provide any type of reports using YouTube API data?

No

---

### How long do you store YouTube API Data?

<24 hours

(The application temporarily caches YouTube API responses for performance purposes.)

---

### How often do you refresh YouTube API Data?

24 hours

(API responses may be refreshed more frequently through caching mechanisms, typically within approximately one hour.)

---

### Does this API Client allow users to authenticate with their Google credentials?

No

---

### Implementation / Documentation

The website uses the YouTube Data API to retrieve metadata about videos, livestreams, and playlists from the organization’s YouTube channel. This data is used to display podcast episodes and livestream events on the website. Video playback is handled entirely through the official YouTube embedded player (iframe), ensuring that the video content is streamed directly from YouTube.

If needed, we can also provide screenshots or a short screencast demonstrating how YouTube content is integrated and displayed on the website.

---

Please let me know if you would like me to adjust anything before submitting.

Thanks,
Mayank






