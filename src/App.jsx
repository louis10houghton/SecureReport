import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const sites = [
  { name: "Store 01 - North", lat: -37.7998, lng: 144.8997 },
  { name: "Store 02 - West", lat: -37.8162, lng: 144.8936 },
  { name: "MediPlus Pharmacy", lat: -37.8116, lng: 144.9551 },
  { name: "TechZone Electronics", lat: -37.8175, lng: 144.9671 },
  { name: "Store 05 - Central", lat: -37.8136, lng: 144.9631 },
];

// Security & compliance commitments. Grounded in the business plan: Privacy Act
// 1988 handling, encrypted cloud storage, secure authentication, and mandatory
// human review. Deliberately avoids claiming certifications (SOC 2 / ISO) the
// business does not yet hold.
const complianceItems = [
  {
    type: "shield",
    title: "Privacy Act 1988 aligned",
    blurb:
      "CCTV footage and personal information are handled in line with Australia's Privacy Act 1988 and its rules for surveillance data.",
  },
  {
    type: "lock",
    title: "Encrypted cloud storage",
    blurb:
      "Footage and generated reports are stored on encrypted cloud infrastructure, both in transit and at rest.",
  },
  {
    type: "key",
    title: "Secure authentication",
    blurb:
      "Every account is protected by secure sign-in with hashed credentials — passwords are never stored in plain text.",
  },
  {
    type: "user-check",
    title: "Human review, always",
    blurb:
      "No report is finalised by AI alone. A person reviews and approves every incident report before it leaves the platform.",
  },
  {
    type: "database",
    title: "Your data stays yours",
    blurb:
      "You own your footage and reports. Export them as branded PDFs at any time, or request deletion when you close your account.",
  },
  {
    type: "au",
    title: "Australian-registered business",
    blurb:
      "Operated as an ABN-registered, ASIC-compliant Australian business, with cyber and professional indemnity cover under review.",
  },
];

// Illustrative testimonials for the demo — replace with real customer quotes
// before launch. Reuses the fictional businesses shown on the coverage map so
// the demo stays internally consistent.
const testimonials = [
  {
    quote:
      "What used to take my duty manager 40 minutes of typing is now a two-minute review. The reports are consistent and police accept them without questions.",
    name: "Priya Nair",
    role: "Store Manager, MediPlus Pharmacy",
    initials: "PN",
  },
  {
    quote:
      "We plugged it into our existing cameras with zero new hardware. The searchable history helped us spot a repeat offender hitting us on the same weekday.",
    name: "Daniel Osei",
    role: "Loss Prevention Lead, TechZone Electronics",
    initials: "DO",
  },
  {
    quote:
      "As a single-site owner I don't have time for paperwork. Having a human check every report before it's finalised is what sold me — accuracy matters for insurance.",
    name: "Sarah Whitton",
    role: "Owner, North Star Convenience",
    initials: "SW",
  },
];

// Placeholder pilot-retailer names for the trust strip — swap for real partner
// logos once signed.
const pilotRetailers = [
  "MediPlus Pharmacy",
  "TechZone Electronics",
  "North Star Convenience",
  "Westgate Grocers",
  "Harbour City Retail",
];

