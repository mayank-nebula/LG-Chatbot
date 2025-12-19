Hi Chris,

Thanks for the additional context.

This is in reference to the page on the website that displays the company’s LinkedIn posts. I initially raised the option of using LinkedIn app credentials, as an OAuth/API-based integration is typically the standard approach from an implementation standpoint.

After reviewing LinkedIn’s current API policies and usage guidelines in more detail, and reviewing the existing site setup, it’s clear that LinkedIn places very strict limitations on how their APIs can be used for public-facing content aggregation. Even approaches that authenticate via OAuth and embed post links (e.g., via iframes) can be interpreted as bypassing intended API constraints, depending on the implementation, and therefore carry compliance and longevity risk.

The site is currently displaying posts via Elfsight’s LinkedIn Feed widget, which abstracts LinkedIn API access behind a third-party service that is already operating within LinkedIn’s allowed patterns.

A few important implications of the current setup:

Rate limits, refresh frequency, and usage caps are controlled by Elfsight’s subscription plan, not by us.

We don’t have direct control over when those limits may be reached.

In return, this avoids the operational and compliance risk of managing LinkedIn API access directly for a public website use case.

Based on this, I’d like to confirm that we should continue with the existing Elfsight setup only for displaying LinkedIn posts on the site.

Once confirmed, I’ll proceed accordingly.

Thanks,
Mayank
