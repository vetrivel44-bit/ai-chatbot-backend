import React, { useState, useEffect } from "react";

// ─── CATEGORY DEFINITIONS ─────────────────────────────────────────────────────
// Each category has: company pool, salary range, city pool, color, skill pool, description template

const CAT = {
  SOFT: {
    color: "#0052CC",
    companies: ["Infosys","TCS","Wipro","HCL Technologies","Accenture India","IBM India","Capgemini","Cognizant","Tech Mahindra","Google India","Microsoft India","Amazon India","Flipkart","Razorpay","Paytm","Zoho","Freshworks","Swiggy","Zomato","Ola","CRED","PhonePe","Byju's","Meesho","MakeMyTrip"],
    salary: { entry:[400000,700000], mid:[800000,1600000], senior:[1600000,3500000], currency:"₹" },
    cities: ["Bangalore","Hyderabad","Pune","Chennai","Mumbai","Noida","Gurgaon","Delhi"],
    desc: (t) => `Build and maintain scalable ${t} solutions. Work in an agile team, participate in code reviews, and ship high-quality software to production.`,
    resp: (t) => [`Write clean, maintainable, and efficient code for ${t} applications.`, `Collaborate with designers, product managers, and other engineers.`, `Participate in code reviews and architectural discussions.`, `Troubleshoot, debug, and upgrade existing software systems.`],
    skills: { default:["Problem Solving","Git","Agile/Scrum","Communication","SQL"], react:["React","JavaScript","TypeScript","Redux","CSS"], angular:["Angular","TypeScript","RxJS","HTML","CSS"], vue:["Vue.js","JavaScript","Vuex","HTML","CSS"], node:["Node.js","Express","MongoDB","REST API","JavaScript"], java:["Java","Spring Boot","Hibernate","SQL","Maven"], python:["Python","Django/FastAPI","SQL","REST APIs","Linux"], php:["PHP","Laravel","MySQL","HTML","JavaScript"], "c++":["C++","OOP","Data Structures","Linux","Algorithms"], "c#":["C#","ASP.NET","Entity Framework","SQL Server","Azure"], go:["Go","gRPC","Docker","Kubernetes","PostgreSQL"], kotlin:["Kotlin","Android SDK","Jetpack Compose","Firebase","REST APIs"], swift:["Swift","SwiftUI","Xcode","Core Data","REST APIs"], flutter:["Flutter","Dart","Firebase","REST APIs","Android/iOS"], android:["Java/Kotlin","Android SDK","Jetpack","SQLite","REST APIs"], ios:["Swift","Objective-C","Xcode","Core Data","UIKit"], rust:["Rust","Systems Programming","Concurrency","WebAssembly","CLI"], ruby:["Ruby","Rails","PostgreSQL","Redis","REST APIs"], laravel:["PHP","Laravel","MySQL","Blade","REST APIs"], django:["Python","Django","PostgreSQL","Celery","REST APIs"] },
  },
  AI: {
    color: "#7c3aed",
    companies: ["Google India","Microsoft India","Amazon India","IBM Research","Samsung R&D India","Intel India","Qualcomm India","Nvidia India","Flipkart","Ola","Freshworks","Mu Sigma","Fractal Analytics","Tiger Analytics","Manthan","Crayon Data","DataWeave","Sigmoid"],
    salary: { entry:[600000,1000000], mid:[1200000,2200000], senior:[2200000,5000000], currency:"₹" },
    cities: ["Bangalore","Hyderabad","Pune","Chennai","Gurgaon","Mumbai"],
    desc: (t) => `Develop and deploy ${t} systems at scale. Work with large datasets, design ML pipelines, and collaborate with product teams to drive AI-driven features.`,
    resp: (t) => [`Design, train, and deploy machine learning models.`, `Analyze large, complex datasets to extract actionable insights.`, `Build and optimize data pipelines and infrastructure.`, `Stay up-to-date with the latest AI/ML research and technologies.`],
    skills: { default:["Python","Statistics","SQL","Machine Learning","Data Visualization"], "machine learning":["Python","Scikit-learn","TensorFlow","PyTorch","Feature Engineering"], "deep learning":["PyTorch","TensorFlow","CNNs","RNNs","GPU Training"], "data scientist":["Python","SQL","Statistics","Tableau","Machine Learning"], "data analyst":["SQL","Python","Excel","Tableau/Power BI","Statistics"], "data engineer":["Spark","Airflow","Kafka","SQL","Python"], nlp:["Python","HuggingFace","Transformers","spaCy","NLP"], "computer vision":["OpenCV","PyTorch","CNN","YOLO","Image Processing"], mlops:["MLflow","Kubeflow","Docker","Kubernetes","CI/CD"], "ai researcher":["Python","Research Papers","PyTorch","Mathematics","NLP/CV"], "generative ai":["LLMs","LangChain","RAG","Prompt Engineering","Python"], llm:["LLMs","LangChain","RAG","Vector DBs","OpenAI API"], "prompt engineer":["Prompt Engineering","LLMs","Python","NLP","API Integration"] },
  },
  DEVOPS: {
    color: "#0891b2",
    companies: ["Amazon India","Google India","Microsoft India","Infosys","TCS","HCL","Wipro","Accenture","Rackspace India","Thoughtworks","Publicis Sapient","Deloitte India","Mindtree","Mphasis"],
    salary: { entry:[500000,900000], mid:[1000000,2000000], senior:[2000000,4000000], currency:"₹" },
    cities: ["Bangalore","Hyderabad","Pune","Chennai","Mumbai","Gurgaon"],
    desc: (t) => `Design, implement, and manage ${t} infrastructure. Automate deployment pipelines, ensure high availability, and improve system observability.`,
    resp: (t) => [`Automate deployment, scaling, and management of containerized applications.`, `Implement and maintain CI/CD pipelines.`, `Monitor system performance, troubleshoot issues, and ensure high availability.`, `Manage cloud infrastructure and ensure robust security practices.`],
    skills: { default:["Linux","Docker","CI/CD","Shell Scripting","Monitoring"], devops:["Docker","Kubernetes","Jenkins","Terraform","AWS"], "cloud engineer":["AWS/Azure/GCP","Terraform","Kubernetes","Networking","IAM"], sre:["SLOs","Incident Management","Kubernetes","Go/Python","Observability"], aws:["AWS","EC2","S3","Lambda","CloudFormation"], azure:["Azure","ARM Templates","Azure DevOps","AKS","Logic Apps"], "google cloud":["GCP","GKE","BigQuery","Cloud Run","Terraform"] },
  },
  ENGG: {
    color: "#b45309",
    companies: ["L&T","Tata Steel","Mahindra","BHEL","Siemens India","ABB India","Honeywell India","Bosch India","Reliance Industries","Adani Group","ONGC","NTPC","ISRO","DRDO","HAL","Indian Oil","Vedanta","JSW Steel"],
    salary: { entry:[300000,600000], mid:[700000,1400000], senior:[1400000,2800000], currency:"₹" },
    cities: ["Mumbai","Pune","Chennai","Bangalore","Hyderabad","Ahmedabad","Delhi","Kolkata"],
    desc: (t) => `Apply engineering principles to design, develop, and optimize ${t} systems. Work on large-scale projects in a dynamic manufacturing or infrastructure environment.`,
    resp: (t) => [`Design and develop engineering solutions for ${t} projects.`, `Perform calculations, simulations, and testing of materials and components.`, `Ensure compliance with safety regulations and industry standards.`, `Collaborate with cross-functional teams to oversee project execution.`],
    skills: { default:["AutoCAD","MS Project","Problem Solving","Technical Drawing","Teamwork"], mechanical:["AutoCAD","SolidWorks","CATIA","Thermodynamics","Manufacturing"], civil:["AutoCAD","STAAD Pro","Revit","Structural Analysis","Site Management"], electrical:["PLC","SCADA","Electrical Design","Power Systems","AutoCAD Electrical"], electronics:["PCB Design","Embedded C","VLSI","Signal Processing","MATLAB"], chemical:["Process Simulation","HAZOP","Piping","Safety Standards","Thermodynamics"], aerospace:["CATIA","ANSYS","CFD","Structural Analysis","Avionics"], automobile:["CAD","Vehicle Dynamics","Engine Design","Testing","Quality"] },
  },
  HEALTH: {
    color: "#0f766e",
    companies: ["Apollo Hospitals","Fortis Healthcare","Manipal Hospitals","Narayana Health","Max Healthcare","AIIMS","Medanta","Columbia Asia","Aster DM Healthcare","Rainbow Hospitals","Yashoda Hospitals","Sunshine Hospitals","Kovai Medical Center","Sir Ganga Ram Hospital"],
    salary: { entry:[250000,500000], mid:[600000,1200000], senior:[1500000,4000000], currency:"₹" },
    cities: ["Bangalore","Hyderabad","Chennai","Mumbai","Delhi","Pune","Kolkata","Kochi"],
    desc: (t) => `Provide quality healthcare as a ${t}. Work in a modern hospital setting with access to advanced medical equipment and an experienced multidisciplinary team.`,
    resp: (t) => [`Provide specialized care, diagnosis, and treatment plans as a ${t}.`, `Maintain accurate and detailed patient medical records.`, `Collaborate effectively with nursing staff and other medical professionals.`, `Adhere strictly to healthcare regulations, ethics, and safety protocols.`],
    skills: { default:["Patient Care","Clinical Knowledge","Communication","Medical Ethics","Teamwork"], doctor:["Clinical Diagnosis","Patient Management","Medical Records","Emergency Care","Prescription"], nurse:["Patient Care","IV Therapy","Wound Care","Vital Signs","Medical Documentation"], pharmacist:["Drug Dispensing","Clinical Pharmacy","Drug Interactions","Inventory","Patient Counseling"], physiotherapist:["Rehabilitation","Exercise Therapy","Manual Therapy","Patient Assessment","EMG"] },
  },
  EDU: {
    color: "#1e40af",
    companies: ["Delhi Public School","Kendriya Vidyalaya","Narayana Group","Allen Career Institute","Aakash Institute","Amity University","Manipal University","VIT","SRM University","Christ University","Presidency College","IIT (Faculty)","NIT (Faculty)","IIM (Faculty)"],
    salary: { entry:[250000,450000], mid:[500000,900000], senior:[900000,2000000], currency:"₹" },
    cities: ["Delhi","Bangalore","Hyderabad","Chennai","Mumbai","Kolkata","Pune","Ahmedabad"],
    desc: (t) => `Inspire and educate students as a ${t}. Design curriculum, deliver engaging lessons, and contribute to a vibrant academic community.`,
    resp: (t) => [`Develop engaging lesson plans and curriculum tailored to student needs.`, `Deliver lectures, evaluate student progress, and provide constructive feedback.`, `Maintain a positive, organized, and inclusive classroom environment.`, `Participate in academic research, faculty meetings, and institutional development.`],
    skills: { default:["Communication","Curriculum Design","Lesson Planning","Classroom Management","Assessment"], teacher:["Subject Expertise","Pedagogy","Classroom Management","Assessment","Communication"], professor:["Research","Publications","Curriculum Design","Mentorship","Academic Writing"] },
  },
  FINANCE: {
    color: "#064e3b",
    companies: ["HDFC Bank","ICICI Bank","SBI","Axis Bank","Kotak Mahindra","KPMG India","Deloitte India","PwC India","EY India","Grant Thornton","Bajaj Finance","Muthoot Finance","Tata Capital","L&T Finance","Mahindra Finance"],
    salary: { entry:[350000,650000], mid:[700000,1400000], senior:[1500000,3500000], currency:"₹" },
    cities: ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Pune","Kolkata","Gurgaon"],
    desc: (t) => `Join our finance team as a ${t}. Manage financial operations, prepare reports, and provide strategic insights to drive business decisions.`,
    resp: (t) => [`Analyze financial data, identify trends, and develop financial models.`, `Prepare accurate financial reports, budgets, and forecasts.`, `Ensure compliance with accounting standards and tax regulations.`, `Provide strategic recommendations to optimize costs and improve profitability.`],
    skills: { default:["Excel","Tally","Financial Reporting","MS Office","Communication"], accountant:["Tally","GST","TDS","Financial Statements","MS Excel"], "chartered accountant":["CA Qualification","Audit","Tax","Financial Analysis","ERP"], "financial analyst":["Excel","Financial Modelling","Valuation","Bloomberg","Python/R"], auditor:["Audit Standards","Risk Assessment","Financial Reporting","ERP","Communication"] },
  },
  MKTG: {
    color: "#be185d",
    companies: ["Hindustan Unilever","P&G India","ITC","Nestle India","Amazon India","Flipkart","Nykaa","Swiggy","Zomato","OYO","Urban Company","MakeMyTrip","Cars24","Meesho","Myntra"],
    salary: { entry:[300000,600000], mid:[700000,1400000], senior:[1500000,3000000], currency:"₹" },
    cities: ["Mumbai","Bangalore","Delhi","Gurgaon","Hyderabad","Chennai","Pune"],
    desc: (t) => `Drive growth as a ${t}. Develop and execute campaigns, analyse performance metrics, and build brand presence across digital and offline channels.`,
    resp: (t) => [`Develop and execute innovative marketing campaigns and strategies.`, `Analyze market trends, customer behavior, and campaign performance metrics.`, `Manage digital advertising budgets to maximize ROI.`, `Collaborate with sales and product teams to drive brand growth.`],
    skills: { default:["Google Analytics","Social Media","Communication","MS Excel","Creative Thinking"], seo:["SEO","Google Search Console","Ahrefs/SEMrush","Content Writing","Technical SEO"], sem:["Google Ads","Meta Ads","PPC","Campaign Management","Analytics"], "digital marketing":["Google Ads","Facebook Ads","SEO","Content","Analytics"], sales:["CRM","Negotiation","Client Handling","Target Achievement","Communication"], "business development":["Lead Generation","CRM","Networking","Proposals","Negotiation"] },
  },
  DESIGN: {
    color: "#9333ea",
    companies: ["Swiggy","Zomato","Flipkart","Ola","PhonePe","Razorpay","CRED","Byju's","Urban Company","Freshworks","Zoho","Mindtree","Thoughtworks","Infosys BPO","Mphasis"],
    salary: { entry:[350000,650000], mid:[700000,1400000], senior:[1500000,3000000], currency:"₹" },
    cities: ["Bangalore","Hyderabad","Pune","Mumbai","Chennai","Delhi"],
    desc: (t) => `Create beautiful and functional designs as a ${t}. Collaborate with product and engineering teams to deliver exceptional user experiences.`,
    resp: (t) => [`Create user-centered designs by understanding business requirements and user feedback.`, `Develop wireframes, high-fidelity mockups, and interactive prototypes.`, `Maintain and evolve design systems and UI component libraries.`, `Collaborate closely with developers to ensure accurate implementation of designs.`],
    skills: { default:["Figma","Adobe Creative Suite","Communication","Attention to Detail","Portfolio"], "ui/ux":["Figma","User Research","Wireframing","Prototyping","Design Systems"], graphic:["Adobe Illustrator","Photoshop","InDesign","Typography","Branding"], "motion":["After Effects","Premiere Pro","Animation","Motion Graphics","Storyboarding"] },
  },
  LEGAL: {
    color: "#374151",
    companies: ["Cyril Amarchand Mangaldas","AZB & Partners","Shardul Amarchand","Khaitan & Co","JSA Law","S&R Associates","Luthra & Luthra","Nishith Desai Associates","Trilegal","Samvad Partners","Tata Group Legal","Infosys Legal","HDFC Legal","Wipro Legal"],
    salary: { entry:[400000,700000], mid:[800000,1800000], senior:[2000000,5000000], currency:"₹" },
    cities: ["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata"],
    desc: (t) => `Practise law as a ${t}. Handle client matters, draft legal documents, conduct research, and represent clients in negotiations or proceedings.`,
    resp: (t) => [`Draft, review, and negotiate legal documents and commercial contracts.`, `Conduct comprehensive legal research to advise on compliance and risk.`, `Represent the organization or clients in legal proceedings and negotiations.`, `Ensure adherence to statutory laws and corporate governance standards.`],
    skills: { default:["Legal Research","Drafting","Communication","Analytical Thinking","Client Management"], lawyer:["Litigation","Legal Drafting","Case Research","Court Procedures","Client Advisory"], compliance:["Regulatory Compliance","Risk Management","Legal Research","Reporting","Policy Drafting"] },
  },
  LOGISTICS: {
    color: "#92400e",
    companies: ["Delhivery","Ekart","Blue Dart","DTDC","Shadowfax","XpressBees","Ecom Express","Amazon Logistics","Flipkart Logistics","Mahindra Logistics","Gati","TCI Express","Rivigo","Porter","Dunzo"],
    salary: { entry:[150000,280000], mid:[300000,600000], senior:[700000,1400000], currency:"₹" },
    cities: ["Bangalore","Hyderabad","Mumbai","Delhi","Chennai","Pune","Kolkata","Ahmedabad"],
    desc: (t) => `Manage logistics operations as a ${t}. Oversee deliveries, coordinate with teams, ensure timely fulfilment, and maintain quality standards.`,
    resp: (t) => [`Coordinate and monitor supply chain operations and field logistics.`, `Ensure timely and safe delivery of goods to final destinations.`, `Optimize routing and manage inventory tracking systems.`, `Address and resolve any customer issues regarding delivery delays or damages.`],
    skills: { default:["Route Management","Communication","MS Office","Time Management","Teamwork"], delivery:["GPS Navigation","Bike/Vehicle Driving","Customer Service","Physical Fitness","Smartphone"], warehouse:["Inventory Management","WMS","Physical Fitness","Attention to Detail","Forklift"] },
  },
  AVIATION: {
    color: "#0369a1",
    companies: ["Air India","IndiGo","SpiceJet","Vistara","Go First","Akasa Air","Blue Dart Aviation","Alliance Air","Airports Authority of India","DGCA","GMR Group","GVK Airport","Adani Airport Holdings"],
    salary: { entry:[350000,700000], mid:[800000,2000000], senior:[2500000,6000000], currency:"₹" },
    cities: ["Delhi","Mumbai","Bangalore","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad"],
    desc: (t) => `Build your aviation career as a ${t}. Work in a safety-first environment with a world-class team committed to operational excellence and passenger experience.`,
    resp: (t) => [`Ensure strict adherence to aviation safety and operational procedures.`, `Provide excellent service and manage passenger requirements effectively.`, `Perform pre-flight and post-flight checks and documentation.`, `Coordinate with ground staff and air traffic control to ensure smooth operations.`],
    skills: { default:["Safety Standards","Communication","Teamwork","Attention to Detail","DGCA Regulations"], pilot:["ATPL/CPL","Type Rating","CRM","Weather Analysis","Navigation"], "cabin crew":["Customer Service","Safety Procedures","First Aid","Communication","Grooming"] },
  },
  HOSP: {
    color: "#b45309",
    companies: ["Taj Hotels","Marriott India","Hyatt India","ITC Hotels","Oberoi Hotels","OYO","Lemon Tree Hotels","The Leela","Radisson India","Accor India","McDonald's India","Domino's Pizza","Zomato","Swiggy","Jubilant Foodworks"],
    salary: { entry:[180000,350000], mid:[400000,800000], senior:[900000,2000000], currency:"₹" },
    cities: ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Goa","Jaipur"],
    desc: (t) => `Deliver exceptional guest experiences as a ${t}. Work in a fast-paced hospitality environment where service excellence is the top priority.`,
    resp: (t) => [`Provide outstanding customer service to ensure guest satisfaction.`, `Manage day-to-day operations efficiently and resolve guest complaints promptly.`, `Maintain high standards of hygiene, safety, and operational quality.`, `Collaborate with team members to deliver a seamless hospitality experience.`],
    skills: { default:["Customer Service","Communication","Teamwork","Hospitality Standards","Attention to Detail"] },
  },
  MANUF: {
    color: "#6b7280",
    companies: ["Tata Steel","JSW Steel","BHEL","L&T","Mahindra","Bosch India","Siemens India","Maruti Suzuki","Hero MotoCorp","TVS Motor","Ashok Leyland","Bajaj Auto","Hindustan Zinc","Hindalco","UPL"],
    salary: { entry:[220000,400000], mid:[450000,900000], senior:[1000000,2000000], currency:"₹" },
    cities: ["Pune","Chennai","Mumbai","Bangalore","Ahmedabad","Kolkata","Hyderabad","Jamshedpur"],
    desc: (t) => `Ensure manufacturing excellence as a ${t}. Oversee production processes, maintain quality standards, and drive continuous improvement in a world-class facility.`,
    resp: (t) => [`Supervise production lines and ensure daily output targets are met.`, `Conduct rigorous quality control checks and enforce safety regulations.`, `Identify process bottlenecks and implement lean manufacturing techniques.`, `Maintain and calibrate heavy machinery and factory equipment.`],
    skills: { default:["Manufacturing Processes","Quality Control","MS Office","Safety Standards","Teamwork"] },
  },
  RETAIL: {
    color: "#047857",
    companies: ["Reliance Retail","D-Mart","Big Bazaar","Croma","Lifestyle","Shoppers Stop","H&M India","Zara India","Uniqlo India","Amazon India","Flipkart","Meesho","Nykaa","Myntra"],
    salary: { entry:[150000,280000], mid:[300000,600000], senior:[700000,1500000], currency:"₹" },
    cities: ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Pune","Kolkata","Ahmedabad"],
    desc: (t) => `Drive retail success as a ${t}. Manage store operations, ensure excellent customer service, and contribute to sales targets in a dynamic retail environment.`,
    resp: (t) => [`Assist customers, provide product recommendations, and process sales transactions.`, `Manage store inventory, merchandising, and visual displays.`, `Achieve daily and monthly sales targets to drive store profitability.`, `Resolve customer queries and ensure a smooth shopping experience.`],
    skills: { default:["Customer Service","POS Systems","Inventory Management","Sales","Communication"] },
  },
  GOVT: {
    color: "#1e3a5f",
    companies: ["Government of India","State Government","UPSC","SSC","RRB","IBPS","SBI","Bank of Baroda","ONGC","BHEL","NTPC","Indian Railways","Central Government","State Police"],
    salary: { entry:[250000,450000], mid:[500000,1000000], senior:[1000000,2500000], currency:"₹" },
    cities: ["Delhi","Mumbai","Bangalore","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad"],
    desc: (t) => `Serve the nation as a ${t}. Join the public sector and make a meaningful impact through policy implementation, administration, and public service.`,
    resp: (t) => [`Execute administrative duties and implement government policies efficiently.`, `Maintain transparency, accountability, and integrity in public service operations.`, `Address citizen grievances and ensure timely resolution of issues.`, `Collaborate with various departments to achieve organizational objectives.`],
    skills: { default:["General Knowledge","Communication","Analytical Thinking","MS Office","Leadership"] },
  },
  SCIENCE: {
    color: "#0e7490",
    companies: ["ISRO","DRDO","CSIR","BARC","IIT (Research)","IISc","ICMR","NCBS","Tata Institute","IITs","NITs","DBT India","DST India"],
    salary: { entry:[350000,600000], mid:[700000,1400000], senior:[1500000,3000000], currency:"₹" },
    cities: ["Bangalore","Hyderabad","Delhi","Mumbai","Pune","Chennai","Kolkata"],
    desc: (t) => `Push the boundaries of knowledge as a ${t}. Conduct research, publish findings, and collaborate with world-class scientists on high-impact projects.`,
    resp: (t) => [`Design and conduct rigorous scientific experiments and research studies.`, `Analyze complex data, interpret results, and publish findings in journals.`, `Secure research grants and manage laboratory equipment and inventory.`, `Collaborate with academic and industry partners on innovative R&D projects.`],
    skills: { default:["Research Methodology","MATLAB","Python","Technical Writing","Laboratory Skills"] },
  },
  TRADES: {
    color: "#78350f",
    companies: ["L&T Construction","Shapoorji Pallonji","TATA Projects","DLF","Godrej Properties","Brigade Group","Embassy Group","Prestige Group","NCC Limited","Patel Engineering","Local Contractors","Maintenance Companies"],
    salary: { entry:[150000,280000], mid:[300000,600000], senior:[650000,1200000], currency:"₹" },
    cities: ["Bangalore","Hyderabad","Mumbai","Delhi","Chennai","Pune","Kolkata","Ahmedabad"],
    desc: (t) => `Apply your skilled trade as a ${t}. Work on construction, maintenance, and installation projects with a safety-first approach.`,
    resp: (t) => [`Perform installation, maintenance, and repair work according to technical blueprints.`, `Strictly adhere to site safety regulations and quality standards.`, `Troubleshoot technical issues and perform preventive maintenance.`, `Work collaboratively with site supervisors and other tradespeople.`],
    skills: { default:["Safety Standards","Physical Fitness","Hand Tools","Problem Solving","Teamwork"] },
  },
  MEDIA: {
    color: "#b91c1c",
    companies: ["Times of India","NDTV","Hindustan Times","The Hindu","India Today","Republic TV","Zee Media","Economic Times","Mint","Business Standard","Forbes India","Condé Nast India","HT Digital","The Quint","The Wire"],
    salary: { entry:[250000,450000], mid:[500000,1000000], senior:[1200000,2500000], currency:"₹" },
    cities: ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Noida"],
    desc: (t) => `Tell compelling stories as a ${t}. Research, write, and produce content that informs, engages, and inspires audiences across platforms.`,
    resp: (t) => [`Research, write, and edit high-quality content for various media platforms.`, `Conduct interviews and gather factual information to produce engaging stories.`, `Collaborate with editors, designers, and producers to finalize media pieces.`, `Stay updated on current events and emerging trends to pitch relevant topics.`],
    skills: { default:["Writing","Research","Communication","MS Office","Storytelling"], "content writer":["SEO Writing","WordPress","Content Strategy","Grammar","Research"], journalist:["Investigative Reporting","AP Style","News Writing","Source Building","Video/Photography"] },
  },
};

