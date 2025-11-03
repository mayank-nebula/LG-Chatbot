SOW Front-end LTSC Website Revamp, Scope and Timelines – 

Architecture & Solution Design
• Design and implement headless architecture, decoupling the new React front-end from the WordPress backend.
WordPress will serve as the content management system (CMS), delivering content via its API.
• Architect the full solution on the client-provisioned Google Cloud Platform (GCP) project, leveraging services like Cloud
Run for hosting, Google Cloud Storage (GCS) for media, and Vertex AI for AI capabilities.
UI/UX Design
• Create a complete, modern, and mobile-responsive UI/UX design for the entire website, based on the provided
samples, and enhanced to align with Google/Gemini branding.
• Design high-fidelity mockups for all key components, including:
• The "G Search shows + Gemini" global search bar.
• The semantic, card-based search results page.
• The "Gemini Alpha" floating chatbot widget and its conversational interface.
• The interactive, tabbed "Episode content widget" (purple/pink container).
Front-End Development (React)
• Rebuild the entire website user interface as a Single Page Application (SPA) using React.js, completely replacing the
existing WordPress theme.
• Develop all front-end components specified in the UI/UX designs, ensuring they are interactive, performant, and fully
responsive across desktop and mobile devices.
• Implement client-side logic to consume data from WordPress and custom AI APIs, dynamically rendering content for
pages, posts, podcasts, and search results.
Back-End Development & WordPress Enhancement
• Configure the existing WordPress installation to function as a headless CMS, exposing all necessary content (posts,
pages, podcasts, transcripts, metadata) via a secure API (REST).
• Develop custom API endpoints or serverless functions on GCP to serve as an integration layer between the React
front-end, WordPress, and the Gemini AI. This layer will manage complex logic for semantic search and chatbot
conversations.
• Collaborate with the client on the migration of content storage to Google Cloud Storage (GCS), ensuring WordPress is
configured to serve media assets efficiently from the new location.
SEO (including AI search result optimization)
• Identify and cluster keywords around core supply chain topics — e.g., logistics innovation, supply chain podcast, 3PL
technology, sustainable logistics.
• Conduct technical audit covering broken links fixing, site speed, mobile optimization, structured data testing, canonical
tags, sitemap, robots.txt.
• Assess brand visibility within AI-powered search engines and current prompts evaluation to optimize content
accordingly.
• Audit current backlink sources to assess relevance within the logistics and manufacturing ecosystem.
• Coordinate with development for on-page SEO fixes (meta, schema, internal links, load speed).
Web Analytics
• Define KPIs such as lead qualification rate, podcast completion rate, time spent, downloads, CTA clicks etc.
• Identify key user journeys.
• Audit existing GA4 analytics setup.
• Validate GA4 property and web data stream.
• Validate data settings: time zone, data retention etc.
• Validate auto tracked events.
• Define / Validate custom events.
• Design event schema with parameters (e.g., episode title, duration, category).
• Implement tags via GTM with media player API or data layer integration.
• Configure conversion events via GTM (e.g., subscription, download) and analyze attribution paths to identify top traffic
sources.
• Build behavioral audiences in GA4 for remarketing or personalization.
• Build Looker Studio dashboards for stakeholder visibility and set up alerts for anomalies (e.g., reduced play rate).
• Suggest A/B tests for
• Enhanced user engagement.
• Improved subscription flows.
• Reduced landing pages drop offs.
Cloud Environment & Deployment
• Manage the development, staging, and production environments entirely within the provisioned GCP project.
• Deploy the React front-end using a suitable GCP service like Firebase Hosting or Cloud Run for optimal performance
and scalability.
• Deploy all custom backend services (API gateways, AI integration logic) as containerized applications on Cloud Run.
Testing & Quality Assurance
• Conduct rigorous testing at all stages of the project—including unit, integration, and end-to-end testing—to ensure the
front-end delivers a seamless user experience, all features interact correctly with the WordPress backend, and the
website is stable, responsive, and bug-free across devices and browsers.
• Conduct rigorous testing across all stages of the project, including unit, integration, and end-to-end testing.
• Perform comprehensive cross-browser and multi-device testing to ensure desired user experience on all platforms.
• Execute performance and load testing to optimize site speed and ensure the application can handle user traffic.
• Facilitate a formal User Acceptance Testing (UAT) phase with the client to validate that all requirements have been met
before launch.
Project Management & Handover
• Provide end-to-end project management using an Agile methodology, ensuring clear communication, regular progress
updates, and on-time delivery.
• Meet with Sarah and team after each sprint to review progress, gather feedback, and define goals for the next sprint.
• Deliver comprehensive project documentation, including architectural diagrams, API specifications, and deployment
guides.
• Record a training video and conduct 2–3 sessions with Sarah and her team on managing content within the new
headless setup; provide full WordPress access and documentation to enable them to independently manage future
content updates and uploads.
• Conduct training sessions for the client's team on managing content within the new headless setup.
Assumptions: To ensure smooth and timely project execution, our team will require the following access:
• WordPress Admin Access: Administrator-level credentials for the letstalksupplychain.com WordPress dashboard to
analyze content structure, configure APIs, and manage headless CMS settings.
• Hosting/Server Access (SiteGround): Access to the SiteGround hosting panel and potentially FTP/SSH to manage
files, configure the environment, and plan the transition away from the current setup.
• Google Cloud Platform (GCP) Access: Role-based IAM access to the provisioned GCP project for our developers
and architects. This must include permissions to enable and use services such as Cloud Run, Cloud Storage (GCS),
Vertex AI, Secret Manager, and Cloud Build.
• Domain & DNS Management Access: Access to the domain registrar or DNS management panel to configure DNS
records (e.g., A, CNAME) for pointing the domain to the new GCP-hosted application upon launch.
• Design Assets & Brand Guidelines: Access to the attached design sample, any existing brand style guides, logos,
color codes (for the purple/pink widget), and fonts to ensure design consistency.
• API Keys & Credentials: Access to or the ability to generate API keys for any third-party services, including Google
Programmable Search Engine if used as part of the search solution.
• Code Repository Access: Access to any existing code repositories if applicable. Otherwise, we will set up a new
repository (e.g., on GitHub) and will require the client to have an account for handover.
• Analytics & SEO Tools: Access to GA4 account, Google Search Console, or any other SEO/GEO tools to monitor
traffic and performance post-launch and ensure a smooth SEO transition.