const plans = [
  {
    name: "Starter",
    amount: 49,
    sites: "1 site",
    desc: "For independent, single-location stores",
    featured: false,
    includes: null,
    features: [
      "AI-powered incident report generation",
      "Searchable incident dashboard",
      "Standard PDF export",
      "3 months of incident history",
      "Single user login",
      "Email support, standard response time",
    ],
    description:
      "Built for independent stores and single-location retailers. Includes AI-powered incident report generation, the searchable incident dashboard, standard PDF export, and 3 months of incident history. Single user login. Email support with standard response time.",
  },
  {
    name: "Professional",
    amount: 99,
    sites: "Up to 5 sites",
    desc: "For small multi-location chains",
    featured: true,
    includes: "Everything in Starter, plus:",
    features: [
      "Analytics with trend charts by time and location",
      "Custom-branded PDF export with your own logo",
      "12 months of incident history",
      "Up to 5 user seats with role-based access",
      "Priority support, same-business-day response",
    ],
    description:
      "Designed for small retail chains managing multiple locations. Includes everything in Starter, plus the analytics page with trend charts by time and location, custom-branded PDF export (retailer's own logo, for police/insurer submission), 12 months of incident history, up to 5 user seats with role-based access, and priority support with same-business-day response.",
  },
  {
    name: "Business",
    amount: 199,
    sites: "Up to 15 sites",
    desc: "For large multi-site operators",
    featured: false,
    includes: "Everything in Professional, plus:",
    features: [
      "Advanced analytics: cross-site comparison and predictive trends",
      "Unlimited incident history and archive export",
      "Unlimited user seats",
      "Priority AI processing queue",
      "API access for CCTV and security system integration",
    ],
    description:
      "Built for larger multi-site operators, shopping centres, and security companies managing retail clients. Includes everything in Professional, plus advanced analytics (cross-site comparison and predictive trend insights), unlimited incident history and archive export, unlimited user seats, priority AI processing queue, and API access for integration with existing CCTV and security management systems.",
  },
];

const capabilityItems = [
  { title: "AI Video Analysis", type: "video" },
  { title: "Structured Report Generation", type: "document" },
  { title: "Incident Dashboard", type: "dashboard" },
  { title: "Trend Analytics", type: "chart" },
  { title: "Branded PDF Export", type: "export" },
  { title: "Push Notifications", type: "bell" },
];

const capabilityBlurbs = {
  video: "AI reviews footage frame by frame to flag entries, exits, and suspicious behaviour.",
  document: "Key events are turned into a clean, structured incident report automatically.",
  dashboard: "Every incident across every site in one live, filterable feed.",
  chart: "Spot patterns over time with trend charts by period, site, and type.",
  export: "Download a branded PDF for police, insurers, or internal records in one click.",
  bell: "Get notified the moment a new report is generated and ready for review.",
};

function ComplianceIcon({ type }) {
  const paths = {
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    lock: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="8" r="4" />
        <path d="M11 11l8 8M17 17l2-2M15 15l2-2" />
      </>
    ),
    "user-check": (
      <>
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M16 11l2 2 4-4" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
      </>
    ),
    au: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24">{paths[type] || paths.shield}</svg>
  );
}

function FeatureIcon({ type }) {
  const icons = {
    video: <><rect x="2" y="5" width="15" height="14" rx="3" /><path d="M17 10l5-3v10l-5-3z" /><circle cx="9.5" cy="12" r="3" /></>,
    document: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
    chart: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16l4-5 3 3 5-7" /></>,
    export: <><path d="M12 15V3" /><path d="M8 7l4-4 4 4" /><path d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4" /></>,
    bell: <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></>,
  };
  return <svg viewBox="0 0 24 24">{icons[type] || icons.document}</svg>;
}

const GREEN_FILL = "rgba(43,214,123,0.12)";
const GREEN_FAINT = "rgba(43,214,123,0.05)";

