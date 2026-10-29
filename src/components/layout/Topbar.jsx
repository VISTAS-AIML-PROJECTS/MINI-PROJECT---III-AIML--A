import {
  Globe,
  Sparkles,
  Cpu,
} from "lucide-react";
import { useCampaign } from "../../context/useCampaign";

const VIEW_TITLES = {
  dashboard: {
    title: "Executive Dashboard",
    category: "AI Marketing Intelligence",
    desc: "Real-time campaign overview, ML predictions & platform allocation",
  },
  campaigns: {
    title: "Campaign Configuration",
    category: "Campaign Management",
    desc: "Define product, market constraints, target industry & objectives",
  },
  "ad-generator": {
    title: "AI Creative Studio",
    category: "Ad Generation",
    desc: "Synthesize platform-tailored ad copy and live realistic previews",
  },
  optimizer: {
    title: "Budget Optimizer (ML Core)",
    category: "Constrained SLSQP Engine",
    desc: "Optimal budget allocation using fitted logarithmic response curves",
  },
  analytics: {
    title: "Performance Analytics",
    category: "Channel Intelligence",
    desc: "Cross-platform efficiency, model projections & channel benchmarks",
  },
  "ab-testing": {
    title: "A/B Split Testing",
    category: "Experimentation (Prototype)",
    desc: "Head-to-head strategy comparisons & allocation lift simulations",
  },
  audience: {
    title: "Audience Intelligence",
    category: "Audience Segments (Demo)",
    desc: "Demographic insights, platform affinities & engagement signals",
  },
  "what-if": {
    title: "What-If Budget Simulator",
    category: "Scenario Modeling",
    desc: "Simulate alternative budget envelopes against the live ML optimizer",
  },
  reports: {
    title: "Executive Reports",
    category: "Presentation & Export",
    desc: "Comprehensive executive summary ready for stakeholders & export",
  },
};

export default function Topbar() {
  const {
    activeView,
    setActiveView,
    market,
    minBudget,
    maxBudget,
    result,
    loading,
    optimizeBudget,
  } = useCampaign();

  const currentMeta = VIEW_TITLES[activeView] || {
    title: "AI Campaign Studio",
    category: "Overview",
    desc: "Modern AI Marketing SaaS Platform",
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span>Campaign Optimizer</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-cat">{currentMeta.category}</span>
        </div>
        <h1 className="topbar-title">{currentMeta.title}</h1>
      </div>

      <div className="topbar-right">
        {/* Market Chip */}
        <div className="topbar-chip">
          <Globe size={14} className="chip-icon-teal" />
          <span className="chip-label">Market:</span>
          <strong className="chip-value">{market}</strong>
        </div>

        {/* Boundary Limits Chip */}
        <div className="topbar-chip">
          <Cpu size={14} className="chip-icon-blue" />
          <span className="chip-label">Range:</span>
          <span className="chip-value">
            ₹{minBudget.toLocaleString("en-IN")} – ₹{maxBudget.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Quick Action Button */}
        {activeView !== "optimizer" && (
          <button
            type="button"
            className="topbar-btn"
            onClick={() => {
              if (activeView !== "campaigns" && !result) {
                setActiveView("optimizer");
              } else {
                optimizeBudget();
              }
            }}
            disabled={loading}
          >
            <Sparkles size={14} />
            <span>{loading ? "Running ML..." : result ? "Re-Optimize" : "Run Optimizer"}</span>
          </button>
        )}
      </div>
    </header>
  );
}