Timelines for Website redesign, SEO & Web Analytics:
Phase #	Phase	Week #	Key Activities by Track	Key Milestones
1	Foundation & Design	1-2	UI/UX: Kickoff, detailed requirements gathering, stakeholder workshops.
Backend/WP: Begin analysis of WordPress content models & API structure.
SEO: Keyword Research & Evaluation, On-Page & technical SEO Evaluation
Web Analytics: Discovery & Requirements Gathering	Requirements & Architecture Sign-off
		3-4	UI/UX: Develop and finalize wireframes and high-fidelity mockups for all pages and components.
Backend/WP: Configure headless WordPress API. Develop scripts for content export.
Frontend: Set up the React project structure, component library, and routing.
SEO: Assessment of Generative Engine Optimization (AI SEO) and Backlink Profile
Web Analytics: GA4 Audit	UI/UX Design Approval

Audit Assessment Report
2	Parallel Development & Pipeline Build	5-6	Frontend: Build static pages and key UI components (Header, Footer, Global Search Bar UI). Connect to mock/placeholder APIs.
Backend/WP: Develop the primary API Gateway on Cloud Run to serve WordPress content to the frontend.	
		7-9	Frontend: Develop dynamic components: Search Results Page (UI), Episode Content Widget (tabs), and Chatbot Modal (UI).
Backend/WP: Finalize all API endpoints for content delivery. Assist with media migration to GCS.
SEO: Content Strategy Optimization & Implementation
Web Analytics: Custom Event Design & Tagging, Conversion Tracking	Core UI Components Built (Internal Demo)

Content Strategy Document for AI driven SEO
		10-11	Frontend: Integrate the Search Bar and Chatbot UI with the live Gemini API endpoints. Implement loading states and error handling.
Backend/WP: Stabilize API gateway, implement caching, and support integration testing.	
3	Integration, Testing & Refinement	12-13	All Tracks: Conduct full end-to-end integration testing. The entire user flow from search input to AI-powered result display is tested rigorously.
Frontend: Final UI polishing, animations, and responsive design fixes.
SEO: Reporting & QA
Web Analytics: Audience configuration in GA4, Reports and Recommendations	Feature Complete & Staging Environment Ready for UAT

Website Performance Dashboard (in Looker Studio)
		14-15	All Tracks: Support the client during the User Acceptance Testing (UAT) phase. Address and resolve all feedback and critical bugs.
Backend/WP: Prepare and execute production deployment scripts and checklists.
All Tracks: Finalize all technical documentation and prepare for handover.	UAT Sign-off & Ready for Production Launch
4	Deployment & Launch	Week 16+	All Tracks: Execute the production deployment plan. Perform DNS cutover and go-live. Conduct post-launch monitoring and provide hyper-care support for an agreed-upon period.	Successful Production Launch & Project Handover