// ─── KEYWORD → CATEGORY MAP ──────────────────────────────────────────────────
const KW_TO_CAT = {
  // Software
  "software engineer":"SOFT","software developer":"SOFT","full stack":"SOFT","fullstack":"SOFT","frontend":"SOFT","front end":"SOFT","backend":"SOFT","back end":"SOFT","web developer":"SOFT","mobile developer":"SOFT","mobile app":"SOFT","android":"SOFT","ios":"SOFT","flutter":"SOFT","react":"SOFT","angular":"SOFT","vue":"SOFT","node":"SOFT","nodejs":"SOFT","java developer":"SOFT","python developer":"SOFT","c++ developer":"SOFT","c developer":"SOFT","c# developer":"SOFT","php developer":"SOFT","laravel":"SOFT","django":"SOFT","ruby developer":"SOFT","go developer":"SOFT","rust developer":"SOFT","kotlin":"SOFT","swift":"SOFT","blockchain":"SOFT","game developer":"SOFT","ar developer":"SOFT","vr developer":"SOFT","embedded":"SOFT","iot":"SOFT","firmware":"SOFT","robotics":"SOFT","automation engineer":"SOFT","qa engineer":"SOFT","quality assurance":"SOFT","manual tester":"SOFT","automation tester":"SOFT","performance tester":"SOFT","test engineer":"SOFT","technical support":"SOFT","it support":"SOFT","help desk":"SOFT","solutions architect":"SOFT","enterprise architect":"SOFT","technical writer":"SOFT","scrum master":"SOFT","agile coach":"SOFT","systems analyst":"SOFT","programmer":"SOFT","coder":"SOFT","developer":"SOFT",
  // AI
  "artificial intelligence":"AI","machine learning":"AI","deep learning":"AI","generative ai":"AI","llm":"AI","prompt engineer":"AI","ai researcher":"AI","data scientist":"AI","data analyst":"AI","data engineer":"AI","bi developer":"AI","business intelligence":"AI","computer vision":"AI","nlp":"AI","natural language":"AI","ai trainer":"AI","ai annotator":"AI","mlops":"AI","ml engineer":"AI","ai engineer":"AI",
  // DevOps
  "devops":"DEVOPS","site reliability":"DEVOPS","cloud engineer":"DEVOPS","aws engineer":"DEVOPS","azure engineer":"DEVOPS","google cloud":"DEVOPS","platform engineer":"DEVOPS","infrastructure engineer":"DEVOPS","database administrator":"DEVOPS","database developer":"DEVOPS","system administrator":"DEVOPS","network engineer":"DEVOPS","security engineer":"DEVOPS","cybersecurity":"DEVOPS","ethical hacker":"DEVOPS","penetration tester":"DEVOPS","soc analyst":"DEVOPS","pen tester":"DEVOPS","sre":"DEVOPS","dba":"DEVOPS",
  // Engineering
  "mechanical engineer":"ENGG","civil engineer":"ENGG","electrical engineer":"ENGG","electronics engineer":"ENGG","chemical engineer":"ENGG","industrial engineer":"ENGG","production engineer":"ENGG","manufacturing engineer":"ENGG","automobile engineer":"ENGG","aerospace engineer":"ENGG","aeronautical":"ENGG","marine engineer":"ENGG","mining engineer":"ENGG","petroleum engineer":"ENGG","environmental engineer":"ENGG","biomedical engineer":"ENGG","structural engineer":"ENGG","quality engineer":"ENGG","maintenance engineer":"ENGG","planning engineer":"ENGG",
  // Healthcare
  "doctor":"HEALTH","physician":"HEALTH","surgeon":"HEALTH","dentist":"HEALTH","cardiologist":"HEALTH","neurologist":"HEALTH","dermatologist":"HEALTH","pediatrician":"HEALTH","gynecologist":"HEALTH","psychiatrist":"HEALTH","nurse":"HEALTH","nursing":"HEALTH","pharmacist":"HEALTH","physiotherapist":"HEALTH","radiologist":"HEALTH","lab technician":"HEALTH","medical":"HEALTH","hospital":"HEALTH","nutritionist":"HEALTH","dietitian":"HEALTH","optometrist":"HEALTH","veterinarian":"HEALTH","icu":"HEALTH","clinical":"HEALTH",
  // Education
  "teacher":"EDU","professor":"EDU","lecturer":"EDU","research scientist":"EDU","research fellow":"EDU","research assistant":"EDU","tutor":"EDU","principal":"EDU","dean":"EDU","academic":"EDU","faculty":"EDU","school":"EDU","coaching":"EDU",
  // Finance
  "accountant":"FINANCE","chartered accountant":"FINANCE","financial analyst":"FINANCE","investment banker":"FINANCE","auditor":"FINANCE","tax consultant":"FINANCE","credit analyst":"FINANCE","risk analyst":"FINANCE","treasury":"FINANCE","finance manager":"FINANCE","cost accountant":"FINANCE","payroll":"FINANCE","banking":"FINANCE","ca ":"FINANCE","cpa":"FINANCE",
  // Marketing & Sales
  "sales executive":"MKTG","sales manager":"MKTG","business development":"MKTG","marketing executive":"MKTG","marketing manager":"MKTG","digital marketing":"MKTG","seo":"MKTG","sem":"MKTG","social media manager":"MKTG","content marketing":"MKTG","brand manager":"MKTG","growth marketer":"MKTG","email marketing":"MKTG","affiliate marketer":"MKTG","customer success":"MKTG","sales":"MKTG","marketing":"MKTG",
  // Design
  "ui designer":"DESIGN","ux designer":"DESIGN","ui/ux":"DESIGN","graphic designer":"DESIGN","motion designer":"DESIGN","visual designer":"DESIGN","product designer":"DESIGN","industrial designer":"DESIGN","fashion designer":"DESIGN","interior designer":"DESIGN","3d artist":"DESIGN","animator":"DESIGN","illustrator":"DESIGN","designer":"DESIGN","figma":"DESIGN",
  // Legal
  "lawyer":"LEGAL","advocate":"LEGAL","legal advisor":"LEGAL","legal consultant":"LEGAL","legal associate":"LEGAL","corporate lawyer":"LEGAL","compliance officer":"LEGAL","paralegal":"LEGAL","attorney":"LEGAL","solicitor":"LEGAL",
  // Aviation
  "pilot":"AVIATION","cabin crew":"AVIATION","flight attendant":"AVIATION","ground staff":"AVIATION","aircraft":"AVIATION","air traffic":"AVIATION","airport":"AVIATION","flight":"AVIATION",
  // Hospitality
  "hotel manager":"HOSP","restaurant manager":"HOSP","chef":"HOSP","bartender":"HOSP","waiter":"HOSP","receptionist":"HOSP","housekeeping":"HOSP","event manager":"HOSP","travel consultant":"HOSP","tour guide":"HOSP","cook":"HOSP","hospitality":"HOSP","sous chef":"HOSP",
  // Logistics
  "logistics manager":"LOGISTICS","warehouse manager":"LOGISTICS","supply chain":"LOGISTICS","inventory manager":"LOGISTICS","dispatcher":"LOGISTICS","delivery executive":"LOGISTICS","delivery boy":"LOGISTICS","delivery partner":"LOGISTICS","delivery agent":"LOGISTICS","delivery driver":"LOGISTICS","courier":"LOGISTICS","fleet":"LOGISTICS","zepto":"LOGISTICS","swiggy":"LOGISTICS","zomato":"LOGISTICS","dunzo":"LOGISTICS","delhivery":"LOGISTICS","amazon flex":"LOGISTICS",
  // Manufacturing
  "production supervisor":"MANUF","production operator":"MANUF","machine operator":"MANUF","plant manager":"MANUF","assembly":"MANUF","cnc":"MANUF","production":"MANUF","manufacturing":"MANUF","factory":"MANUF",
  // Retail
  "store manager":"RETAIL","cashier":"RETAIL","retail sales":"RETAIL","merchandiser":"RETAIL","inventory executive":"RETAIL","retail":"RETAIL","shop":"RETAIL",
  // Government
  "ias":"GOVT","ips":"GOVT","ifs":"GOVT","irs":"GOVT","ssc":"GOVT","bank po":"GOVT","bank clerk":"GOVT","railway":"GOVT","police officer":"GOVT","army officer":"GOVT","navy officer":"GOVT","air force officer":"GOVT","forest officer":"GOVT","civil services":"GOVT","government":"GOVT","public sector":"GOVT","psc":"GOVT","upsc":"GOVT",
  // Science
  "physicist":"SCIENCE","chemist":"SCIENCE","biologist":"SCIENCE","microbiologist":"SCIENCE","geologist":"SCIENCE","astronomer":"SCIENCE","statistician":"SCIENCE","research":"SCIENCE","scientist":"SCIENCE","isro":"SCIENCE","drdo":"SCIENCE",
  // Trades
  "electrician":"TRADES","plumber":"TRADES","carpenter":"TRADES","welder":"TRADES","mechanic":"TRADES","hvac":"TRADES","machinist":"TRADES","painter":"TRADES","technician":"TRADES",
  // Media
  "content writer":"MEDIA","copywriter":"MEDIA","journalist":"MEDIA","reporter":"MEDIA","editor":"MEDIA","video editor":"MEDIA","photographer":"MEDIA","videographer":"MEDIA","podcast":"MEDIA","youtuber":"MEDIA","writer":"MEDIA","blogger":"MEDIA",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatSalary(min, max, currency = "$") {
  const fmt = n => {
    if (currency === "₹") { if (n >= 100000) return `${(n / 100000).toFixed(1)}L`; return n.toLocaleString("en-IN"); }
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`; return n.toString();
  };
  if (!min && !max) return "Salary TBD";
  if (min && max) return `${currency}${fmt(min)} – ${currency}${fmt(max)}`;
  return `${currency}${fmt(min || max)}`;
}
function timeAgo(d) {
  if (!d) return "";
  const hrs = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
  if (hrs < 1) return "Just now"; if (hrs < 24) return `${hrs}h ago`; return `${Math.floor(hrs / 24)}d ago`;
}
function pick(arr, n = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}
function randBetween(min, max) { return Math.floor(Math.random() * (max - min) + min); }

// ─── JOB GENERATOR ───────────────────────────────────────────────────────────
const INDIAN_CITIES = ["Bangalore","Hyderabad","Mumbai","Delhi","Chennai","Pune","Kolkata","Noida","Gurgaon","Ahmedabad","Jaipur","Lucknow","Kochi","Indore","Bhopal"];
const EXP_LEVELS = [
  { label:"Entry-Level", prefix:"Junior", range:"entry" },
  { label:"Entry-Level", prefix:"", range:"entry" },
  { label:"Mid-Level", prefix:"", range:"mid" },
  { label:"Mid-Level", prefix:"", range:"mid" },
  { label:"Senior", prefix:"Senior", range:"senior" },
  { label:"Senior", prefix:"Lead", range:"senior" },
];

function detectCategory(q) {
  const ql = q.toLowerCase();
  // Longest-match wins
  const sorted = Object.keys(KW_TO_CAT).sort((a,b) => b.length - a.length);
  for (const kw of sorted) { if (ql.includes(kw)) return KW_TO_CAT[kw]; }
  return null;
}

function extractJobTitle(q) {
  let cleanedQ = q;
  const locMatch = cleanedQ.match(/(?:in|at|near)\s+[a-zA-Z]+(?:\s+[a-zA-Z]+)?/i);
  if (locMatch) cleanedQ = cleanedQ.replace(locMatch[0], "");

  const extractedLoc = extractLocation(q);
  if (extractedLoc) {
     const reg = new RegExp("\\b" + extractedLoc + "\\b", "ig");
     cleanedQ = cleanedQ.replace(reg, "");
  }

  const typeWords = ["jobs","job","vacancy","vacancies","opening","openings","position","positions","role","roles","hiring","wanted","fresher","freshers","entry","mid","senior","level","full-time","part-time","contract","internship","remote","hybrid"];
  const words = cleanedQ.toLowerCase().split(/\s+/).filter(w => !typeWords.includes(w) && w.length > 1);
  return words.join(" ").trim();
}

function extractLocation(q) {
  const ql = q.toLowerCase();
  
  // 1. Try to extract arbitrary locations like "in tamilnadu" or "at google usa"
  const match = ql.match(/(?:in|at|near)\s+([a-z]+(?:\s+[a-z]+)?)/);
  if (match) {
    const extracted = match[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (!["Tech","Software","Hospital","School","Company","Mnc","Startup","Agency","College","University"].includes(extracted)) {
      return extracted;
    }
  }

  // 2. Fallback to known list
  const locs = ["bangalore","bengaluru","hyderabad","mumbai","delhi","chennai","pune","kolkata","noida","gurgaon","ahmedabad","jaipur","lucknow","kochi","indore","bhopal","remote","india","tamilnadu","kerala","maharashtra","karnataka"];
  for (const loc of locs) { if (ql.includes(loc)) { if (loc === "bengaluru") return "Bangalore"; return loc.charAt(0).toUpperCase() + loc.slice(1); } }
  
  // 3. Last unrecognized word heuristic (e.g. "Sales Executive trichy" -> "trichy")
  let matchedKeyword = null;
  const sortedKeys = Object.keys(KW_TO_CAT).sort((a,b) => b.length - a.length);
  for (const kw of sortedKeys) {
    if (ql.includes(kw)) { matchedKeyword = kw; break; }
  }
  if (matchedKeyword) {
    let remaining = ql.replace(matchedKeyword, "").trim();
    const typeWords = ["jobs","job","vacancy","vacancies","opening","openings","position","positions","role","roles","hiring","wanted","fresher","freshers","entry","mid","senior","level","full-time","part-time","contract","internship","remote","hybrid","developer","engineer","manager","executive"];
    let leftoverWords = remaining.split(/\s+/).filter(w => !typeWords.includes(w) && w.length > 2);
    if (leftoverWords.length > 0) {
      const possibleLoc = leftoverWords[leftoverWords.length - 1];
      return possibleLoc.charAt(0).toUpperCase() + possibleLoc.slice(1);
    }
  }

  return null;
}

function extractExpLevel(q) {
  const ql = q.toLowerCase();
  if (ql.includes("senior") || ql.includes("lead") || ql.includes("principal")) return "senior";
  if (ql.includes("junior") || ql.includes("fresher") || ql.includes("entry") || ql.includes("0-1") || ql.includes("0 year")) return "entry";
  if (ql.includes("mid") || ql.includes("3-5") || ql.includes("5 year")) return "mid";
  if (ql.includes("intern") || ql.includes("internship")) return "intern";
  return null;
}

function extractType(q) {
  const ql = q.toLowerCase();
  if (ql.includes("intern")) return "Internship";
  if (ql.includes("part-time") || ql.includes("part time")) return "Part-time";
  if (ql.includes("contract") || ql.includes("freelance")) return "Contract";
  return "Full-time";
}

function getSkillsForTitle(title, cat) {
  const tl = title.toLowerCase();
  const catDef = CAT[cat];
  if (!catDef) return ["Communication","Teamwork","Problem Solving","MS Office","Adaptability"];
  const sk = catDef.skills || {};
  // find best skill match
  for (const key of Object.keys(sk).sort((a,b)=>b.length-a.length)) {
    if (tl.includes(key)) return sk[key];
  }
  return sk.default || ["Communication","Teamwork","Problem Solving","MS Office"];
}

function generateJobs(query) {
  let cat = detectCategory(query);
  let title = extractJobTitle(query) || query.trim();
  const location = extractLocation(query);
  const forcedExp = extractExpLevel(query);
  const jobType = extractType(query);

  if (!cat && !location) return null; // unknown category & no location → show empty state
  const isMixed = !cat;

  const isRemote = query.toLowerCase().includes("remote");
  const isIntern = query.toLowerCase().includes("intern");

  const niceTitle = title.replace(/\b\w/g, c => c.toUpperCase());

  const levels = isIntern
    ? [{ label:"Intern", prefix:"", range:"entry" }]
    : forcedExp
      ? EXP_LEVELS.filter(e => e.range === forcedExp)
      : EXP_LEVELS;

  const results = [];
  const CAT_KEYS = Object.keys(CAT);

  const CAT_ROLES = {
    SOFT: ["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile Developer"],
    AI: ["Machine Learning Engineer", "Data Scientist", "AI Researcher", "NLP Engineer", "Data Engineer"],
    DEVOPS: ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "Platform Engineer", "Infrastructure Engineer"],
    ENGG: ["Mechanical Engineer", "Civil Engineer", "Electrical Engineer", "Electronics Engineer", "Chemical Engineer"],
    HEALTH: ["Cardiologist", "Neurologist", "Pediatrician", "General Physician", "Orthopedic Surgeon", "Psychiatrist", "Dermatologist"],
    EDU: ["Professor", "High School Teacher", "Assistant Professor", "Lecturer", "Research Scientist"],
    FINANCE: ["Financial Analyst", "Accountant", "Investment Banker", "Auditor", "Risk Analyst", "Finance Manager"],
    MKTG: ["Marketing Manager", "Digital Marketing Specialist", "Sales Manager", "SEO Specialist", "Business Development Executive"],
    DESIGN: ["UI Designer", "UX Designer", "Product Designer", "Graphic Designer", "Motion Designer"],
    LEGAL: ["Corporate Lawyer", "Legal Advisor", "Compliance Officer", "Legal Associate", "Advocate"],
    LOGISTICS: ["Supply Chain Manager", "Logistics Manager", "Warehouse Manager", "Delivery Executive", "Dispatcher"],
    AVIATION: ["Commercial Pilot", "Cabin Crew", "Ground Staff", "Air Traffic Controller", "Airport Manager"],
    HOSP: ["Hotel Manager", "Chef", "Restaurant Manager", "Event Manager", "Travel Consultant"],
    MANUF: ["Production Supervisor", "Plant Manager", "Manufacturing Engineer", "Quality Inspector", "Assembly Technician"],
    RETAIL: ["Store Manager", "Retail Sales Associate", "Merchandiser", "Inventory Executive"],
    GOVT: ["Civil Services Officer", "Bank PO", "SSC Officer", "Public Sector Executive"],
    SCIENCE: ["Research Scientist", "Biologist", "Chemist", "Physicist", "Microbiologist"],
    TRADES: ["Electrician", "Plumber", "Carpenter", "Welder", "HVAC Technician"],
    MEDIA: ["Journalist", "Content Writer", "Video Editor", "Copywriter", "Editor"],
  };

  // We want to generate 6 jobs.
  const genericWords = ["Doctor","Physician","Engineer","Developer","Designer","Manager","Executive","Analyst","Consultant","Specialist","Worker","Staff","Agent","Associate","Partner","Job","Jobs","Role","Roles"];
  const isGeneric = niceTitle.split(" ").length <= 1 || genericWords.some(w => niceTitle === w);

  for (let i = 0; i < 6; i++) {
    const jobCat = isMixed ? pick(CAT_KEYS) : cat;
    const catDef = CAT[jobCat];
    const company = pick(catDef.companies);

    let specificTitle = niceTitle;
    if (isMixed) {
        specificTitle = pick(CAT_ROLES[jobCat]);
    } else if (isGeneric && CAT_ROLES[jobCat]) {
        specificTitle = pick(CAT_ROLES[jobCat]);
    }

    const lvl = levels[i % levels.length];
    const jobTitle = lvl.prefix && !specificTitle.startsWith(lvl.prefix) ? `${lvl.prefix} ${specificTitle}` : specificTitle;
    const sal = catDef.salary[lvl.range] || catDef.salary.entry;
    const cityPool = location ? [location] : catDef.cities;
    const city = isRemote ? "Remote — India" : (pick(cityPool) || pick(INDIAN_CITIES));
    const daysAgo = randBetween(0, 14);
    const skills = getSkillsForTitle(isMixed ? specificTitle : title, jobCat);
    const applyLoc = isRemote ? "India" : (location || "India");
    const applyUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(applyLoc)}`;

    results.push({
      id: `gen_${i}_${Date.now()}`,
      title: jobTitle,
      company,
      location: city,
      description: catDef.desc(specificTitle),
      responsibilities: catDef.resp ? catDef.resp(specificTitle) : [],
      remote: isRemote || (i % 5 === 0 && !location),
      type: isIntern ? "Internship" : jobType,
      experienceLevel: isIntern ? "Intern" : lvl.label,
      salary: {
        min: randBetween(sal[0], sal[0] + (sal[1]-sal[0])/3),
        max: randBetween(sal[0] + (sal[1]-sal[0])*2/3, sal[1]),
        currency: sal.currency || catDef.salary.currency || "₹"
      },
      postedAt: new Date(Date.now() - daysAgo*86400000 - randBetween(0,23)*3600000).toISOString(),
      applyUrl,
      skills,
      color: catDef.color,
      tags: [],
    });
  }

  return results;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = `
  .jsp-ov{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.75);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;padding:12px;}
  .jsp-box{width:100%;max-width:1100px;height:90vh;display:flex;flex-direction:column;background:linear-gradient(155deg,#0d0d16 0%,#111120 60%,#0b0b12 100%);border:1px solid rgba(255,255,255,0.08);border-radius:22px;box-shadow:0 40px 100px rgba(0,0,0,0.85);overflow:hidden;animation:jIn .25s cubic-bezier(.16,1,.3,1);}
  @keyframes jIn{from{opacity:0;transform:scale(.95) translateY(16px)}to{opacity:1;transform:none}}
  @keyframes jSpin{to{transform:rotate(360deg)}}
  @keyframes jShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

  .jsp-hd{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:14px 22px;border-bottom:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.025);}
  .jsp-hdl{display:flex;align-items:center;gap:9px;}
  .jsp-ico{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#20c997,#0d9488);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(32,201,151,.28);}
  .jsp-hdtit{font-size:16px;font-weight:700;color:#fff;letter-spacing:-.3px;margin:0;}
  .jsp-pill{padding:2px 9px;border-radius:100px;background:rgba(32,201,151,.1);border:1px solid rgba(32,201,151,.2);font-size:9px;font-weight:700;color:#20c997;letter-spacing:.5px;}
  .jsp-xb{width:28px;height:28px;border-radius:7px;border:none;background:rgba(255,255,255,0.06);color:rgba(255,255,255,.5);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s;}
  .jsp-xb:hover{background:rgba(255,255,255,0.12);color:#fff;}

  .jsp-srchbar{flex-shrink:0;padding:14px 22px 12px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,0.015);}
  .jsp-srchrow{display:flex;gap:10px;align-items:center;}
  .jsp-srchinwrap{flex:1;position:relative;}
  .jsp-srchinico{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.3);pointer-events:none;}
  .jsp-srchin{width:100%;padding:12px 50px 12px 42px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#fff;font-size:14px;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s;box-sizing:border-box;}
  .jsp-srchin::placeholder{color:rgba(255,255,255,.25);}
  .jsp-srchin:focus{border-color:rgba(32,201,151,.45);box-shadow:0 0 0 4px rgba(32,201,151,.09);}
  .jsp-srchbtn{width:42px;height:42px;border-radius:11px;border:none;background:linear-gradient(135deg,#20c997,#0d9488);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(32,201,151,.28);transition:opacity .2s;flex-shrink:0;}
  .jsp-srchbtn:hover{opacity:.82;} .jsp-srchbtn:disabled{opacity:.4;cursor:not-allowed;}
  .jsp-chips{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px;}
  .jsp-chlbl{font-size:10px;color:rgba(255,255,255,.3);font-weight:600;}
  .jsp-chip{padding:4px 11px;border-radius:100px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.5);font-size:11px;font-family:inherit;cursor:pointer;transition:all .15s;}
  .jsp-chip:hover{background:rgba(32,201,151,.1);border-color:rgba(32,201,151,.3);color:#20c997;}

  .jsp-tabs{flex-shrink:0;display:flex;padding:0 22px;border-bottom:1px solid rgba(255,255,255,.07);}
  .jsp-tab{padding:9px 14px 11px;font-size:13px;font-weight:600;color:rgba(255,255,255,.35);background:none;border:none;cursor:pointer;position:relative;transition:color .15s;font-family:inherit;}
  .jsp-tab:hover{color:rgba(255,255,255,.7);} .jsp-tab.on{color:#fff;}
  .jsp-tab.on::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#20c997,#0d9488);border-radius:2px 2px 0 0;}
  .jsp-tb{display:inline-flex;align-items:center;justify-content:center;background:rgba(32,201,151,.15);color:#20c997;font-size:10px;font-weight:700;padding:1px 5px;border-radius:100px;margin-left:4px;}

  .jsp-body{flex:1;display:flex;overflow:hidden;min-height:0;}
  .jsp-main{flex:1;min-height:0;overflow-y:scroll;padding:18px 22px;scrollbar-width:none;-ms-overflow-style:none;}
  .jsp-main::-webkit-scrollbar{display:none;}
  .jsp-sb{flex-shrink:0;width:210px;border-left:1px solid rgba(255,255,255,.07);padding:18px 16px;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none;display:flex;flex-direction:column;gap:16px;}
  .jsp-sb::-webkit-scrollbar{display:none;}
  .jsp-sbt{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.35);margin:0 0 8px;}
  .jsp-sbinp{width:100%;padding:7px 10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#fff;font-size:12px;outline:none;font-family:inherit;box-sizing:border-box;transition:border-color .15s;}
  .jsp-sbinp:focus{border-color:rgba(32,201,151,.4);} .jsp-sbinp::placeholder{color:rgba(255,255,255,.2);}
  .jsp-sbsel{width:100%;padding:7px 10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#fff;font-size:12px;outline:none;font-family:inherit;box-sizing:border-box;cursor:pointer;}
  .jsp-sbsel option{background:#1a1a2e;}
  .jsp-togrow{display:flex;align-items:center;justify-content:space-between;padding:4px 0;}
  .jsp-toglbl{font-size:12px;color:rgba(255,255,255,.5);}
  .jsp-tog{width:32px;height:17px;border-radius:100px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
  .jsp-tog.on{background:#20c997;} .jsp-tog.off{background:rgba(255,255,255,.1);}
  .jsp-togk{position:absolute;top:2px;width:13px;height:13px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3);}
  .jsp-tog.on .jsp-togk{left:17px;} .jsp-tog.off .jsp-togk{left:2px;}
  .jsp-applyf{width:100%;padding:9px;border-radius:9px;border:none;background:linear-gradient(135deg,#20c997,#0d9488);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .2s;}
  .jsp-applyf:hover{opacity:.82;}

  .jsp-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
  @media(max-width:640px){.jsp-grid{grid-template-columns:1fr;}}

  .jsp-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:15px;padding:16px;cursor:pointer;display:flex;flex-direction:column;gap:11px;position:relative;overflow:hidden;transition:border-color .2s,background .2s,transform .15s,box-shadow .2s;}
  .jsp-card::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--cc,#20c997);opacity:0;transition:opacity .2s;}
  .jsp-card:hover{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.065);transform:translateY(-2px);box-shadow:0 10px 32px rgba(0,0,0,.25);}
  .jsp-card:hover::after{opacity:1;}
  .jsp-ctop{display:flex;align-items:flex-start;gap:11px;}
  .jsp-logo{border-radius:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
  .jsp-cinfo{flex:1;min-width:0;}
  .jsp-ctit{font-size:14px;font-weight:700;color:#fff;margin:0 0 3px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .jsp-cco{font-size:12px;color:rgba(255,255,255,.45);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .jsp-sv{width:28px;height:28px;border-radius:7px;border:none;background:rgba(255,255,255,.06);color:rgba(255,255,255,.4);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;}
  .jsp-sv:hover{background:rgba(255,255,255,.12);color:#fff;} .jsp-sv.on{background:rgba(32,201,151,.15);color:#20c997;}
  .jsp-cmeta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
  .b-r{padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(32,201,151,.12);color:#20c997;border:1px solid rgba(32,201,151,.2);}
  .b-t{padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(255,255,255,.07);color:rgba(255,255,255,.5);}
  .b-e{padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(167,139,250,.1);color:#a78bfa;border:1px solid rgba(167,139,250,.18);}
  .jsp-cfoot{display:flex;align-items:center;justify-content:space-between;}
  .jsp-sal{font-size:13px;font-weight:700;color:#20c997;} .jsp-age{font-size:11px;color:rgba(255,255,255,.3);}

  .jsp-skel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:15px;padding:16px;display:flex;gap:11px;}
  .jsp-skelb{border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,.05) 25%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.05) 75%);background-size:200% 100%;animation:jShimmer 1.5s infinite;}

  .jsp-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:260px;text-align:center;padding:32px;}
  .jsp-emico{width:60px;height:60px;border-radius:16px;background:rgba(32,201,151,.08);border:1px solid rgba(32,201,151,.16);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
  .jsp-emtit{font-size:16px;font-weight:700;color:#fff;margin:0 0 6px;} .jsp-emsub{font-size:13px;color:rgba(255,255,255,.35);margin:0;line-height:1.6;max-width:360px;}

  .jsp-hrow{display:flex;align-items:center;justify-content:space-between;padding:11px 13px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);cursor:pointer;transition:background .15s;margin-bottom:7px;}
  .jsp-hrow:hover{background:rgba(255,255,255,.07);}

  .jsp-spin{width:17px;height:17px;border:2px solid rgba(255,255,255,.15);border-top-color:#20c997;border-radius:50%;animation:jSpin .7s linear infinite;}

  .jsp-det{position:absolute;inset:0;z-index:20;background:linear-gradient(155deg,#0d0d16,#111120);display:flex;flex-direction:column;animation:jIn .22s cubic-bezier(.16,1,.3,1);overflow:hidden;}
  .jsp-dhd{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:13px 22px;border-bottom:1px solid rgba(255,255,255,.08);flex-wrap:wrap;gap:10px;}
  .jsp-backb{display:flex;align-items:center;gap:7px;background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:13px;font-weight:600;padding:0;transition:color .15s;font-family:inherit;}
  .jsp-backb:hover{color:#fff;}
  .jsp-dacts{display:flex;gap:7px;align-items:center;}
  .jsp-dactb{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(255,255,255,.55);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;}
  .jsp-dactb:hover{border-color:rgba(255,255,255,.2);color:#fff;} .jsp-dactb.on{border-color:rgba(32,201,151,.3);color:#20c997;background:rgba(32,201,151,.08);}
  .jsp-applybig{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:9px;border:none;background:linear-gradient(135deg,#20c997,#0d9488);color:#fff;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(32,201,151,.28);transition:opacity .15s;font-family:inherit;}
  .jsp-applybig:hover{opacity:.82;}
  .jsp-dbody{flex:1;min-height:0;display:flex;overflow:hidden;}
  .jsp-dmain{flex:1;min-height:0;overflow-y:scroll;padding:22px;scrollbar-width:none;-ms-overflow-style:none;}
  .jsp-dmain::-webkit-scrollbar{display:none;}
  .jsp-dside{flex-shrink:0;width:268px;border-left:1px solid rgba(255,255,255,.07);padding:22px 18px;overflow-y:scroll;scrollbar-width:none;-ms-overflow-style:none;display:flex;flex-direction:column;gap:14px;}
  .jsp-dside::-webkit-scrollbar{display:none;}
  .jsp-dco{display:flex;align-items:center;gap:13px;margin-bottom:18px;}
  .jsp-dlogo{width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
  .jsp-dlogo img{width:34px;height:34px;object-fit:contain;}
  .jsp-djt{font-size:22px;font-weight:800;color:#fff;margin:0 0 4px;letter-spacing:-.4px;line-height:1.2;}
  .jsp-djco{font-size:13px;color:rgba(255,255,255,.45);margin:0;}
  .jsp-dbdgs{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:20px;}
  .jsp-stit{font-size:14px;font-weight:700;color:#fff;margin:0 0 9px;}
  .jsp-desc{font-size:13px;color:rgba(255,255,255,.5);line-height:1.75;margin:0;}
  .jsp-hr{border:none;border-top:1px solid rgba(255,255,255,.07);margin:16px 0;}
  .jsp-rlist{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;}
  .jsp-rit{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:rgba(255,255,255,.5);line-height:1.5;}
  .jsp-rdot{width:5px;height:5px;border-radius:50%;background:#20c997;flex-shrink:0;margin-top:6px;}
  .jsp-skg{display:flex;flex-wrap:wrap;gap:6px;}
  .jsp-sk{padding:3px 10px;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.6);font-size:11px;font-weight:600;}
  .jsp-aic{border-radius:14px;padding:16px;background:linear-gradient(135deg,#180d2e 0%,#0d1828 100%);border:1px solid rgba(167,139,250,.18);position:relative;overflow:hidden;}
  .jsp-aic::before{content:'';position:absolute;top:-28px;right:-28px;width:90px;height:90px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,.15),transparent 70%);}
  .jsp-aihd{display:flex;align-items:center;gap:6px;margin-bottom:12px;}
  .jsp-ailbl{font-size:10px;font-weight:700;color:#a78bfa;text-transform:uppercase;letter-spacing:.8px;}
  .jsp-rw{position:relative;width:70px;height:70px;margin:0 auto 12px;}
  .jsp-rn{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .jsp-rbig{font-size:19px;font-weight:900;color:#fff;line-height:1;} .jsp-rpct{font-size:9px;color:rgba(255,255,255,.4);font-weight:600;}
  .jsp-ml{font-size:10px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;}
  .jsp-mt{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px;}
  .m-y{padding:2px 7px;border-radius:5px;font-size:10px;font-weight:600;background:rgba(32,201,151,.12);color:#20c997;}
  .m-n{padding:2px 7px;border-radius:5px;font-size:10px;font-weight:600;background:rgba(248,113,113,.12);color:#f87171;}
  .jsp-sugl{display:flex;flex-direction:column;gap:4px;}
  .jsp-sugi{display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,.45);padding:5px 8px;background:rgba(255,255,255,.03);border-radius:6px;}
  .jsp-coc{border-radius:13px;padding:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);}
  .jsp-cor{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);}
  .jsp-cor:last-child{border-bottom:none;} .jsp-cok{font-size:11px;color:rgba(255,255,255,.3);} .jsp-cov{font-size:11px;font-weight:700;color:rgba(255,255,255,.6);}
  .jsp-catbadge{padding:2px 9px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(255,255,255,.07);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.1);}
`;

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function JobSearchPanel({ onClose }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("search");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({ location: "", remote: false, experience: "" });
  const [saved, setSaved] = useState(() => { try { return JSON.parse(localStorage.getItem("vsj3_saved") || "[]"); } catch { return []; } });
  const [hist, setHist] = useState(() => { try { return JSON.parse(localStorage.getItem("vsj3_hist") || "[]"); } catch { return []; } });

  useEffect(() => { localStorage.setItem("vsj3_saved", JSON.stringify(saved)); }, [saved]);
  useEffect(() => { localStorage.setItem("vsj3_hist", JSON.stringify(hist)); }, [hist]);

  const isSv = j => saved.some(s => s.id === j.id);
  const togSv = (j, e) => { if (e) e.stopPropagation(); setSaved(p => isSv(j) ? p.filter(s => s.id !== j.id) : [{ ...j }, ...p]); };

  const applyClientFilters = (jobsList, currentFilters) => {
    return jobsList.filter(j => {
      if (currentFilters.remote && !j.remote) return false;
      if (currentFilters.experience && j.experienceLevel && !j.experienceLevel.toLowerCase().includes(currentFilters.experience.toLowerCase())) return false;
      if (currentFilters.location && j.location && !j.location.toLowerCase().includes(currentFilters.location.toLowerCase())) return false;
      return true;
    });
  };

  const search = async (query = q, overrideFilters = null) => {
    if (!query.trim()) return;
    setLoading(true); setSearched(true); setDetail(null); setNoMatch(false);
    setHist(p => [query, ...p.filter(x => x !== query)].slice(0, 10));

    const activeFilters = overrideFilters || filters;

    // Try live API first
    try {
      const res = await fetch(`https://${RAPID_API_HOST}/search-v2?query=${encodeURIComponent(query)}&page=1&num_pages=1`, {
        headers: { "x-rapidapi-key": RAPID_API_KEY, "x-rapidapi-host": RAPID_API_HOST }
      });
      if (!res.ok) throw new Error("api");
      const json = await res.json();
      const data = Array.isArray(json.data) ? json.data : (json.data && json.data.jobs) ? json.data.jobs : [];
      if (data && data.length > 0) {
        let parsedJobs = data.map((j, i) => ({ 
          id: j.job_id || String(i), 
          title: j.job_title, 
          company: j.employer_name, 
          location: `${j.job_city || ''} ${j.job_state || ''} ${j.job_country || ''}`.trim() || 'Unknown', 
          description: j.job_description || "", 
          remote: !!j.job_is_remote, 
          type: j.job_employment_type || "Full-time", 
          experienceLevel: "Mid-Level", 
          salary: j.job_min_salary ? { min: j.job_min_salary, max: j.job_max_salary || j.job_min_salary, currency: j.job_salary_currency || '$' } : null, 
          postedAt: j.job_posted_at_datetime_utc || new Date().toISOString(), 
          applyUrl: j.job_apply_link || `https://www.google.com/search?q=${encodeURIComponent(j.job_title + ' ' + j.employer_name)}`, 
          skills: j.job_required_skills || [], 
          color: "#20c997", 
          tags: [],
          logo: j.employer_logo || null,
          industry: j.employer_company_type || null,
          website: j.employer_website || null
        }));
        parsedJobs = applyClientFilters(parsedJobs, activeFilters);
        if (parsedJobs.length === 0) setNoMatch(true);
        setJobs(parsedJobs);
        setLoading(false); return;
      } else {
        setNoMatch(true);
        setJobs([]);
        setLoading(false); return;
      }
    } catch { 
      setNoMatch(true);
      setJobs([]);
      setLoading(false); 
      return;
    }
  };

  const Logo = ({ job, sz = 42, rad = 10 }) => (
    <div className="jsp-logo" style={{ width: sz, height: sz, borderRadius: rad }}>
      {job.logo
        ? <img src={job.logo} alt="" onError={e => { e.target.style.display = "none"; }} />
        : <div style={{ width: 26, height: 26, borderRadius: 7, background: (job.color || "#20c997") + "28", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: job.color || "#20c997" }}>{(job.company || "?")[0]}</div>}
    </div>
  );

  const Card = ({ job }) => (
    <div className="jsp-card" style={{ "--cc": job.color || "#20c997" }} onClick={() => setDetail(job)}>
      <div className="jsp-ctop">
        <Logo job={job} />
        <div className="jsp-cinfo">
          <p className="jsp-ctit">{job.title}</p>
          <p className="jsp-cco">{job.company} · {job.location}</p>
        </div>
        <button className={`jsp-sv ${isSv(job) ? "on" : ""}`} onClick={e => togSv(job, e)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={isSv(job) ? "#20c997" : "none"} stroke={isSv(job) ? "#20c997" : "currentColor"} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
        </button>
      </div>
      <div className="jsp-cmeta">
        {job.remote && <span className="b-r">Remote</span>}
        <span className="b-t">{job.type}</span>
        <span className="b-e">{job.experienceLevel}</span>
      </div>
      <div className="jsp-cfoot">
        <span className="jsp-sal">{job.salary ? formatSalary(job.salary.min, job.salary.max, job.salary.currency) : "Salary TBD"}</span>
        <span className="jsp-age">{timeAgo(job.postedAt)}</span>
      </div>
    </div>
  );

  const Skels = () => (
    <div className="jsp-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="jsp-skel">
          <div className="jsp-skelb" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="jsp-skelb" style={{ height: 13, width: "55%", borderRadius: 5 }} />
            <div className="jsp-skelb" style={{ height: 11, width: "38%", borderRadius: 5 }} />
            <div style={{ display: "flex", gap: 6 }}><div className="jsp-skelb" style={{ height: 17, width: 52, borderRadius: 100 }} /><div className="jsp-skelb" style={{ height: 17, width: 66, borderRadius: 100 }} /></div>
          </div>
        </div>
      ))}
    </div>
  );

  const Empty = ({ title, sub }) => (
    <div className="jsp-empty">
      <div className="jsp-emico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#20c997" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></div>
      <p className="jsp-emtit">{title}</p>
      <p className="jsp-emsub">{sub}</p>
    </div>
  );

  const Detail = ({ job }) => {
    const user = ["React", "JavaScript", "Python", "SQL", "Communication"];
    const hay = ((job.skills || []).join(" ")).toLowerCase();
    let score = 50 + Math.floor(Math.random() * 22);
    const matched = user.filter(s => hay.includes(s.toLowerCase()));
    const missing = (job.skills || []).filter(s => !user.includes(s)).slice(0, 2);
    score = Math.min(score + matched.length * 8, 99);
    const r = 30, cx = 35, cy = 35, circ = 2 * Math.PI * r;

    return (
      <div className="jsp-det">
        <div className="jsp-dhd">
          <button className="jsp-backb" onClick={() => setDetail(null)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to results
          </button>
          <div className="jsp-dacts">
            <button className={`jsp-dactb ${isSv(job) ? "on" : ""}`} onClick={() => togSv(job)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={isSv(job) ? "#20c997" : "none"} stroke={isSv(job) ? "#20c997" : "currentColor"} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
              {isSv(job) ? "Saved" : "Save"}
            </button>
            <button className="jsp-applybig" onClick={e => { e.stopPropagation(); window.open(job.applyUrl, "_blank", "noopener,noreferrer"); }}>
              Apply Now <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </button>
          </div>
        </div>
        <div className="jsp-dbody">
          <div className="jsp-dmain">
            <div className="jsp-dco">
              <div className="jsp-dlogo">{job.logo ? <img src={job.logo} alt="" onError={e => e.target.style.display = "none"} /> : <div style={{ width: 34, height: 34, borderRadius: 10, background: (job.color || "#20c997") + "28", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: job.color || "#20c997" }}>{(job.company || "?")[0]}</div>}</div>
              <div><p className="jsp-djt">{job.title}</p><p className="jsp-djco">{job.company} · {job.location}</p></div>
            </div>
            <div className="jsp-dbdgs">
              {job.remote && <span className="b-r" style={{ fontSize: 12, padding: "4px 11px" }}>🌐 Remote</span>}
              <span className="b-t" style={{ fontSize: 12, padding: "4px 11px" }}>💼 {job.type}</span>
              <span className="b-e" style={{ fontSize: 12, padding: "4px 11px" }}>⭐ {job.experienceLevel}</span>
              {job.salary && <span style={{ padding: "4px 11px", borderRadius: 100, fontSize: 12, fontWeight: 700, background: "rgba(32,201,151,.1)", color: "#20c997", border: "1px solid rgba(32,201,151,.2)" }}>💰 {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}</span>}
            </div>
            {job.description && (
              <>
                <p className="jsp-stit">About the Role</p>
                <p className="jsp-desc">{job.description}</p>
              </>
            )}
            
            {job.responsibilities && job.responsibilities.length > 0 && (
              <>
                <hr className="jsp-hr" />
                <p className="jsp-stit">Responsibilities</p>
                <ul className="jsp-rlist">
                  {job.responsibilities.map(r => <li key={r} className="jsp-rit"><span className="jsp-rdot" />{r}</li>)}
                </ul>
              </>
            )}

            {(job.skills && job.skills.length > 0) && (
              <>
                <hr className="jsp-hr" />
                <p className="jsp-stit">Skills</p>
                <div className="jsp-skg">{job.skills.map(s => <span key={s} className="jsp-sk">{s}</span>)}</div>
              </>
            )}
          </div>
          <div className="jsp-dside">
            <div className="jsp-aic">
              <div className="jsp-aihd"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg><span className="jsp-ailbl">AI Match Score</span></div>
              <div className="jsp-rw">
                <svg width="70" height="70" viewBox="0 0 70 70">
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#jg)" strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ} transform={`rotate(-90 ${cx} ${cy})`} />
                  <defs><linearGradient id="jg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#20c997" /></linearGradient></defs>
                </svg>
                <div className="jsp-rn"><span className="jsp-rbig">{score}</span><span className="jsp-rpct">%</span></div>
              </div>
              {matched.length > 0 && <div><div className="jsp-ml">Matched</div><div className="jsp-mt">{matched.map(s => <span key={s} className="m-y">✓ {s}</span>)}</div></div>}
              {missing.length > 0 && <div><div className="jsp-ml">Missing</div><div className="jsp-mt">{missing.map(s => <span key={s} className="m-n">✗ {s}</span>)}</div></div>}
              {missing.length > 0 && <div><div className="jsp-ml" style={{ marginBottom: 6 }}>Suggestions</div><div className="jsp-sugl">{missing.map((s, i) => <div key={i} className="jsp-sugi"><span style={{ color: "#a78bfa" }}>→</span>{`Learn ${s}`}</div>)}</div></div>}
            </div>
            <div className="jsp-coc">
              <p className="jsp-stit" style={{ fontSize: 12, marginBottom: 8 }}>Company Info</p>
              {[job.industry && ["Industry", job.industry], job.website && ["Website", job.website], ["Location", job.location]].filter(Boolean).map(([k, v]) => <div key={k} className="jsp-cor"><span className="jsp-cok">{k}</span><span className="jsp-cov" style={k === "Website" ? { color: "#20c997", cursor: "pointer", textDecoration: "underline" } : {}} onClick={(e) => { if (k === "Website") { e.stopPropagation(); window.open(v); } }}>{k === "Website" ? "Link" : v}</span></div>)}
              {job.contact && (
                <>
                  <div className="jsp-cor"><span className="jsp-cok">HR Email</span><span className="jsp-cov" style={{ color: "#20c997", cursor: "pointer", textDecoration: "underline" }} onClick={(e) => { e.stopPropagation(); window.open(`mailto:${job.contact.email}`); }}>{job.contact.email}</span></div>
                  <div className="jsp-cor"><span className="jsp-cok">HR Phone</span><span className="jsp-cov">{job.contact.phone}</span></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RAPID_API_HOST = "jsearch.p.rapidapi.com";
  const RAPID_API_KEY = "b8afe4b388mshe2317a4c7eb24bbp17fb60jsn09f0ea443459";

  const SAMPLE_CHIPS = ["Software Engineer Bangalore","Delivery Boy Hyderabad","Doctor Mumbai","Data Scientist Remote","Civil Engineer Chennai","Bank PO Delhi","UI Designer Pune","Sales Executive India"];

  return (
    <>
      <style>{S}</style>
      <div className="jsp-ov" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="jsp-box">
          <div className="jsp-hd">
            <div className="jsp-hdl">
              <div className="jsp-ico"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg></div>
              <h2 className="jsp-hdtit">AI Job Search</h2>
              <span className="jsp-pill">300+ JOB TYPES</span>
            </div>
            <button className="jsp-xb" onClick={onClose}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
          </div>

          <div className="jsp-srchbar">
            <div className="jsp-srchrow">
              <div className="jsp-srchinwrap">
                <div className="jsp-srchinico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></div>
                <input className="jsp-srchin" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") search(); }}
                  placeholder='Search any job — e.g. "Delivery boy Bangalore", "Doctor Mumbai", "Python Developer remote"' autoFocus />
              </div>
              <button className="jsp-srchbtn" onClick={() => search()} disabled={!q.trim() || loading}>
                {loading ? <div className="jsp-spin" /> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>}
              </button>
            </div>
            <div className="jsp-chips">
              <span className="jsp-chlbl">Try:</span>
              {SAMPLE_CHIPS.map(s => <button key={s} type="button" className="jsp-chip" onClick={() => { setQ(s); search(s); }}>{s}</button>)}
            </div>
          </div>

          <div className="jsp-tabs">
            <button className={`jsp-tab ${tab === "search" ? "on" : ""}`} onClick={() => setTab("search")}>Search{searched && <span className="jsp-tb">{jobs.length}</span>}</button>
            <button className={`jsp-tab ${tab === "saved" ? "on" : ""}`} onClick={() => setTab("saved")}>Saved{saved.length > 0 && <span className="jsp-tb">{saved.length}</span>}</button>
            <button className={`jsp-tab ${tab === "history" ? "on" : ""}`} onClick={() => setTab("history")}>History</button>
          </div>

          <div className="jsp-body">
            <div className="jsp-main">
              {tab === "search" && (
                loading ? <Skels /> :
                !searched ? <Empty title="Search any job across 300+ categories" sub={`Technology • Healthcare • Engineering • Finance • Design • Legal • Aviation • Hospitality • Government • and many more`} /> :
                noMatch ? <Empty title="No jobs found" sub={`We couldn't find any real jobs matching your criteria right now.`} /> :
                <div className="jsp-grid">{jobs.map(j => <Card key={j.id} job={j} />)}</div>
              )}
              {tab === "saved" && (saved.length === 0 ? <Empty title="No saved jobs" sub="Bookmark any job to save it here." /> : <div className="jsp-grid">{saved.map(j => <Card key={j.id} job={j} />)}</div>)}
              {tab === "history" && (hist.length === 0 ? <Empty title="No history yet" sub="Your recent searches will appear here." /> : hist.map((h, i) => (
                <div key={i} className="jsp-hrow" onClick={() => { setQ(h); setTab("search"); search(h); }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>{h}</span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              )))}
            </div>

            {tab === "search" && searched && !loading && !noMatch && (
              <div className="jsp-sb">
                <div><p className="jsp-sbt">Filters</p><input className="jsp-sbinp" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') search(); }} placeholder="Filter by city…" /></div>
                <div><p className="jsp-sbt">Work Type</p>
                  {["Remote", "Hybrid", "On-site"].map(t => (
                    <div key={t} className="jsp-togrow">
                      <span className="jsp-toglbl">{t}</span>
                      <button className={`jsp-tog ${t === "Remote" && filters.remote ? "on" : "off"}`} onClick={() => { if (t === "Remote") { const nf = { ...filters, remote: !filters.remote }; setFilters(nf); search(q, nf); } }}><div className="jsp-togk" /></button>
                    </div>
                  ))}
                </div>
                <div><p className="jsp-sbt">Experience</p>
                  <select className="jsp-sbsel" value={filters.experience} onChange={e => { const nf = { ...filters, experience: e.target.value }; setFilters(nf); search(q, nf); }}>
                    <option value="">Any</option><option value="intern">Internship</option><option value="entry">Entry Level</option><option value="mid">Mid-Level</option><option value="senior">Senior</option>
                  </select>
                </div>
                <button className="jsp-applyf" onClick={() => search()} style={{ marginTop: 'auto' }}>Apply Filters</button>
              </div>
            )}

            {detail && <Detail job={detail} />}
          </div>
        </div>
      </div>
    </>
  );
}
