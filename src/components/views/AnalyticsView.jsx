import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useCampaign } from "../../context/useCampaign";

export default function AnalyticsView() {
  const { result, budget, market, revenueData, allocationData, setActiveView } = useCampaign();

  const totalBudget = result?.total_budget || Number(budget) || 0;
  const totalRevenue = result?.total_predicted_revenue || 0;
  const returnMultiplier = totalBudget > 0 && totalRevenue > 0
    ? (totalRevenue / totalBudget).toFixed(2)
    : "—";

  // Comparison dataset: Allocated budget vs Predicted Revenue side-by-side
  const comparisonChartData = result
    ? Object.entries(result.allocation).map(([platform, amt]) => {
        const rev = result.predicted_revenue[platform] || 0;
        return {
          platform: platform.replace(" Ads", ""),
          Allocated: Math.round(Number(amt)),
          PredictedRevenue: Math.round(Number(rev)),
        };
      })
    : [];

  return (
    <div className="view-container">
      {/* Header Strip */}
      <div className="view-header-strip">
        <div>
          <span className="strip-badge">ANALYTICS & MODEL INTELLIGENCE</span>
          <h2 className="view-title">Cross-Platform Efficiency Analytics</h2>
          <p className="view-subtitle">
            Evaluate capital deployment efficiency and revenue response curves across advertising channels.
          </p>
        </div>
      </div>

      {/* Disclaimers & Integrity Alert */}
      <div className="alert alert-info">
        <ShieldCheck size={18} className="text-emerald" />
        <div>
          <strong>Authoritative Data Integrity:</strong> Financial allocations, revenue figures, and return
          multipliers shown below are direct mathematical outputs from the <strong>FastAPI SLSQP optimization model</strong>.
          Industry benchmark indicators are tagged as <code>[Demo Benchmark]</code>.
        </div>
      </div>

      {/* Core Authoritative KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">TOTAL ALLOCATED CAPITAL</span>
            <span className="kpi-icon-wrap teal"><DollarSign size={16} /></span>
          </div>
          <div className="kpi-value">
            ₹{Number(totalBudget).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="kpi-footer">
            <span className="pill pill-slate">Equality Constrained</span>
            <span className="kpi-subtext">Market: {market}</span>
          </div>
        </div>

        <div className="kpi-card highlight-card">
          <div className="kpi-header">
            <span className="kpi-label">AGGREGATE PREDICTED REVENUE</span>
            <span className="kpi-icon-wrap green"><TrendingUp size={16} /></span>
          </div>
          <div className="kpi-value emerald-text">
            {result ? (
              `₹${Number(totalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
            ) : (
              <span className="placeholder-text">Awaiting Optimizer</span>
            )}
          </div>
          <div className="kpi-footer">
            <span className="pill pill-emerald">
              <CheckCircle2 size={12} /> ML Model Prediction
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">PREDICTED RETURN MULTIPLIER</span>
            <span className="kpi-icon-wrap blue"><Activity size={16} /></span>
          </div>
          <div className="kpi-value">
            {returnMultiplier !== "—" ? `${returnMultiplier}x` : "—"}
          </div>
          <div className="kpi-footer">
            <span className="kpi-subtext">Revenue / Budget Ratio</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">INDUSTRY BENCHMARK CTR</span>
            <span className="kpi-icon-wrap purple"><HelpCircle size={16} /></span>
          </div>
          <div className="kpi-value">2.84%</div>
          <div className="kpi-footer">
            <span className="proto-tag">Demo Benchmark</span>
          </div>
        </div>
      </div>

      {/* Capital vs Revenue Grouped Bar Chart */}
      <div className="card chart-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Capital Allocation vs Predicted Revenue</h3>
            <p className="card-subtitle">
              Visualizing the nonlinear leverage generated per advertising platform
            </p>
          </div>
          <span className="pill pill-emerald">Live Optimizer Output</span>
        </div>

        {result ? (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={comparisonChartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="platform" stroke="#64748b" tick={{ fontSize: 13 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  formatter={(val, name) => [
                    `₹${Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
                    name === "Allocated" ? "Recommended Budget" : "Predicted Revenue",
                  ]}
                />
                <Legend
                  formatter={(value) => (value === "Allocated" ? "Recommended Budget" : "Predicted Revenue")}
                />
                <Bar dataKey="Allocated" fill="#2563eb" radius={[4, 4, 0, 0]} name="Allocated" />
                <Bar dataKey="PredictedRevenue" fill="#0d9488" radius={[4, 4, 0, 0]} name="PredictedRevenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-chart-notice">
            <AlertCircle size={28} className="text-muted" />
            <p>Run the Budget Optimizer to populate cross-platform comparison analytics.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveView("optimizer")}
            >
              Go to Budget Optimizer
            </button>
          </div>
        )}
      </div>

      {/* Platform Channel Detailed Analysis Table */}
      <div className="card table-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Channel Response & Efficiency Breakdown</h3>
            <p className="card-subtitle">
              Detailed metrics per channel reflecting fitted response parameters and model boundaries
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Allocated Capital</th>
                <th>Capital Share</th>
                <th>Predicted Revenue</th>
                <th>Revenue / Budget Multiplier</th>
                <th>Curve Characteristic</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {result ? (
                allocationData.map((item) => {
                  const revItem = revenueData.find((r) => r.platform === item.platform);
                  const revVal = revItem ? revItem.revenue : 0;
                  const ratio = item.budget > 0 ? (revVal / item.budget).toFixed(2) : "—";
                  return (
                    <tr key={item.platform}>
                      <td>
                        <div className="platform-cell">
                          <span className="platform-dot" style={{ background: item.color }} />
                          <span className="platform-name">{item.platform}</span>
                        </div>
                      </td>
                      <td><strong>₹{item.budget.toLocaleString("en-IN")}</strong></td>
                      <td>{item.percentage}%</td>
                      <td className="emerald-cell">
                        <strong>₹{revVal.toLocaleString("en-IN")}</strong>
                      </td>
                      <td><span className="ratio-tag">{ratio}x</span></td>
                      <td>
                        <span className="curve-note">
                          {item.platform === "Google Ads"
                            ? "Steady log growth (α=38.8k)"
                            : item.platform === "Meta Ads"
                            ? "High early responsiveness (β=0.00055)"
                            : "Broad scale reach (α=125k)"}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill status-optimal">
                          <CheckCircle2 size={12} /> ML Optimizer
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    Optimizer has not run yet. Values will display after running optimization.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
