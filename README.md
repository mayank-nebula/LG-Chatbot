While reviewing the YouTube integration, I noticed a difference between the previous implementation and the current approach, which explains the higher YouTube Data API quota usage.

In the earlier implementation, the system fetched the channel’s complete YouTube feed using the uploads playlist and then filtered the results in the application to identify previous live streams before rendering them. Since playlist-based requests cost only 1 quota unit per request, this approach kept the API usage relatively low.

However, that approach also had a limitation from a user experience perspective. Because it relied on fetching the general uploads feed and filtering afterward, cases could occur where the “Load More” functionality did not return any additional relevant results even though the user expected more live event content.

In the current implementation, the integration uses the search.list endpoint with parameters such as eventType=live and eventType=upcoming to directly retrieve relevant live event data. This helps ensure that the results being loaded are specifically related to live or upcoming events, providing a better and more consistent user experience.

However, the search.list endpoint costs 100 quota units per request, which leads to significantly higher quota consumption compared to the earlier playlist-based approach.

Due to this difference in API usage and the frequency of requests, the project is reaching the current daily quota limit.

Could you please help initiate a request to increase the YouTube Data API daily quota for this project so the integration can continue to function smoothly?
