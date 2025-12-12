Thanks — yes, OAuth is the correct approach. My backend integration uses OAuth too, but I still need a few specific items from your LinkedIn developer app so I can authenticate and pull/embed the Company content.

Could you please provide the following:

Client ID (LinkedIn Developers → your app → Auth)

Client Secret (same place)

Organization (Company) ID (the numeric ID for the LinkedIn Page we’ll pull from)

Refresh token (this is generated once after someone completes the OAuth consent flow)

Quick notes and next steps:

Client ID / Client Secret: Found in the app’s Auth settings on the LinkedIn Developers site.

Organization ID: You can find this in the Company Page admin URL or Page settings — I can tell you exactly how if you want.

Refresh token: If one hasn’t been generated yet, I can provide the exact authorization link (and the redirect URI) that an admin can click to approve access. After they authorize, they’ll either share an authorization code with us or we can exchange it directly and return only the refresh token to store securely.
