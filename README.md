Hi Chris,

Thanks again for sharing the API access and object details.

I’ve started implementing the integration and wanted to confirm the flow before finalizing it.

Current planned flow on the website:

1. User enters the password to access the protected page.
2. User submits their email.
3. The backend queries the Attio People object using the submitted email.
4. If a matching person record exists, I use that Person record ID.
5. If no record exists, a new Person record is created with the email address.
6. A new record is then created in the custom **Doc View (mk_view)** object containing:

   * email
   * viewed_at timestamp
   * mk_url
   * page_id
   * password_ok
   * user_agent
   * ip
   * person (record reference)

This links the Doc View record to the corresponding Person record in Attio.

Before I finalize this, I just wanted to confirm a few things:

1. Are **email, viewed_at, mk_url, page_id, password_ok, and person** the only required attributes for the mk_view object, or are there others you would like us to populate as well (e.g., utm parameters, referer, etc.)?

2. Should company linking be left to Attio’s automatic domain matching, or would you prefer we explicitly set the company reference if available?

3. Do you want us to update any fields on the **People object** when a view occurs (for example `last_viewed_at` or `mk_view_url`), or should the tracking live only inside the mk_view records?

Everything else appears clear from the object configuration and the sample dataset.

Let me know if there’s anything you'd like structured differently.

Thanks,
Mayank