function StepGraphic({ step }) {
  if (step === 1) {
    return (
      <svg viewBox="0 0 24 24" className="step-media" aria-hidden="true">
        <path d="m9 10 3-3 3 3" />
        <path d="M12 13V7" />
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M12 17v4" />
        <path d="M8 21h8" />
      </svg>
    );
  }
  if (step === 2) {
    return (
      <svg viewBox="0 0 24 24" className="step-media" aria-hidden="true">
        <path d="M12 18V5" />
        <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
        <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
        <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
        <path d="M18 18a4 4 0 0 0 2-7.464" />
        <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
        <path d="M6 18a4 4 0 0 1-2-7.464" />
        <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
      </svg>
    );
  }
  if (step === 3) {
    return (
      <svg viewBox="0 0 24 24" className="step-media" aria-hidden="true">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M9 14h6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="step-media" aria-hidden="true">
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function CapabilityGraphic({ type }) {
  if (type === "chart") {
    return (
      <svg viewBox="0 0 240 84" className="capability-media" aria-hidden="true">
        <rect x="16" y="10" width="208" height="64" rx="8" fill={GREEN_FAINT} />
        <path d="M32 66 H216" opacity="0.35" />
        <path d="M32 62 L72 48 L104 54 L144 32 L184 26 L212 18 L212 66 L32 66 Z" fill={GREEN_FILL} stroke="none" />
        <path d="M32 62 L72 48 L104 54 L144 32 L184 26 L212 18" />
        <circle cx="144" cy="32" r="3.5" fill="var(--green)" stroke="none" />
        <circle cx="212" cy="18" r="3.5" fill="var(--green)" stroke="none" />
      </svg>
    );
  }

  if (type === "video") {
    return (
      <svg viewBox="0 0 240 84" className="capability-media" aria-hidden="true">
        <rect x="14" y="10" width="150" height="64" rx="9" fill={GREEN_FAINT} />
        <circle cx="70" cy="38" r="10" />
        <path d="M52 66c0-11 8-18 18-18s18 7 18 18" />
        <rect x="46" y="24" width="48" height="46" rx="4" strokeDasharray="5 6" />
        <rect x="182" y="20" width="44" height="44" rx="8" />
        <path d="M192 34 H216 M192 44 H216 M192 54 H208" opacity="0.85" />
      </svg>
    );
  }

  if (type === "document") {
    return (
      <svg viewBox="0 0 240 84" className="capability-media" aria-hidden="true">
        <rect x="44" y="8" width="94" height="68" rx="6" fill={GREEN_FAINT} />
        <path d="M44 28 H138" />
        <path d="M56 42 H126 M56 52 H126 M56 62 H98" opacity="0.85" />
        <circle cx="168" cy="46" r="20" fill={GREEN_FILL} />
        <path d="M159 46 l7 7 13 -14" />
      </svg>
    );
  }

  if (type === "dashboard") {
    return (
      <svg viewBox="0 0 240 84" className="capability-media" aria-hidden="true">
        <rect x="16" y="10" width="208" height="64" rx="8" fill={GREEN_FAINT} />
        <path d="M16 30 H224" />
        <circle cx="30" cy="20" r="2.5" /><circle cx="40" cy="20" r="2.5" /><circle cx="50" cy="20" r="2.5" />
        <rect x="30" y="44" width="16" height="22" rx="2" fill={GREEN_FILL} />
        <rect x="54" y="38" width="16" height="28" rx="2" fill={GREEN_FILL} />
        <rect x="78" y="48" width="16" height="18" rx="2" fill={GREEN_FILL} />
        <path d="M118 44 H208 M118 54 H208 M118 64 H176" opacity="0.85" />
      </svg>
    );
  }

  if (type === "export") {
    return (
      <svg viewBox="0 0 240 84" className="capability-media" aria-hidden="true">
        <path d="M40 10 H96 L112 26 V74 H40 Z" fill={GREEN_FAINT} />
        <path d="M96 10 V26 H112" />
        <path d="M54 40 H98 M54 52 H98 M54 62 H82" opacity="0.85" />
        <path d="M160 26 V56 M148 46 l12 12 12 -12" />
        <rect x="182" y="34" width="44" height="30" rx="6" fill={GREEN_FILL} />
        <path d="M192 43 h10 M192 49 h24 M192 55 h18" opacity="0.85" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 84" className="capability-media" aria-hidden="true">
      <path d="M118 22c-13 0-22 10-22 23 0 15-8 19-8 19h60s-8-4-8-19c0-13-9-23-22-23z" fill={GREEN_FAINT} />
      <path d="M110 66a9 9 0 0016 0" />
      <path d="M150 32a22 22 0 010 20" opacity="0.6" />
      <path d="M162 26a34 34 0 010 32" opacity="0.35" />
      <circle cx="140" cy="28" r="9" fill="var(--green)" stroke="none" />
    </svg>
  );
}

function LandingPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    company: "",
    phone: "",
    plan: "",
    message: "",
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-37.8136, 144.9631], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap contributors",
    }).addTo(map);

    const greenIcon = L.divIcon({
      html: '<div style="width:12px;height:12px;background:#2bd67b;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>',
      className: "",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    sites.forEach((site) => {
      L.marker([site.lat, site.lng], { icon: greenIcon })
        .addTo(map)
        .bindPopup(`<strong>${site.name}</strong><br>SecureReport AI - Active`);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Close the expanded screenshot on Escape, and lock body scroll while open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  const onInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.fname,
          lastName: formData.lname,
          email: formData.email,
          company: formData.company,
          phone: formData.phone,
          plan: formData.plan,
          message: formData.message,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Submission failed.");
      alert(payload.message || "Thank you. We will be in touch within 24 hours.");
      setFormData({ fname: "", lname: "", email: "", company: "", phone: "", plan: "", message: "" });
    } catch (err) {
      alert(err.message || "Sorry, something went wrong. Please try again.");
    }
  };

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <a href="#" className="nav-logo">Secure<span>Report</span> AI</a>
          <ul className="nav-links">
            <li><a href="#platform">Platform</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#security">Security</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <Link to="/transaction" className="nav-cta">Get Started</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1>
              Turn CCTV footage into <span>incident reports</span> in minutes
            </h1>
            <p className="hero-sub">
              Upload security footage. Our AI identifies key events, builds a structured report,
              and your team reviews it before finalisation. No manual paperwork. No missed details.
            </p>
            <div className="hero-actions">
              <Link to="/transaction" className="btn-primary">Start Free Trial</Link>
              <a href="#platform" className="btn-outline">See How It Works</a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><strong>80%</strong><span>Less report-writing time</span></div>
              <div className="hero-stat"><strong>Minutes</strong><span>From footage to report</span></div>
              <div className="hero-stat"><strong>100%</strong><span>Human-reviewed output</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hv-footage">
              <div className="hv-footage-bar hv-mono">
                <span className="hv-rec"><span className="hv-rec-dot" />REC</span>
                <span className="hv-cam">CAM 03 · SELF-CHECKOUT</span>
                <span className="hv-time">02:14:07</span>
              </div>
              <div className="hv-frame">
                <div className="hv-scan" />
                <svg className="hv-figure" viewBox="0 0 120 90" aria-hidden="true">
                  <circle cx="60" cy="30" r="11" />
                  <path d="M42 74c0-12 8-20 18-20s18 8 18 20" />
                </svg>
                <div className="hv-box"><span className="hv-box-tag hv-mono">Person · 98%</span></div>
              </div>
            </div>

            <div className="hv-arrow">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></svg>
            </div>

            <div className="hv-report">
              <div className="hv-report-head">
                <span className="hv-report-title">Incident Report</span>
                <span className="hv-report-badge">Draft · Ready for review</span>
              </div>
              <div className="hv-field"><span>Incident type</span><b>Suspected theft — self-checkout</b></div>
              <div className="hv-field"><span>Timestamp</span><b>02:14 AM · 08 Aug 2026</b></div>
              <div className="hv-field"><span>Location</span><b>Store 01 - North</b></div>
              <div className="hv-field"><span>Confidence</span><b className="hv-conf">High (94%)</b></div>
              <div className="hv-report-foot"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>Generated by AI · pending human review</div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <div className="container">
          <div className="trust-inner">
            <div className="trust-item">
              <div className="trust-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
              <div><div className="trust-text">Human-Reviewed</div><div className="trust-sub">Every report verified before export</div></div>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>
              <div><div className="trust-text">Minutes, Not Hours</div><div className="trust-sub">Reduce report writing by up to 80%</div></div>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg></div>
              <div><div className="trust-text">Works With Existing CCTV</div><div className="trust-sub">No new hardware required</div></div>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 11-6.22-8.56" /><path d="M22 4L12 14.01l-3-3" /></svg></div>
              <div><div className="trust-text">Cloud-Based Platform</div><div className="trust-sub">Access from any browser, anywhere</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="platform">
        <div className="container">
          <div className="section-header">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">From footage to finished report in four steps</h2>
            <p className="section-desc">SecureReport AI automates the most time-consuming part of incident documentation while keeping humans in control of the final output.</p>
          </div>
          <div className="process-grid">
            <div className="process-step"><div className="step-graphic"><StepGraphic step={1} /></div><div className="step-number">1</div><h3>Upload Footage</h3><p>Upload a CCTV clip directly through your browser. Standard video formats accepted, no special hardware needed.</p><span className="process-arrow">→</span></div>
            <div className="process-step"><div className="step-graphic"><StepGraphic step={2} /></div><div className="step-number">2</div><h3>AI Analysis</h3><p>Our AI identifies entry and exit times, movement patterns, physical descriptions, and indicators of theft or suspicious behaviour.</p><span className="process-arrow">→</span></div>
            <div className="process-step"><div className="step-graphic"><StepGraphic step={3} /></div><div className="step-number">3</div><h3>Human Review</h3><p>The generated report is reviewed and edited by your team before finalisation, ensuring accuracy and accountability.</p><span className="process-arrow">→</span></div>
            <div className="process-step"><div className="step-graphic"><StepGraphic step={4} /></div><div className="step-number">4</div><h3>Export and Share</h3><p>Download a branded PDF with your business logo for police, insurance claims, or internal records.</p></div>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="preview-grid">
            <div className="preview-text">
              <div className="section-label">Incident Dashboard</div>
              <h2>One view for every incident across every site</h2>
              <p>The SecureReport AI dashboard displays a live feed of recent incidents, each tagged by severity, site, and type. From this single view, upload new footage, review reports, and search past incidents.</p>
              <ul className="preview-list">
                <li><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>Incidents tagged by severity, site, and type</li>
                <li><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>Searchable history filtered by date, location, or category</li>
                <li><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>Trend analytics with charts by time period and location</li>
                <li><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>Push notifications when new reports are generated</li>
              </ul>
              <Link to="/transaction" className="btn-primary">Get Started</Link>
            </div>
            <div className="preview-mockup">
              <div className="mock-topbar"><span className="mock-topbar-title">Incident Feed</span><span className="mock-badge">3 new today</span></div>
              {["red", "amber", "green", "amber", "red"].map((tone, idx) => (
                <div className="mock-row" key={tone + idx}>
                  <div className="mock-row-left">
                    <div className={`dot dot-${tone}`} />
                    <div>
                      <div className="mock-row-title">{["Suspected theft - self-checkout", "After-hours rear door access", "Loitering - main entrance", "Unattended bag - aisle 4", "Forced entry attempt - loading dock"][idx]}</div>
                    </div>
                  </div>
                  <div className="mock-row-time">{["2:14 AM", "11:48 PM", "8:32 PM", "6:15 PM", "3:47 AM"][idx]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section screenshots-section">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Product Preview</div>
            <h2 className="section-title">A look inside the platform</h2>
            <p className="section-desc">From a single dashboard, review every AI-drafted incident report and upload new CCTV footage for analysis.</p>
          </div>
          <div className="screenshots-grid">
            <figure className="screenshot-card">
              <button type="button" className="screenshot-open" onClick={() => setLightbox({ src: "/screenshot-reports.png", alt: "SecureReport incident reports dashboard listing finalised reports" })} aria-label="Expand the incident reports dashboard screenshot">
                <img src="/screenshot-reports.png" alt="SecureReport incident reports dashboard listing finalised reports" loading="lazy" />
                <span className="screenshot-zoom" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></svg>
                </span>
              </button>
              <figcaption>Incident reports — every AI draft, reviewed before it's finalised</figcaption>
            </figure>
            <figure className="screenshot-card">
              <button type="button" className="screenshot-open" onClick={() => setLightbox({ src: "/screenshot-upload.png", alt: "SecureReport upload CCTV footage screen with site and video file fields" })} aria-label="Expand the upload footage screenshot">
                <img src="/screenshot-upload.png" alt="SecureReport upload CCTV footage screen with site and video file fields" loading="lazy" />
                <span className="screenshot-zoom" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></svg>
                </span>
              </button>
              <figcaption>Upload footage — the AI drafts a report you review and edit next</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Capabilities</div>
            <h2 className="section-title">Everything you need to manage security incidents</h2>
            <p className="section-desc">From automated analysis to branded exports, SecureReport AI replaces manual paperwork with a single, streamlined platform.</p>
          </div>
          <div className="features-grid">
            {capabilityItems.map((item) => (
              <div className="feature-card" key={item.title}>
                <div className="feature-icon"><FeatureIcon type={item.type} /></div>
                <h3>{item.title}</h3>
                <p>{capabilityBlurbs[item.type]}</p>
                <CapabilityGraphic type={item.type} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light" id="security">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Security &amp; Compliance</div>
            <h2 className="section-title">Built for trust with your security data</h2>
            <p className="section-desc">CCTV footage is sensitive. SecureReport AI is designed around Australian privacy obligations, encrypted storage, and mandatory human review — so you can share reports with police and insurers with confidence.</p>
          </div>
          <div className="compliance-grid">
            {complianceItems.map((item) => (
              <div className="compliance-card" key={item.title}>
                <div className="compliance-icon"><ComplianceIcon type={item.type} /></div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Customer Stories</div>
            <h2 className="section-title">Retailers spend less time on paperwork</h2>
            <p className="section-desc">How stores using SecureReport AI describe the difference.</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <figure className="testimonial-card" key={t.name}>
                <div className="testimonial-stars" aria-hidden="true">★★★★★</div>
                <blockquote>“{t.quote}”</blockquote>
                <figcaption>
                  <span className="testimonial-avatar">{t.initials}</span>
                  <span>
                    <span className="testimonial-name">{t.name}</span>
                    <span className="testimonial-role">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="logo-strip">
            <span className="logo-strip-label">Piloting with retailers like</span>
            <div className="logo-strip-items">
              {pilotRetailers.map((name) => (
                <span className="logo-chip" key={name}>{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-light" id="pricing">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Pricing</div>
            <h2 className="section-title">Plans that scale with your business</h2>
            <p className="section-desc">No lock-in contracts. Cancel anytime.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => (
              <div className={`price-card${plan.featured ? " featured" : ""}`} key={plan.name}>
                {plan.featured && <div className="price-tag">Most Popular</div>}
                <h3>{plan.name}</h3>
                <p className="price-tier-desc">{plan.desc}</p>
                <div className="price-amount">${plan.amount} <span>/mo</span></div>
                <p className="price-period">Billed monthly · {plan.sites}</p>
                <hr className="price-divider" />
                {plan.includes && <p className="price-includes">{plan.includes}</p>}
                <ul className="price-features">
                  {plan.features.map((feature) => (
                    <li key={feature}><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg> {feature}</li>
                  ))}
                </ul>
                <Link to={`/transaction?plan=${encodeURIComponent(plan.name)}`} className={`price-btn ${plan.featured ? "price-btn-primary" : "price-btn-outline"}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Contact</div>
            <h2 className="section-title">Get in touch</h2>
            <p className="section-desc">Have questions about SecureReport AI? Send us a message and we will get back to you.</p>
          </div>
          <div className="contact-grid">
            <form className="contact-form" onSubmit={onSubmit}>
              <div className="form-row">
                <div className="form-group"><label htmlFor="fname">First name</label><input id="fname" name="fname" value={formData.fname} onChange={onInput} placeholder="First name" /></div>
                <div className="form-group"><label htmlFor="lname">Last name</label><input id="lname" name="lname" value={formData.lname} onChange={onInput} placeholder="Last name" /></div>
              </div>
              <div className="form-group"><label htmlFor="email">Business email</label><input id="email" type="email" name="email" value={formData.email} onChange={onInput} placeholder="you@business.com.au" /></div>
              <div className="form-group"><label htmlFor="company">Company</label><input id="company" name="company" value={formData.company} onChange={onInput} placeholder="Your business name" /></div>
              <div className="form-row">
                <div className="form-group"><label htmlFor="phone">Phone</label><input id="phone" name="phone" value={formData.phone} onChange={onInput} placeholder="04XX XXX XXX" /></div>
                <div className="form-group">
                  <label htmlFor="plan">Plan of interest</label>
                  <select id="plan" name="plan" value={formData.plan} onChange={onInput}>
                    <option value="">Select a plan</option>
                    <option>Starter - $49/month</option>
                    <option>Professional - $99/month</option>
                    <option>Business - $199/month</option>
                    <option>Not sure yet</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label htmlFor="message">Message</label><textarea id="message" name="message" value={formData.message} onChange={onInput} placeholder="Tell us about your business and what you are looking for..." /></div>
              <button type="submit" className="btn-primary">Submit</button>
            </form>
            <div className="contact-info">
              <h3>SecureReport AI</h3>
              <p>Automated incident reporting for retailers. Powered by artificial intelligence, reviewed by humans.</p>
              <div className="contact-detail"><div className="cd-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg></div><div><div className="cd-label">Email</div><div className="cd-text">hello@securereport.com.au</div></div></div>
              <div className="contact-detail"><div className="cd-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg></div><div><div className="cd-label">Location</div><div className="cd-text">Cloud-based · Available nationwide</div></div></div>
              <div className="contact-detail"><div className="cd-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div><div><div className="cd-label">Business hours</div><div className="cd-text">Monday to Friday, 9:00 AM - 5:00 PM AEST</div></div></div>
              <div className="contact-detail"><div className="cd-icon"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg></div><div><div className="cd-label">Phone</div><div className="cd-text">(03) 9000 0000</div></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Service Area</div>
            <h2 className="section-title">Serving retailers nationwide</h2>
            <p className="section-desc">Our platform is cloud-based and accessible from anywhere, with support available across every region we operate in.</p>
          </div>
          <div id="map" ref={mapContainerRef} />
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand"><a href="#" className="nav-logo">Secure<span>Report</span> AI</a><p>Transforming CCTV footage into professional incident reports. Powered by artificial intelligence, reviewed by humans.</p></div>
            <div><h4>Platform</h4><ul><li><a href="#platform">How It Works</a></li><li><a href="#features">Features</a></li><li><a href="#pricing">Pricing</a></li></ul></div>
            <div><h4>Company</h4><ul><li><a href="#contact">Contact Us</a></li><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Service</a></li></ul></div>
            <div><h4>Connect</h4><ul><li><a href="#">LinkedIn</a></li><li><a href="#">Facebook</a></li><li><a href="#">YouTube</a></li></ul></div>
          </div>
          <div className="footer-bottom"><span>2026 SecureReport AI. All rights reserved.</span><span className="footer-abn">ABN: 12 345 678 901</span></div>
          <div className="footer-disclaimer">This website/app is for a class assignment and not for commercial purposes.</div>
        </div>
      </footer>

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Expanded screenshot" onClick={() => setLightbox(null)}>
          <button type="button" className="lightbox-close" aria-label="Close" onClick={() => setLightbox(null)}>&times;</button>
          <img className="lightbox-img" src={lightbox.src} alt={lightbox.alt} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function TransactionPage() {
  const [params] = useSearchParams();
  const initialPlan = params.get("plan") || "Professional";
  const returnStatus = params.get("status"); // "success" | "cancelled" from Stripe redirect
  const sessionId = params.get("session_id");

  const [status, setStatus] = useState(returnStatus === "success" ? "success" : "idle");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [data, setData] = useState({
    plan: initialPlan,
    fullName: "",
    email: "",
    company: "",
  });

  const selectedPlan = plans.find((p) => p.name === data.plan) || plans[0];

  // A gentle notice if the customer came back from a cancelled Stripe session.
  const cancelled = returnStatus === "cancelled";

  // On return from Stripe's hosted checkout, confirm the session server-side so
  // the customer's receipt email is sent (and the transaction is finalised).
  // Idempotent on the backend, so a refresh won't send a duplicate.
  useEffect(() => {
    if (returnStatus === "success" && sessionId) {
      fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }
  }, [returnStatus, sessionId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const startCheckout = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: data.plan,
          fullName: data.fullName,
          email: data.email,
          company: data.company,
        }),
      });

      const raw = await response.text();
      let payload = {};
      if (raw) {
        try {
          payload = JSON.parse(raw);
        } catch {
          payload = { error: "Received an invalid response from the checkout service." };
        }
      }

      if (!response.ok) {
        throw new Error(payload.error || "Checkout could not be started.");
      }

      // Stripe configured → hand off to the hosted, PCI-safe checkout page.
      if (payload.mode === "stripe" && payload.url) {
        setStatus("redirecting");
        window.location.href = payload.url;
        return;
      }

      // Stripe not configured → simulated approval, show the receipt inline.
      if (payload.mode === "simulated" && payload.transactionId) {
        setReceipt(payload);
        setStatus("success");
        return;
      }

      throw new Error("Checkout service returned an unexpected response.");
    } catch (err) {
      setStatus("error");
      const message = err?.message || "Checkout could not be started.";
      if (message.toLowerCase().includes("fetch")) {
        setError("Cannot reach the checkout API. Start it with: npm run dev:api");
      } else {
        setError(message);
      }
    }
  };

  const showSuccess = status === "success";

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <Link to="/" className="nav-logo">Secure<span>Report</span> AI</Link>
          <Link to="/" className="nav-cta">Back to Website</Link>
        </div>
      </nav>

      <section className="section section-light transaction-page">
        <div className="container transaction-wrap">
          <div className="transaction-intro">
            <div className="section-label">Subscription Checkout</div>
            <h1 className="section-title">Complete Your Subscription</h1>
            <p className="section-desc">Confirm your details and continue to our secure payment provider to activate SecureReport AI.</p>

            <div className="plan-summary">
              <div className="plan-summary-head">
                <span className="plan-summary-name">{selectedPlan.name}</span>
                <span className="plan-summary-price">${selectedPlan.amount}<span>/mo</span></span>
              </div>
              <span className="plan-summary-sites">{selectedPlan.sites}</span>
              <p className="plan-summary-desc">{selectedPlan.description}</p>
            </div>
          </div>

          {showSuccess ? (
            <div className="transaction-card">
              <div className="txn-success">
                <strong>Subscription Activated</strong>
                {receipt ? (
                  <>
                    <p>Transaction ID: {receipt.transactionId}</p>
                    <p>Plan: {receipt.plan} — ${receipt.amount}/mo</p>
                    <p>Next billing date: {receipt.nextBillingDate}</p>
                    <p className="txn-note">{receipt.message}</p>
                  </>
                ) : (
                  <>
                    <p>Thanks — your payment to Stripe was successful.</p>
                    <p>Plan: {selectedPlan.name} — ${selectedPlan.amount}/mo</p>
                    {sessionId && <p className="txn-note">Checkout reference: {sessionId}</p>}
                    <p className="txn-note">A receipt has been recorded and your subscription is now active.</p>
                  </>
                )}
              </div>
              <Link to="/" className="btn-primary" style={{ textAlign: "center" }}>Return to homepage</Link>
            </div>
          ) : (
            <form className="transaction-card" onSubmit={startCheckout}>
              <h3>Your details</h3>
              {cancelled && (
                <p className="txn-cancelled">Checkout was cancelled — no payment was taken. You can try again below.</p>
              )}
              <div className="form-group">
                <label htmlFor="planChoice">Plan</label>
                <select id="planChoice" name="plan" value={data.plan} onChange={onChange}>
                  {plans.map((p) => (
                    <option key={p.name} value={p.name}>{p.name} - ${p.amount}/mo</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full name</label>
                  <input id="fullName" name="fullName" value={data.fullName} onChange={onChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Business email</label>
                  <input id="email" name="email" type="email" value={data.email} onChange={onChange} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input id="company" name="company" value={data.company} onChange={onChange} required />
              </div>

              {status === "error" && <p className="txn-error">{error}</p>}

              <button className="btn-primary" type="submit" disabled={status === "loading" || status === "redirecting"}>
                {status === "loading" || status === "redirecting" ? "Redirecting to secure checkout..." : "Continue to secure checkout"}
              </button>

              <p className="checkout-note">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                You'll be redirected to Stripe to enter payment. Card details are never entered on this site.
              </p>
              <p className="checkout-testcard">Test mode: use card <code>4242 4242 4242 4242</code>, any future expiry, any CVC.</p>
            </form>
          )}
        </div>
        <div className="footer-disclaimer">This website/app is for a class assignment and not for commercial purposes.</div>
      </section>
    </>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, hash]);
  return null;
}

function App() {
  const location = useLocation();
  return (
    <div className="sr-app">
      <ScrollToTop />
      <div className="route-page" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/transaction" element={<TransactionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
