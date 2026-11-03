import {
  CheckCircle2,
  Info,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useCampaign } from "../../context/useCampaign";

export default function CampaignsView() {
  const {
    campaignName,
    setCampaignName,
    productName,
    setProductName,
    market,
    setMarket,
    industry,
    setIndustry,
    campaignType,
    setCampaignType,
    duration,
    setDuration,
    revenueGoal,
    setRevenueGoal,
    budget,
    setBudget,
    minBudget,
    maxBudget,
    availablePlatforms,
    productOptions,
    setActiveView,
    optimizeBudget,
    loading,
    error,
  } = useCampaign();

  const handleLaunchOptimizer = async () => {
    const success = await optimizeBudget();
    if (success) {
      setActiveView("optimizer");
    }
  };

  return (
    <div className="view-container">
      {/* Page Header */}
      <div className="view-header-strip">
        <div>
          <span className="strip-badge">SETUP & ATTRIBUTES</span>
          <h2 className="view-title">Campaign Setup & Targeting Configuration</h2>
          <p className="view-subtitle">
            Configure campaign parameters, industry category, targeting scope, and budget boundaries
            for the AI optimization pipeline.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      <div className="campaign-setup-grid">
        {/* Main Configuration Card */}
        <div className="card setup-form-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">General Campaign Settings</h3>
              <p className="card-subtitle">Foundational metadata and market classification</p>
            </div>
            <span className="pill pill-emerald">Core Inputs</span>
          </div>

          <form className="form-grid" onSubmit={(e) => { e.preventDefault(); handleLaunchOptimizer(); }}>
            {/* Campaign Name */}
            <div className="form-group full-width">
              <label htmlFor="campaignName" className="form-label">
                Campaign Name
              </label>
              <input
                id="campaignName"
                type="text"
                className="form-input"
                placeholder="e.g. Q3 OmniGrowth Accelerator"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                required
              />
              <span className="form-help">Internal tracking identifier for this optimization session</span>
            </div>

            {/* Industry Selection */}
            <div className="form-group">
              <label htmlFor="industry" className="form-label">
                Industry Vertical
              </label>
              <select
                id="industry"
                className="form-select"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="FMCG">FMCG</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Fintech">Fintech</option>
                <option value="EdTech">EdTech</option>
                <option value="SaaS">SaaS</option>
              </select>
              <span className="form-help">Sets historical curve benchmarks</span>
            </div>

            {/* Product / Brand Selection */}
            <div className="form-group">
              <label htmlFor="productName" className="form-label">
                Product / Brand
              </label>
              <select
                id="productName"
                className="form-select"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              >
                <option value="">Select a product/brand</option>
                {(productOptions[industry] || []).map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
              <span className="form-help">Filtered by {industry}</span>
            </div>

            {/* Market Selection */}
            <div className="form-group">
              <label htmlFor="market" className="form-label">
                Market Geography
              </label>
              <select
                id="market"
                className="form-select"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
              >
                <option value="India">India (Google Ads + Meta Ads)</option>
                <option value="Global">Global (Google Ads + Meta Ads + TikTok Ads)</option>
              </select>
              <span className="form-help">
                Determines supported platform portfolio
              </span>
            </div>

            {/* Campaign Type */}
            <div className="form-group">
              <label htmlFor="campaignType" className="form-label">
                Campaign Objective / Type
              </label>
              <select
                id="campaignType"
                className="form-select"
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
              >
                <option value="Search">Search Engine Marketing</option>
                <option value="Display">Display & Banner Network</option>
                <option value="Video">Video & Social Shorts</option>
                <option value="Shopping">Shopping & Catalog Feeds</option>
              </select>
              <span className="form-help">Primary creative format focus</span>
            </div>

            {/* Duration (Days) */}
            <div className="form-group">
              <label htmlFor="duration" className="form-label">
                Flight Duration (Days)
              </label>
              <div className="input-with-icon">
                <input
                  id="duration"
                  type="number"
                  className="form-input"
                  placeholder="30"
                  min="1"
                  max="365"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <span className="input-suffix">Days</span>
              </div>
              <span className="form-help">Planned campaign duration</span>
            </div>

            {/* Revenue Goal */}
            <div className="form-group">
              <label htmlFor="revenueGoal" className="form-label">
                Target Revenue Goal (₹)
              </label>
              <div className="input-with-icon">
                <span className="input-prefix">₹</span>
                <input
                  id="revenueGoal"
                  type="number"
                  className="form-input has-prefix"
                  placeholder="75000"
                  min="0"
                  value={revenueGoal}
                  onChange={(e) => setRevenueGoal(e.target.value)}
                />
              </div>
              <span className="form-help">Internal target benchmark</span>
            </div>

            {/* Total Campaign Budget Input */}
            <div className="form-group full-width budget-highlight-group">
              <div className="budget-label-row">
                <label htmlFor="campaignBudget" className="form-label">
                  Total Campaign Budget (₹)
                </label>
                <span className="budget-range-pill">
                  Feasible Range: ₹{minBudget.toLocaleString("en-IN")} – ₹{maxBudget.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="input-with-icon budget-input-wrap">
                <span className="input-prefix-large">₹</span>
                <input
                  id="campaignBudget"
                  type="number"
                  className="form-input budget-input has-prefix"
                  placeholder="25000"
                  min={minBudget}
                  max={maxBudget}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                />
              </div>
              <span className="form-help">
                This exact budget value will be supplied to the Scipy SLSQP optimizer endpoint.
              </span>
            </div>

            <div className="form-actions full-width">
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={loading}
              >
                <span>{loading ? "Running Optimization..." : "Save & Run Budget Optimizer"}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Right Information Panel */}
        <div className="setup-sidebar-stack">
          {/* Market & Platform Rules */}
          <div className="card info-card">
            <div className="card-header">
              <h3 className="card-title">Market Envelope & Platforms</h3>
            </div>
            <div className="info-card-body">
              <div className="market-status-box">
                <div className="market-status-header">
                  <span className="status-label">Current Scope</span>
                  <span className="status-badge-blue">{market}</span>
                </div>
                <div className="platforms-chip-list">
                  {availablePlatforms.map((p) => (
                    <span key={p} className="chip-platform">
                      <CheckCircle2 size={13} className="text-emerald" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {market === "India" && (
                <div className="info-callout">
                  <Info size={16} className="text-blue" />
                  <p>
                    <strong>TikTok Exclusion:</strong> TikTok Ads is excluded from India campaigns
                    due to market availability. The budget is optimized across Google Ads and Meta Ads.
                  </p>
                </div>
              )}

              <div className="constraints-summary-box">
                <div className="constraints-title">Platform Parameter Bounds</div>
                <div className="constraint-row">
                  <span>Google Ads</span>
                  <strong>₹5,000 – ₹25,000</strong>
                </div>
                <div className="constraint-row">
                  <span>Meta Ads</span>
                  <strong>₹5,000 – ₹15,000</strong>
                </div>
                {market === "Global" && (
                  <div className="constraint-row">
                    <span>TikTok Ads</span>
                    <strong>₹5,000 – ₹20,000</strong>
                  </div>
                )}
                <div className="constraint-row total-row">
                  <span>Total Feasible Envelope</span>
                  <strong>
                    ₹{minBudget.toLocaleString("en-IN")} – ₹{maxBudget.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Engine Integrity Guarantee */}
          <div className="card trust-card">
            <div className="trust-card-header">
              <ShieldCheck size={20} className="text-emerald" />
              <h4>Model Integrity Guarantee</h4>
            </div>
            <p className="trust-card-text">
              The optimizer respects strict mathematical equality constraints: the sum of platform
              allocations exactly equals your specified budget, while staying strictly within individual
              platform bounds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
