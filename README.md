# Canadian University of Nigeria — Premium Web Platform

This repository is the presentation and application layer for a high-end CUN web experience.

## Design direction
- Executive / institutional visual system
- Deep ink, warm metallic accent, editorial typography
- No demo banner, fake counters, fake testimonials or fake portal credentials
- Responsive navigation, accessible focus states, reduced-motion support
- Official CUN logo is referenced from the university's current public website

## Verified public facts used
1. CUN's official website identifies the institution as Canadian University of Nigeria, gives the Abuja location and says it is registered/authorised by the National Universities Commission.
2. NUC's 2023 announcement lists Canadian University of Nigeria, Abuja, FCT among the new private universities receiving provisional licences; the announcement names Adamu Abubakar Gwarzo Foundation as proprietor and Nile University, Abuja as the supervising institution at licensing.
3. Public reporting in November 2023 quoted the founder describing the initial academic offer as Health Sciences (Physiotherapy, Public Health, Medical Laboratory, Nursing), Computing (Cyber Security, Information Technology, Data Science, Computer Science), and Management/Social Sciences (Banking & Finance, Business Administration, Human Resource Management, Mass Communication).
4. A public institutional directory lists the address/Plus Code as 3C7G+2MR, Utako, Abuja 900108, FCT.

## Verification rule
Do not publish:
- tuition figures unless supplied by CUN in an official fee schedule;
- named Vice-Chancellor/Registrar/Bursar/Deans unless confirmed by an official CUN source;
- phone numbers or email addresses from third-party classifieds;
- social-media handles unless linked from the official university site;
- rankings as achievements unless the ranking publisher and methodology are clearly identified;
- programme accreditation claims unless supported by a current NUC programme record.

## Supabase
1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Put only the project URL and anon key in `js/config.js`.
4. Never put a service-role key in the browser.
5. Configure Auth email templates, SMTP, MFA for privileged staff, backups and domain restrictions.
6. Add a server-side payment verification endpoint for Paystack/Flutterwave before marking payments as successful.
7. Use signed URLs for private application documents.

## Payments
The data model supports provider references and server-verified payment states. The browser must never decide that a payment succeeded. Recommended production flow:
- create a payment intent server-side;
- initialise Paystack/Flutterwave using a public key;
- receive the provider webhook on a trusted server/Edge Function;
- verify the transaction with the provider API;
- write `payments.status='success'` only after verification;
- write an immutable audit event.

## Legal
`privacy.html`, `terms.html` and `cookies.html` are product templates, not legal advice. Before launch, obtain Nigerian legal/privacy counsel review, especially for NDPA compliance, retention, minors, admissions records, payment data, cookies/analytics, data-subject requests and cross-border processors.

## No additional project file is required for normal content updates
Keep future functionality inside this repository's existing structure. Extend the current JS/data/schema layers rather than creating disconnected mini-sites or demo implementations.
