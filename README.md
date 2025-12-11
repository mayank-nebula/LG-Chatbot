Hi Chris,

Yes we can provide you with a brief overview of the Redis decision.

Ideally, as we are in the API development phase already, it will be great if we have the decision about unpublished articles by early/mid next week.


Thanks,
Soniya Deshpande | Consultant, Data Analytics | Evalueserve, Raleigh NC


Confidential - Client Deliverable
From: Chris McGirr <chris@bconic.com> 
Sent: Wednesday, December 10, 2025 11:45 AM
To: Soniya Deshpande <Soniya.Deshpande1@evalueserve.com>
Cc: Sarah Barnes-Humphrey <sarah@letstalksupplychain.com>; Mayank Sharma (XT) <Mayank.Sharma9@evalueserve.com>; Ambar Awasthi <Ambar.Awasthi1@evalueserve.com>
Subject: Re: Recommendation on Caching Strategy and Clarification Needed on Unmapped Articles

CAUTION: This Email is from an EXTERNAL source. Ensure you trust this sender before clicking on any links or attachments.


Hi Soniya, 

I trust your team's due diligence on this architecture decision. Would you be able to provide a brief overview of the tech decision, so that it can be universally understood? (Keeping in mind there are varying levels of tech knowledge amongst the team)

Having a record of what decision what made, against which alternatives, and why, helps with maintainability of tech stack.

Regarding the unpublished pages, there may be a slight delay on this as one of the key stakeholders is travelling. Can you let me know what timeline you need this info by?

For the unpublished pages which are password protected, they should not be used in the training, as they are only for particular audiences.

Thanks,

Chris

On Wed, Dec 10, 2025, 9:15 p.m. Soniya Deshpande <Soniya.Deshpande1@evalueserve.com> wrote:
Hi Chris,
 
Redis offers significant performance benefits as an in-memory cache compared to relying solely on the database, it will help reduce load on the main dB. We can also leverage it for improved overall response times. 
 
We can walk you through the specific advantages and how it would fit into the architecture, happy to hop on a quick call if needed.
 
Meanwhile we’ll wait to hear back about the unpublished pages
 
 
Best,
Soniya Deshpande | Consultant, Data Analytics | Evalueserve, Raleigh NC
 

Confidential - Client Deliverable
From: Chris McGirr <chris@bconic.com> 
Sent: Wednesday, December 10, 2025 9:34 AM
To: Soniya Deshpande <Soniya.Deshpande1@evalueserve.com>
Cc: Sarah Barnes-Humphrey <sarah@letstalksupplychain.com>; Mayank Sharma (XT) <Mayank.Sharma9@evalueserve.com>; Ambar Awasthi <Ambar.Awasthi1@evalueserve.com>
Subject: Re: Recommendation on Caching Strategy and Clarification Needed on Unmapped Articles
 
CAUTION: This Email is from an EXTERNAL source. Ensure you trust this sender before clicking on any links or attachments.
 
 
Hi Soniya, 
 
Thanks for the update.
 
Regarding caching, it makes a lot of sense to implement something in between. I'm just not sure the advantage that Redis provides, vs a simple database - is that something that your team can shed some light on?
 
Let me check with the rest of the team on the unpublished pages. 
 
Chris
 
On Wed, Dec 10, 2025, 7:23 p.m. Soniya Deshpande <Soniya.Deshpande1@evalueserve.com> wrote:
Good morning Chris,
 
While working on API development, we encountered two important points that require further information:
 
1.	YouTube API Quota
We sometimes exceed (happened today also) the daily YouTube Data API v3 quota (10,000 units/day), which causes related features to stop working. After evaluating options, Redis caching is the more scalable and cost-efficient solution compared to requesting higher API quota.
 
Benefits of Redis caching:
a.      Reduces API calls drastically (from thousands/day to <100/day)
b.      Keeps us comfortably within the free quota
c.      Improves performance under high footfall
d.      Redis can also be reused to cache many other pages across the site, not just YouTube data
 
Increasing quota is not guaranteed (Needs Google Approval) and could lead to higher backend processing costs as traffic grows.
 
Therefore, I recommend proceeding with Redis caching (Will increase some cost).
 
2.	Unmapped Articles That Do Not Appear in Any Frontend Category
During the ingestion pipeline, we discovered many articles/pages that:
a.	Exist in the backend
b.	Are accessible via URLs like https://letstalksupplychain.com/{slug}
c.	But do not appear under any frontend categories, and we cannot determine where they belong
 
Questions:
a.      Do these articles need to be shown on the new platform?
b.      Are they legacy/unwanted pages that should be excluded?
c.      If they should be shown, which category or section should they belong to?
 
 
Clarifying this will allow us to finalize the API structure and ensure we only display relevant content.
 
Please let us know your thoughts on both the caching recommendation and how we should handle these unmapped articles.
 
 
Thanks,
Soniya Deshpande | Consultant, Data Analytics | Evalueserve, Raleigh NC
 
 
