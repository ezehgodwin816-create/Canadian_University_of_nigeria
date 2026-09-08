/**
 * Canadian University of Nigeria - Demo Data
 * All content is DEMO / PROPOSED and not official university information.
 * Replace with verified institutional data before production use.
 */

window.CUN_DATA = {
  university: {
    name: "Canadian University of Nigeria",
    shortName: "CUN",
    tagline: "Where Knowledge Meets Global Excellence",
    location: "Abuja, Nigeria",
    established: "Proposed / Demo",
    email: "info@cun.demo",
    phone: "+234 (0) XXX XXX XXXX (Demo)",
    address: "Abuja, Federal Capital Territory, Nigeria (Demo Address)",
    social: {
      facebook: "#",
      instagram: "#",
      twitter: "#",
      linkedin: "#",
      youtube: "#",
      tiktok: "#"
    }
  },

  stats: [
    { label: "Faculties", value: "6+", demo: true },
    { label: "Programmes", value: "40+", demo: true },
    { label: "Students", value: "5,000+", demo: true },
    { label: "International Reach", value: "20+", demo: true },
    { label: "Research Centres", value: "8", demo: true },
    { label: "Employability Focus", value: "High", demo: true }
  ],

  faculties: [
    { id: "fas", name: "Faculty of Arts & Social Sciences", code: "FASS", description: "Demo faculty focusing on humanities, social sciences and communication." },
    { id: "fms", name: "Faculty of Management Sciences", code: "FMS", description: "Demo faculty for business, accounting, finance and entrepreneurship." },
    { id: "fos", name: "Faculty of Science", code: "FOS", description: "Demo faculty for pure and applied sciences." },
    { id: "foe", name: "Faculty of Engineering", code: "FOE", description: "Demo faculty for engineering and technology programmes." },
    { id: "fol", name: "Faculty of Law", code: "FOL", description: "Demo faculty of law and legal studies." },
    { id: "fhs", name: "Faculty of Health Sciences", code: "FHS", description: "Demo faculty for health and medical-related programmes." }
  ],

  programmes: [
    {
      id: "bsc-cs",
      name: "B.Sc. Computer Science",
      faculty: "fos",
      department: "Computer Science",
      degree: "Bachelor of Science",
      duration: "4 years",
      mode: "Full-time",
      overview: "Demo programme. A comprehensive computer science degree covering algorithms, software engineering, AI foundations and systems. (Proposed / Sample Content)",
      requirements: "Five O'Level credits including Mathematics and English. UTME subjects: English, Mathematics, Physics and one science subject. (Demo requirements)",
      careers: "Software Developer, Data Analyst, Systems Engineer, IT Consultant (Demo career paths)",
      curriculum: ["Year 1: Foundations of Computing", "Year 2: Data Structures & Algorithms", "Year 3: Software Engineering & Databases", "Year 4: Capstone Project & Electives"]
    },
    {
      id: "bsc-ba",
      name: "B.Sc. Business Administration",
      faculty: "fms",
      department: "Business Administration",
      degree: "Bachelor of Science",
      duration: "4 years",
      mode: "Full-time",
      overview: "Demo programme. Develops leadership, strategy and operational skills for modern organisations. (Proposed / Sample Content)",
      requirements: "Five O'Level credits including English and Mathematics. (Demo requirements)",
      careers: "Business Analyst, Operations Manager, Entrepreneur, Management Consultant (Demo)",
      curriculum: ["Year 1: Introduction to Business", "Year 2: Marketing & Finance", "Year 3: Strategy & HR", "Year 4: Capstone & Internship"]
    },
    {
      id: "llb",
      name: "LL.B. Law",
      faculty: "fol",
      department: "Law",
      degree: "Bachelor of Laws",
      duration: "5 years",
      mode: "Full-time",
      overview: "Demo programme. Foundational legal education with Nigerian and comparative perspectives. (Proposed / Sample Content)",
      requirements: "Five O'Level credits including English and Literature. (Demo requirements)",
      careers: "Legal Practitioner, Corporate Counsel, Public Service, Academia (Demo)",
      curriculum: ["Year 1: Legal Methods", "Year 2: Constitutional & Criminal Law", "Year 3: Property & Commercial Law", "Year 4-5: Electives & Clinical Practice"]
    },
    {
      id: "bsc-acc",
      name: "B.Sc. Accounting",
      faculty: "fms",
      department: "Accounting",
      degree: "Bachelor of Science",
      duration: "4 years",
      mode: "Full-time",
      overview: "Demo programme preparing students for professional accounting careers. (Proposed / Sample Content)",
      requirements: "Five O'Level credits including English and Mathematics. (Demo)",
      careers: "Accountant, Auditor, Financial Analyst (Demo)",
      curriculum: ["Foundations of Accounting", "Financial Reporting", "Taxation & Audit", "Advanced Topics"]
    },
    {
      id: "bsc-eco",
      name: "B.Sc. Economics",
      faculty: "fas",
      department: "Economics",
      degree: "Bachelor of Science",
      duration: "4 years",
      mode: "Full-time",
      overview: "Demo programme in economic theory, policy and development. (Proposed / Sample Content)",
      requirements: "Five O'Level credits including English and Mathematics. (Demo)",
      careers: "Economist, Policy Analyst, Banking (Demo)",
      curriculum: ["Microeconomics", "Macroeconomics", "Econometrics", "Development Economics"]
    },
    {
      id: "bsc-nursing",
      name: "B.NSc. Nursing Science",
      faculty: "fhs",
      department: "Nursing",
      degree: "Bachelor of Nursing Science",
      duration: "5 years",
      mode: "Full-time",
      overview: "Demo programme in professional nursing practice. (Proposed / Sample Content — accreditation to be confirmed)",
      requirements: "Five O'Level credits including English, Biology, Chemistry, Physics/Mathematics. (Demo)",
      careers: "Registered Nurse, Clinical Specialist, Public Health Nurse (Demo)",
      curriculum: ["Foundations of Nursing", "Medical-Surgical Nursing", "Community Health", "Clinical Practice"]
    }
  ],

  news: [
    {
      id: "n1",
      title: "Welcome to the Proposed CUN Digital Campus Platform",
      excerpt: "This demo website showcases a modern university digital presence for Canadian University of Nigeria.",
      category: "Announcement",
      date: "2026-09-01",
      image: "assets/images/news-placeholder.jpg",
      content: "<p>This is <strong>demo content</strong> for the Canadian University of Nigeria website proposal. All news items are sample content and do not represent official university announcements.</p><p>The platform demonstrates news listing, detail pages, categories and related articles.</p>"
    },
    {
      id: "n2",
      title: "Sample: Orientation Week for New Students",
      excerpt: "A proposed orientation programme designed to welcome new students to campus life.",
      category: "Student Life",
      date: "2026-08-15",
      image: "assets/images/campus-life.jpg",
      content: "<p>Demo article describing a sample orientation week. Replace with verified institutional content.</p>"
    },
    {
      id: "n3",
      title: "Sample: Research Symposium Call for Papers",
      excerpt: "An illustrative call for papers for a proposed research symposium.",
      category: "Research",
      date: "2026-07-20",
      image: "assets/images/research.jpg",
      content: "<p>Demo research news. All details are placeholders pending official confirmation.</p>"
    }
  ],

  events: [
    {
      id: "e1",
      title: "Open Day (Demo)",
      date: "2026-10-15",
      time: "10:00 AM",
      location: "Main Campus, Abuja (Demo)",
      category: "Admissions",
      description: "Sample open day event. Prospective students and parents are invited to explore programmes and facilities. (Demo content)"
    },
    {
      id: "e2",
      title: "Career Fair 2026 (Sample)",
      date: "2026-11-05",
      time: "9:00 AM",
      location: "University Auditorium (Demo)",
      category: "Careers",
      description: "Demo career fair connecting students with employers. Details to be confirmed."
    },
    {
      id: "e3",
      title: "Founders' Lecture Series (Proposed)",
      date: "2026-09-28",
      time: "2:00 PM",
      location: "Lecture Theatre A (Demo)",
      category: "Academic",
      description: "Sample academic lecture series. Speakers and topics are placeholders."
    }
  ],

  faqs: [
    { q: "Is this the official Canadian University of Nigeria website?", a: "No. This is a demo/proposal website created to showcase a modern digital platform. Official information must be verified with the university." },
    { q: "How do I apply?", a: "Use the Apply page to experience the multi-step demo application form. In production this would connect to a real admissions system." },
    { q: "What are the demo login credentials?", a: "Student: student@cun.demo / student123 · Staff: staff@cun.demo / staff123 · Admin: admin@cun.demo / admin123" },
    { q: "Are the fees and programmes real?", a: "No. All programmes, fees, statistics and contact details are sample/demo content pending verification." },
    { q: "Does the portal save my data?", a: "In demo mode, data is stored in your browser's localStorage only. No server is used unless Supabase is configured." }
  ],

  testimonials: [
    { name: "Amina O.", role: "Sample Student", text: "Demo testimonial: The proposed digital campus experience is modern and easy to navigate." },
    { name: "Dr. Chukwuma E.", role: "Sample Faculty", text: "Demo testimonial: A strong foundation for academic and administrative workflows." },
    { name: "Ibrahim K.", role: "Sample Parent", text: "Demo testimonial: Clear admissions journey and transparent information architecture." }
  ],

  demoUsers: {
    "student@cun.demo": { password: "student123", role: "student", name: "Demo Student", id: "CUN/2024/0001", programme: "B.Sc. Computer Science", level: "200" },
    "staff@cun.demo": { password: "staff123", role: "staff", name: "Demo Staff", id: "STF-001", department: "Computer Science" },
    "admin@cun.demo": { password: "admin123", role: "admin", name: "Demo Admin", id: "ADM-001" }
  }
};
