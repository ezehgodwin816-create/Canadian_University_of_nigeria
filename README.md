# Canadian University of Nigeria — Complete Demo / Proposal Website

**This is a demo and proposal digital campus platform.**  
It is **not** the official website of Canadian University of Nigeria.  
All institutional content (programmes, fees, leadership, statistics, contacts, rankings, partnerships) is **sample / proposed / to-be-confirmed** unless replaced with verified data.

---

## Features

- Premium public website (responsive, accessible foundations)
- Academics: faculties, programmes, programme detail, research, library
- Admissions: multi-step online application, status tracking
- Student portal, Staff portal, Admin dashboard (demo auth + localStorage)
- News, events, gallery, FAQ, search, contact forms
- SEO basics (meta, robots.txt, sitemap.xml)
- GitHub Pages compatible (static HTML)
- Supabase-ready schema (`supabase/schema.sql`)
- Design system: deep navy + gold, clean typography, modern UX

---

## Demo Credentials

| Role    | Email              | Password   |
|---------|--------------------|------------|
| Student | student@cun.demo   | student123 |
| Staff   | staff@cun.demo     | staff123   |
| Admin   | admin@cun.demo     | admin123   |

Sessions and applications are stored in **browser localStorage** until Supabase is configured.

---

## How to Run Locally

1. Extract the ZIP.
2. Open `index.html` in a modern browser, **or**
3. Serve with any static server:

```bash
npx serve .
# or
python -m http.server 8080
```

---

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload all project files (or push via git).
3. Go to **Settings → Pages**.
4. Source: Deploy from branch `main` (or `master`), folder `/ (root)`.
5. Save. Site will be available at `https://<user>.github.io/<repo>/`.

`.nojekyll` is included so paths work without Jekyll processing.

---

## Supabase Setup (Optional)

1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql` in the SQL editor.
3. Enable Email auth (or preferred providers).
4. Configure **Row Level Security** policies for every table.
5. In `js/config.js` set:

```js
useSupabase: true,
supabaseUrl: "https://YOUR_PROJECT.supabase.co",
supabaseAnonKey: "YOUR_ANON_KEY"
```

**Never** put the service-role key in frontend code.

---

## Folder Structure

```
/
├── index.html, about.html, … (all public & portal pages)
├── css/          style.css, responsive.css, print.css
├── js/           data.js, config.js, auth.js, application.js, …
├── assets/       logo.svg, favicon.svg, images/
├── supabase/     schema.sql
├── robots.txt, sitemap.xml, .nojekyll
└── README.md
```

---

## Customising Content

- **University info & demo data:** `js/data.js`
- **Branding colours:** CSS variables in `css/style.css`
- **Logo / favicon:** `assets/logo.svg`, `assets/favicon.svg`
- **Images:** replace files in `assets/images/` (keep filenames or update HTML)
- **Programmes / news / events:** edit arrays in `js/data.js` or later connect to Supabase

---

## Production Checklist

- [ ] Replace all demo content with verified CUN information
- [ ] Official logo and brand guidelines
- [ ] Real contact details, addresses, phone numbers
- [ ] Confirmed programmes, fees, requirements, calendar
- [ ] Leadership and governance pages
- [ ] Accreditation and regulatory statements
- [ ] Supabase (or other backend) + RLS + real auth
- [ ] Payment gateway for application / fees
- [ ] Document upload storage (Supabase Storage or S3)
- [ ] Legal review of privacy, terms, accessibility statement
- [ ] Analytics and monitoring
- [ ] Performance and security audit

---

## Security Notes

- Demo authentication is **client-side only**.
- Production must enforce authentication and authorisation on the server.
- Sanitize all user input; prefer textContent over innerHTML where possible.
- Do not commit secrets.

---

## Licence / Disclaimer

This project is a **proposal and demonstration** for presentation purposes.  
It does not claim to represent official Canadian University of Nigeria content, branding, or systems until the institution adopts and populates it with verified data.

© 2026 — Demo / Proposal Website for Canadian University of Nigeria.
