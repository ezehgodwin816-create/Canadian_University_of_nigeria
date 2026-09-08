/**
 * Canadian University of Nigeria — verified-first public data layer.
 * 
 * IMPORTANT:
 * - Facts below are limited to information that can be corroborated from
 *   CUN's current official website and public regulatory/news records.
 * - Do not add fees, staff names, phone numbers, social handles, rankings,
 *   programme accreditation or dates unless the institution publishes them.
 */
window.CUN_DATA = {
  university: {
    name: "Canadian University of Nigeria",
    shortName: "CUN",
    tagline: "Where Knowledge Meets Global Excellence",
    location: "Abuja, Federal Capital Territory, Nigeria",
    established: "2023",
    status: "Private university",
    regulatory: "National Universities Commission (NUC)",
    regulatoryStatus: "NUC provisional operating licence issued in 2023",
    proprietor: "Adamu Abubakar Gwarzo Foundation",
    supervisingInstitutionAtLicence: "Nile University, Abuja",
    address: "3C7G+2MR, Utako, Abuja 900108, Federal Capital Territory, Nigeria",
    email: "",
    phone: "",
    website: "https://www.cun.edu.ng/",
    social: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      youtube: "",
      tiktok: ""
    }
  },

  stats: [
    { label: "Founded", value: "2023" },
    { label: "Institution type", value: "Private University" },
    { label: "Location", value: "Abuja, FCT" },
    { label: "Regulator", value: "NUC" }
  ],

  faculties: [
    {
      id: "health",
      name: "Health Sciences",
      code: "HS",
      type: "School / academic area",
      description: "Publicly reported as one of CUN's initial academic areas.",
      programmes: ["Physiotherapy", "Public Health", "Medical Laboratory Science", "Nursing"]
    },
    {
      id: "computing",
      name: "School of Computing",
      code: "SC",
      type: "School",
      description: "Publicly reported as CUN's initial computing academic area.",
      programmes: ["Cyber Security", "Information Technology", "Data Science", "Computer Science"]
    },
    {
      id: "management-social",
      name: "Management & Social Sciences",
      code: "MSS",
      type: "Academic area",
      description: "Publicly reported as an initial management and social sciences academic area.",
      programmes: ["Banking & Finance", "Business Administration", "Human Resource Management", "Mass Communication"]
    }
  ],

  programmes: [
    {id:"physiotherapy",name:"Doctor of Physiotherapy",faculty:"health",department:"Health Sciences",degree:"Professional degree",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial Health Sciences programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Physiotherapy and rehabilitation practice",curriculum:[]},
    {id:"public-health",name:"Public Health",faculty:"health",department:"Health Sciences",degree:"Undergraduate programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial Health Sciences programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Public health, community health and health programmes",curriculum:[]},
    {id:"medical-laboratory",name:"Medical Laboratory Science",faculty:"health",department:"Health Sciences",degree:"Professional programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial Health Sciences programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Medical laboratory practice and diagnostics",curriculum:[]},
    {id:"nursing",name:"Nursing",faculty:"health",department:"Health Sciences",degree:"Professional programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial Health Sciences programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Nursing and clinical care",curriculum:[]},
    {id:"cyber-security",name:"Cyber Security",faculty:"computing",department:"School of Computing",degree:"Undergraduate programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial computing programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Cybersecurity, security operations and information assurance",curriculum:[]},
    {id:"information-technology",name:"Information Technology",faculty:"computing",department:"School of Computing",degree:"Undergraduate programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial computing programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"IT operations, systems and technology services",curriculum:[]},
    {id:"data-science",name:"Data Science",faculty:"computing",department:"School of Computing",degree:"Undergraduate programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial computing programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Data analysis, analytics and technology",curriculum:[]},
    {id:"computer-science",name:"Computer Science",faculty:"computing",department:"School of Computing",degree:"Undergraduate programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial computing programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Software, computing and technology",curriculum:[]},
    {id:"banking-finance",name:"Banking & Finance",faculty:"management-social",department:"Management & Social Sciences",degree:"Undergraduate programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial management and social sciences programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Banking, finance and financial services",curriculum:[]},
    {id:"business-admin",name:"Business Administration",faculty:"management-social",department:"Management & Social Sciences",degree:"Undergraduate programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial management and social sciences programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Business, management and entrepreneurship",curriculum:[]},
    {id:"human-resource",name:"Human Resource Management",faculty:"management-social",department:"Management & Social Sciences",degree:"Undergraduate programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial management and social sciences programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Human resources and organisational management",curriculum:[]},
    {id:"mass-communication",name:"Mass Communication",faculty:"management-social",department:"Management & Social Sciences",degree:"Undergraduate programme",duration:"",mode:"Full-time",overview:"Publicly reported among CUN's initial management and social sciences programmes.",requirements:"See the university's current admissions office for the official programme-specific requirements.",careers:"Media, communications and public relations",curriculum:[]}
  ],

  news: [],
  events: [],

  faqs: [
    {q:"Is Canadian University of Nigeria a recognised university?",a:"The National Universities Commission lists Canadian University of Nigeria, Abuja among Nigeria's private universities. The NUC announced the issuance of a provisional licence in 2023."},
    {q:"Where is the university located?",a:"Public official listings place the university in Utako, Abuja, Federal Capital Territory, Nigeria. The public Plus Code is 3C7G+2MR."},
    {q:"Where can I find official fees?",a:"Only fee schedules published or supplied by the university should be treated as official. This build intentionally does not invent fee figures where an official public schedule could not be verified."},
    {q:"Where can I find current admissions requirements?",a:"Use the admissions workflow on this site as the presentation layer, but verify programme-specific requirements against the university's current admissions office and official publications before publishing them as final."},
    {q:"Are rankings displayed?",a:"No unsupported ranking is presented as an official achievement. External ranking databases may show research-index or directory positions, but those should not be represented as official university rankings."}
  ],

  testimonials: []
};
