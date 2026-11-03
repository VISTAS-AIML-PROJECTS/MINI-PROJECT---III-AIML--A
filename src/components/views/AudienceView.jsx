import {
  Smartphone,
  Info,
} from "lucide-react";
import { useCampaign } from "../../context/useCampaign";

const DEMOGRAPHIC_PROFILES = {
  SaaS: {
    ageBreakdown: [
      { range: "18-24", pct: 12 },
      { range: "25-34", pct: 48 },
      { range: "35-44", pct: 28 },
      { range: "45+", pct: 12 },
    ],
    devices: [
      { name: "Desktop / Workstation", pct: 64 },
      { name: "Mobile", pct: 32 },
      { name: "Tablet", pct: 4 },
    ],
    topJobTitles: ["VP Marketing", "Growth Lead", "Head of Digital", "Performance Marketer"],
  },
  FMCG: {
    ageBreakdown: [
      { range: "18-24", pct: 25 },
      { range: "25-34", pct: 40 },
      { range: "35-44", pct: 22 },
      { range: "45+", pct: 13 },
    ],
    devices: [
      { name: "Mobile", pct: 82 },
      { name: "Desktop", pct: 14 },
      { name: "Tablet", pct: 4 },
    ],
    topJobTitles: ["Household Decision Makers", "Young Professionals", "Students"],
  },
  Fintech: {
    ageBreakdown: [
      { range: "18-24", pct: 20 },
      { range: "25-34", pct: 52 },
      { range: "35-44", pct: 20 },
      { range: "45+", pct: 8 },
    ],
    devices: [
      { name: "Mobile iOS / Android", pct: 88 },
      { name: "Desktop Web", pct: 12 },
    ],
    topJobTitles: ["Retail Investors", "Tech Employees", "Self-Employed", "Founders"],
  },
};

export default function AudienceView() {
  const { industry, market } = useCampaign();

  const profile = DEMOGRAPHIC_PROFILES[industry] || DEMOGRAPHIC_PROFILES.SaaS;

  return (
    <div className="view-container">
      {/* Header Strip */}
      <div className="view-header-strip">
        <div>
          <span className="strip-badge">AUDIENCE INTELLIGENCE</span>
          <h2 className="view-title">Target Audience Segmentation & Demographics</h2>
          <p className="view-subtitle">
            Demographic profiles, platform affinities, and device distribution tailored for {industry}.
          </p>
        </div>
      </div>

      {/* Explicit Prototype Demo Notice */}
      <div className="alert alert-warning">
        <Info size={18} className="text-amber" />
        <div>
          <strong>[Prototype / Demo Module]:</strong> Audience segmentation characteristics shown below are
          synthetic industry reference profiles intended for creative planning. The authoritative machine
          learning model specifically powers <strong>budget response and revenue optimization</strong>.
        </div>
      </div>

      <div className="audience-grid">
        {/* Age Demographics Card */}
        <div className="card audience-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Age Cohort Distribution</h3>
              <p className="card-subtitle">Estimated target demographic share for {industry}</p>
            </div>
            <span className="proto-tag">Demo Profile</span>
          </div>

          <div className="cohort-bars-list">
            {profile.ageBreakdown.map((item) => (
              <div key={item.range} className="cohort-row">
                <div className="cohort-label-row">
                  <span className="cohort-range">Age {item.range}</span>
                  <span className="cohort-pct">{item.pct}%</span>
                </div>
                <div className="cohort-track">
                  <div className="cohort-fill" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Distribution Card */}
        <div className="card audience-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Primary Device Breakdown</h3>
              <p className="card-subtitle">Engagement distribution across hardware touchpoints</p>
            </div>
            <span className="proto-tag">Demo Profile</span>
          </div>

          <div className="device-list">
            {profile.devices.map((d) => (
              <div key={d.name} className="device-item">
                <div className="device-info">
                  <Smartphone size={16} className="text-blue" />
                  <span className="device-name">{d.name}</span>
                </div>
                <div className="device-bar-wrap">
                  <div className="device-bar-fill" style={{ width: `${d.pct}%` }} />
                  <span className="device-pct">{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Affinity Matrix */}
      <div className="card table-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Channel Affinity & User Intent Behavior</h3>
            <p className="card-subtitle">
              Qualitative intent classification mapped to advertising platforms in {market}
            </p>
          </div>
          <span className="proto-tag">Strategy Demo</span>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Primary User Mindset</th>
                <th>Intent Level</th>
                <th>Creative Format Recommendation</th>
                <th>Funnel Stage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Google Ads</strong></td>
                <td>Active Solution Seeking / High Intent Query</td>
                <td><span className="pill pill-emerald">Very High</span></td>
                <td>Clear Value Search Ads + Direct Landing Pages</td>
                <td>Bottom of Funnel (Conversion)</td>
              </tr>
              <tr>
                <td><strong>Meta Ads</strong></td>
                <td>Passive Discovery / Social Proof & Interest</td>
                <td><span className="pill pill-blue">Medium-High</span></td>
                <td>Carousel Showcase, Video Testimonials & Offers</td>
                <td>Mid Funnel (Consideration)</td>
              </tr>
              {market === "Global" ? (
                <tr>
                  <td><strong>TikTok Ads</strong></td>
                  <td>Entertainment Discovery / Short-form Trend Hook</td>
                  <td><span className="pill pill-slate">Broad / Viral</span></td>
                  <td>Native UGC-style Fast Shorts with Sound</td>
                  <td>Top of Funnel (Awareness)</td>
                </tr>
              ) : (
                <tr>
                  <td><strong>TikTok Ads</strong></td>
                  <td>Excluded from Indian Market</td>
                  <td>—</td>
                  <td>Not available in selected geography</td>
                  <td>—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
