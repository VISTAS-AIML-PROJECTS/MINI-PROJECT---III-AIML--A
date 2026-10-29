import {
  Cpu,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Database,
  LineChart as LineChartIcon,
  Maximize2,
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
import { PLATFORM_COLORS } from "../../constants/campaign";

export default function OptimizerView() {
  const {
    budget,
    setBudget,
    market,
    result,
    loading,
    error,
    minBudget,
    maxBudget,
    optimizeBudget,
    allocationData,
    revenueData,
    industry,
  } = useCampaign();

  const handleOptimize = (e) => {
    e.preventDefault();
    optimizeBudget();
  };

  return (
    <div className="view-container">
      {/* Header Banner */}
      <div className="view-header-strip">
        <div>
          <span className="strip-badge badge-emerald">SLSQP CONSTRAINED OPTIMIZER</span>
          <h2 className="view-title">AI Budget Allocation Engine</h2>
          <p className="view-subtitle">
            Direct interface to the FastAPI constrained optimization model. Formulates budget distribution
            as a nonlinear programming problem solved via Sequential Least Squares Programming.
          </p>
        </div>
      </div>

      {/* Optimizer Input Form Card */}
      <div className="card optimizer-input-card">
        <form onSubmit={handleOptimize} className="optimizer-form">
          <div className="optimizer-form-left">
            <div className="optimizer-param-row">
              <span className="optimizer-param-label">Active Market Scope:</span>
              <span className="pill pill-blue">{market}</span>
              <span className="text-muted">•</span>
              <span className="optimizer-param-label">Target Vertical:</span>
              <span className="pill pill-slate">{industry}</span>
              <span className="text-muted">•</span>
              <span className="optimizer-param-label">Feasible Budget Envelope:</span>
              <span className="pill pill-slate">
                ₹{minBudget.toLocaleString("en-IN")} – ₹{maxBudget.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="optimizer-input-row">
              <label htmlFor="budgetInput" className="input-label-bold">
                Total Campaign Capital to Allocate
              </label>
              <div className="optimizer-input-group">
                <span className="input-symbol">₹</span>
                <input
                  id="budgetInput"
                  type="number"
                  className="optimizer-main-input"
                  placeholder={market === "India" ? "25000" : "40000"}
                  min={minBudget}
                  max={maxBudget}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-optimizer"
                  disabled={loading}
                >
                  <Sparkles size={16} />
                  <span>{loading ? "Running SLSQP Optimizer..." : "Optimize Allocation"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {error && (
          <div className="alert alert-error" style={{ marginTop: "1rem" }}>
            <AlertCircle size={18} />
            <div>
              <strong>Optimization Notice:</strong> {error}
            </div>
          </div>
        )}
      </div>

      {/* Actual Optimizer Results */}
      {result && (
        <div className="optimizer-results-section">
          {/* Result Banner */}
          <div className="card verified-result-banner">
            <div className="banner-left">
              <div className="banner-icon-box">
                <ShieldCheck size={28} className="text-emerald" />
              </div>
              <div>
                <div className="banner-tag">Optimization Complete</div>
                <h3 className="banner-title">
                  Recommended Allocation: ₹{Number(result.total_budget).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </h3>
                <p className="banner-desc">
                  Optimized across {Object.keys(result.allocation).length} channels with predicted total revenue of{" "}
                  <strong>
                    ₹{Number(result.total_predicted_revenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </strong>
                </p>
              </div>
            </div>
            <div className="banner-right">
              <div className="stat-pill-metric">
                <span className="pill-metric-label">Predicted Return Ratio</span>
                <span className="pill-metric-value">
                  {(result.total_predicted_revenue / result.total_budget).toFixed(2)}x
                </span>
              </div>
            </div>
          </div>

          {/* Platform Allocation Cards */}
          <div className="platform-cards-grid">
            {Object.entries(result.allocation).map(([platform, amount]) => {
              const numAmount = Number(amount);
              const numRevenue = Number(result.predicted_revenue[platform] || 0);
              const pct = ((numAmount / result.total_budget) * 100).toFixed(1);
              const ratio = (numRevenue / numAmount).toFixed(2);
              const color = PLATFORM_COLORS[platform] || "#0d9488";

              return (
                <div key={platform} className="card platform-result-card">
                  <div className="platform-card-header">
                    <div className="platform-name-wrap">
                      <span className="platform-swatch" style={{ background: color }} />
                      <h4 className="platform-card-title">{platform}</h4>
                    </div>
                    <span className="pill pill-slate">{pct}% share</span>
                  </div>

                  <div className="platform-card-body">
                    <div className="metric-row">
                      <span className="metric-label">Recommended Allocation</span>
                      <strong className="metric-amount">
                        ₹{numAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </strong>
                    </div>

                    <div className="allocation-progress-bar">
                      <div
                        className="allocation-progress-fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>

                    <div className="metric-divider" />

                    <div className="metric-row">
                      <span className="metric-label">Predicted Revenue</span>
                      <span className="metric-rev-amount">
                        ₹{numRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="metric-row">
                      <span className="metric-label">Revenue / Budget Ratio</span>
                      <span className="ratio-tag">{ratio}x</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="dashboard-grid">
            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recommended Distribution</h3>
                  <p className="card-subtitle">Platform allocation shares</p>
                </div>
                <span className="pill pill-emerald">ML Output</span>
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
                        "Allocated",
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
                      <strong className="legend-amt">₹{item.budget.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Predicted Channel Revenue</h3>
                  <p className="card-subtitle">Estimated return from response curves</p>
                </div>
                <span className="pill pill-blue">Authoritative</span>
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
                        "Revenue",
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-bottom-info">
                <span className="chart-info-note">
                  Equality Constraint: Sum of allocations = ₹{Number(result.total_budget).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Constraints & Bounds Reference Matrix */}
      <div className="card constraints-table-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Platform Constraint Parameters & Bound Limits</h3>
            <p className="card-subtitle">
              Optimization bounds hard-coded into the SLSQP objective function for {market}
            </p>
          </div>
          <span className="pill pill-slate">scipy.optimize.minimize</span>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Minimum Bound</th>
                <th>Maximum Bound</th>
                <th>Fitted Curve Formulation</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Google Ads</strong></td>
                <td>₹5,000</td>
                <td>₹25,000</td>
                <td><code>α·log(1 + β·b) + γ</code> (α=38,833, β=0.000157)</td>
                <td>
                  <span className="status-pill status-optimal">
                    <CheckCircle2 size={12} /> Active Bound
                  </span>
                </td>
              </tr>
              <tr>
                <td><strong>Meta Ads</strong></td>
                <td>₹5,000</td>
                <td>₹15,000</td>
                <td><code>α·log(1 + β·b) + γ</code> (α=21,685, β=0.000551)</td>
                <td>
                  <span className="status-pill status-optimal">
                    <CheckCircle2 size={12} /> Active Bound
                  </span>
                </td>
              </tr>
              {market === "Global" ? (
                <tr>
                  <td><strong>TikTok Ads</strong></td>
                  <td>₹5,000</td>
                  <td>₹20,000</td>
                  <td><code>α·log(1 + β·b) + γ</code> (α=125,092, β=0.000061)</td>
                  <td>
                    <span className="status-pill status-optimal">
                      <CheckCircle2 size={12} /> Active Bound
                    </span>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td><strong>TikTok Ads</strong></td>
                  <td>Excluded</td>
                  <td>Excluded</td>
                  <td>Unavailable in Indian market geography</td>
                  <td>
                    <span className="status-pill status-excluded">
                      Excluded (India)
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI System Architecture Flow */}
      <div className="card architecture-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">End-to-End AI System Architecture</h3>
            <p className="card-subtitle">
              How the machine learning model, curve fitting, and SLSQP optimizer interact
            </p>
          </div>
        </div>

        <div className="pipeline-flow-grid">
          <div className="pipeline-step-card">
            <div className="pipeline-step-badge">01</div>
            <div className="pipeline-step-icon"><Database size={20} /></div>
            <h4 className="pipeline-step-title">Historical Data</h4>
            <p className="pipeline-step-desc">
              Analyzes historical multi-channel performance, industry features, timing, and pre-campaign context.
            </p>
          </div>

          <div className="pipeline-connector">→</div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-badge">02</div>
            <div className="pipeline-step-icon"><LineChartIcon size={20} /></div>
            <h4 className="pipeline-step-title">Revenue Prediction</h4>
            <p className="pipeline-step-desc">
              Gradient Boosting ML model predicts baseline revenue expectations strictly using pre-campaign features.
            </p>
          </div>

          <div className="pipeline-connector">→</div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-badge">03</div>
            <div className="pipeline-step-icon"><Cpu size={20} /></div>
            <h4 className="pipeline-step-title">Response Curves</h4>
            <p className="pipeline-step-desc">
              Platform-specific logarithmic response curves model diminishing marginal returns as budget scales.
            </p>
          </div>

          <div className="pipeline-connector">→</div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-badge">04</div>
            <div className="pipeline-step-icon"><Maximize2 size={20} /></div>
            <h4 className="pipeline-step-title">SLSQP Optimization</h4>
            <p className="pipeline-step-desc">
              Scipy SLSQP minimizer maximizes total return under strict budget equality and platform min/max bounds.
            </p>
          </div>

          <div className="pipeline-connector">→</div>

          <div className="pipeline-step-card final-step-card">
            <div className="pipeline-step-badge">05</div>
            <div className="pipeline-step-icon text-emerald"><ShieldCheck size={20} /></div>
            <h4 className="pipeline-step-title">Optimal Allocation</h4>
            <p className="pipeline-step-desc">
              Delivers mathematically optimal capital distribution and channel-by-channel predicted revenue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
