Hi Soniya,

Please see below - can you let me know the updated questions you have with regards to this after his reply - I have looped in Alex given the increased scope of this conversation now. Thanks!
So I checked into Accessibe, and it looks like I had updated a card in the system but the charge was never put through placing the widget in a grace period. It has been resolved now and this should be active. I checked the settings and there was no option to do this. They have this statement sitting there which i believe would factor to this:

Leverage the ability to install accessWidget on non-production environments. - However this is not available on the platform or on any plans. And I have confirmed this with their support team.

For Termly, no wonder we are having trouble getting this sorted lol. We do not have a termly setup on this website. We use it for other clients which was why I was mistaken but I believe that either someone else or LTSC uses a different system for that altogether and that is an old out of date graveyard snippet. This should be removed unless someone else has it under their account. I also confirmed with our accounting and this is not on any SOW or invoice by us. 

LinkedIn feed is something that was also not implemented by us so in terms of widget licensing I can look into how much it costs and check back with you if you wanted to authorize the charge to LTSC?

That should sort out 1 of the 3. Just for information on this, we host the websites and have Accesibe implemented on LTSC. Occasionally, we go in to make edits in regards to hosting performance or something but our work is done pretty much on a request only basis. We do not actively manage this large list of plugins or integrations. 

The only premium plugin that I have under billing for LTSC is YouTube Videos and what is covered in our hosting stack: https://getxmedia.com/web-design/wordpress-web-hosting.

I have been mentioning for a while that someone needs to get this site cleaned up and the bloat removed. Last I heard there is someone working on it?

On Fri, Jan 9, 2026 at 10:51 PM Soniya Deshpande <Soniya.Deshpande1@evalueserve.com> wrote:
Hi Chris,
 
Thanks for mediating this situation.
 
Termly (Cookie Consent), accessiBe (Accessibility Widget), and LinkedIn Feed are all three tools that are currently returning errors that prevent them from appearing on the website.
 
To resolve this, we need a few configuration steps in service dashboards:
1. Termly (Cookie Consent)
The current script is returning a "410 Gone" error. This usually means the script ID is outdated or the configuration was deleted. Please note that because of this, the cookie banner is also currently not showing up on the live production site.
•	In Termly dashboard, please ensure a "Cookie Consent" banner is active for letstalksupplychain.com.
•	Please send us the latest "Embed Script" provided in the dashboard.
 
2. accessiBe (Accessibility Widget)
The widget is currently blocked with a message stating: "This website is not registered, or its license is expired."
•	Please verify that the subscription/license for letstalksupplychain.com is active.
•	To allow us to test the widget while we build the site, please try adding http://localhost:3000 to the "Authorized Domains" list in your accessiBe settings. If adding localhost is not possible, please let us know, and we will provide a deployed testing domain in the future for this purpose.
 
3. LinkedIn Feed (Elfsight Widget)
The LinkedIn feed is returning a technical error stating "WIDGET_DISABLED." This usually happens if the widget has been manually turned off in the dashboard or if the subscription plan has reached its limit. Please check on this and provide the latest script again.
 
Upon having this information, we will be able to finish the implementation.
 
Best,
Soniya Deshpande | Consultant, Data Analytics | Evalueserve, Raleigh NC
