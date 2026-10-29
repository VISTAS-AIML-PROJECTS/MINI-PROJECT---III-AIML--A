import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useCampaign } from "../../context/useCampaign";

export default function DashboardView() {
  const {
    campaignName,
    productName,
    industry,
    market,
    budget,
    result,
    allocationData,
    revenueData,
    loading,
    error,
    optimizeBudget,
    setActiveView,
  } = useCampaign();

  const totalBudget = result?.total_budget || Number(budget) || 0;
  const totalRevenue = result?.total_predicted_revenue || 0;
  const returnMultiplier = totalBudget > 0 && totalRevenue > 0
    ? (totalRevenue / totalBudget).toFixed(2)
    : "—";

  return (
    <div className="view-container">
      {/* Main Dashboard Heading */}
      <div className="view-header-strip">
        <div>
          <span className="strip-badge">EXECUTIVE DASHBOARD</span>
          <h1 className="view-title">Campaign Performance Prediction and Budget Optimization System</h1>
          <p className="view-subtitle">
            Real-time campaign overview, ML predictions & platform allocation
          </p>
        </div>
      </div>

      {/* Campaign Identity Strip */}
      <div className="campaign-strip">
        <div className="strip-left">
          <span className="strip-badge">ACTIVE CAMPAIGN</span>
          <h2 className="strip-title">{campaignName || "Untitled Campaign"}</h2>
          <div className="strip-tags">
            <span className="pill pill-slate">Brand: <strong>{productName || "General"}</strong></span>
            <span className="pill pill-slate">Industry: <strong>{industry}</strong></span>
            <span className="pill pill-slate">Market: <strong>{market}</strong></span>
          </div>
        </div>
        <div className="strip-right">
          {!result && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => optimizeBudget()}
              disabled={loading}
            >
              <Sparkles size={16} />
              <span>{loading ? "Optimizing..." : "Run ML Optimizer"}</span>
            </button>
          )}
          {result && (
            <div className="ml-verified-badge">
              <ShieldCheck size={16} />
              <span>Optimization Complete</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <div>
            <strong>Optimization Notice:</strong> {error}
          </div>
        </div>
      )}

      {/* Top Authoritative KPI Scorecards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">TOTAL CAMPAIGN BUDGET</span>
            <span className="kpi-icon-wrap teal"><DollarSign size={16} /></span>
          </div>
          <div className="kpi-value">
            ₹{Number(totalBudget).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="kpi-footer">
            <span className="badge-subtle">
              {result ? "Target Allocated" : "Configured Budget"}
            </span>
            <span className="kpi-subtext">Market: {market}</span>
          </div>
        </div>

        <div className="kpi-card highlight-card">
          <div className="kpi-header">
            <span className="kpi-label">PREDICTED TOTAL REVENUE</span>
            <span className="kpi-icon-wrap green"><TrendingUp size={16} /></span>
          </div>
          <div className="kpi-value emerald-text">
            {result ? (
              `₹${Number(totalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
            ) : (
              <span className="placeholder-text">Awaiting ML Run</span>
            )}
          </div>
          <div className="kpi-footer">
            {result ? (
              <span className="pill pill-emerald">
                <CheckCircle size={12} /> ML Output
              </span>
            ) : (
              <span className="kpi-subtext">Click 'Run Optimizer' to calculate</span>
            )}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">REVENUE / BUDGET RATIO</span>
            <span className="kpi-icon-wrap blue"><Zap size={16} /></span>
          </div>
          <div className="kpi-value">
            {returnMultiplier !== "—" ? `${returnMultiplier}x` : "—"}
          </div>
          <div className="kpi-footer">
            <span className="kpi-subtext">
              {result ? "Calculated from Model Predictions" : "Requires Optimization"}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">PORTFOLIO PLATFORMS</span>
            <span className="kpi-icon-wrap purple"><PieIcon size={16} /></span>
          </div>
          <div className="kpi-value">
            {result ? Object.keys(result.allocation).length : market === "India" ? 2 : 3}
          </div>
          <div className="kpi-footer">
            <span className="kpi-subtext">
              {market === "India" ? "Google & Meta (TikTok excluded)" : "Google, Meta & TikTok"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      {result ? (
        <div className="dashboard-grid">
          {/* Allocation Donut Chart */}
          <div className="card chart-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">AI Recommended Platform Allocation</h3>
                <p className="card-subtitle">SLSQP constrained mathematical distribution</p>
              </div>
              <span className="pill pill-emerald">Live ML Result</span>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="budget"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {allocationData.map((entry) => (
                      <Cell key={entry.platform} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [
                      `₹${Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
                      "Recommended Budget",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="legend-list">
              {allocationData.map((item) => (
                <div key={item.platform} className="legend-row">
                  <div className="legend-dot-label">
                    <span className="legend-color-dot" style={{ background: item.color }} />
                    <span className="legend-name">{item.platform}</span>
                  </div>
                  <div className="legend-metrics">
                    <span className="legend-pct">{item.percentage}%</span>
                    <strong className="legend-amt">
                      ₹{item.budget.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Estimation Bar Chart */}
          <div className="card chart-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Predicted Revenue by Platform</h3>
                <p className="card-subtitle">Estimated via Gradient Boosting & response curves</p>
              </div>
              <span className="pill pill-blue">Authoritative Model</span>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="shortName" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `₹${Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
                      "Predicted Revenue",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-bottom-info">
              <span className="chart-info-note">
                Total Predicted Revenue: <strong>₹{Number(totalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
              </span>
              <button
                type="button"
                className="link-button"
                onClick={() => setActiveView("optimizer")}
              >
                Inspect Constraints →
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Callout when optimizer hasn't run yet */
        <div className="card empty-hero-card">
          <div className="empty-hero-icon">
            <Sparkles size={36} />
          </div>
          <h3>Optimization Analysis Ready</h3>
          <p>
            Campaign parameters are loaded. Run the SLSQP constrained optimizer to calculate the
            mathematically optimal platform budget allocation and predicted revenue.
          </p>
          <div className="empty-action-group">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => optimizeBudget()}
              disabled={loading}
            >
              {loading ? "Processing Model..." : `Optimize Budget (₹${Number(budget).toLocaleString("en-IN")})`}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setActiveView("campaigns")}
            >
              Adjust Parameters
            </button>
          </div>
        </div>
      )}

      {/* Platform Performance Table */}
      {result && (
        <div className="card table-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Platform Allocation & Revenue Matrix</h3>
              <p className="card-subtitle">
                Authoritative optimizer outputs adhering to minimum and maximum platform bounds
              </p>
            </div>
            <span className="pill pill-slate">Market: {market}</span>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Recommended Budget</th>
                  <th>Share (%)</th>
                  <th>Predicted Revenue</th>
                  <th>Revenue / Budget Ratio</th>
                  <th>Optimization Status</th>
                </tr>
              </thead>
              <tbody>
                {allocationData.map((item) => {
                  const revItem = revenueData.find((r) => r.platform === item.platform);
                  const revVal = revItem ? revItem.revenue : 0;
                  const ratio = item.budget > 0 ? (revVal / item.budget).toFixed(2) : "—";
                  return (
                    <tr key={item.platform}>
                      <td>
                        <div className="platform-cell">
                          <span
                            className="platform-dot"
                            style={{ background: item.color }}
                          />
                          <span className="platform-name">{item.platform}</span>
                        </div>
                      </td>
                      <td>
                        <strong>₹{item.budget.toLocaleString("en-IN")}</strong>
                      </td>
                      <td>
                        <div className="share-cell">
                          <span>{item.percentage}%</span>
                          <div className="share-bar-bg">
                            <div
                              className="share-bar-fill"
                              style={{ width: `${item.percentage}%`, background: item.color }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="emerald-cell">
                        <strong>₹{revVal.toLocaleString("en-IN")}</strong>
                      </td>
                      <td>
                        <span className="ratio-tag">{ratio}x</span>
                      </td>
                      <td>
                        <span className="status-pill status-optimal">
                          <CheckCircle size={12} /> Bound Respected
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights & Strategic Findings */}
      <div className="card insights-card">
        <div className="insights-header">
          <div className="insights-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="card-title">AI Engine Strategic Insights</h3>
            <p className="card-subtitle">
              Derived from Gradient Boosting response curves and SLSQP constrained minimization
            </p>
          </div>
        </div>

        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-num">01</div>
            <div>
              <div className="insight-title">Platform Response Saturation</div>
              <p className="insight-text">
                The logarithmic response curves indicate diminishing marginal returns at higher budgets.
                The optimizer distributes capital across platforms to maximize the aggregate return curve.
              </p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-num">02</div>
            <div>
              <div className="insight-title">Market Specificity ({market})</div>
              <p className="insight-text">
                {market === "India"
                  ? "In the Indian market, regulatory parameters exclude TikTok. Budget is distributed between Google Ads and Meta Ads with feasible bounds of ₹10,000 to ₹40,000."
                  : "In Global campaigns, capital is distributed across Google Ads, Meta Ads, and TikTok Ads within the global feasible envelope of ₹15,000 to ₹60,000."}
              </p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-num">03</div>
            <div>
              <div className="insight-title">Authoritative Revenue Modeling</div>
              <p className="insight-text">
                Predictions reflect pre-campaign feature modeling and fitted nonlinear parameters (α, β, γ).
                All financial figures are direct outputs from the backend ML system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
