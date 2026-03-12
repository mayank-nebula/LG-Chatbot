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






