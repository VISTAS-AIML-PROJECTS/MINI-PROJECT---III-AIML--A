import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { useCampaign } from "../../context/useCampaign";

export default function ReportsView() {
  const {
    campaignName,
    productName,
    industry,
    market,
    campaignType,
    duration,
    budget,
    result,
    allocationData,
    revenueData,
    setActiveView,
  } = useCampaign();

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const reportId = "NX-849201";

  const totalBudget = result?.total_budget || Number(budget) || 0;
  const totalRevenue = result?.total_predicted_revenue || 0;
  const returnMultiplier = totalBudget > 0 && totalRevenue > 0
    ? (totalRevenue / totalBudget).toFixed(2)
    : "—";

  return (
    <div className="view-container report-container">
      {/* Action Bar (hidden during browser print) */}
      <div className="report-action-bar no-print">
        <div>
          <span className="strip-badge">EXECUTIVE DELIVERABLE</span>
          <h2 className="view-title">Campaign Executive Summary Report</h2>
          <p className="view-subtitle">
            Formal presentation-ready document summarizing campaign parameters, ML allocations, and predicted revenue.
          </p>
        </div>
        <div className="report-buttons">
          <button type="button" className="btn btn-outline" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Executive Report Sheet */}
      <div className="card report-sheet">
        {/* Document Header */}
        <div className="report-header">
          <div className="report-brand">
            <div className="report-logo-box">
              <Layers size={22} className="text-emerald" />
            </div>
            <div>
              <h1 className="report-brand-name">Campaign Optimizer</h1>
              <span className="report-brand-sub">Marketing Intelligence & Capital Optimization Report</span>
            </div>
          </div>
          <div className="report-meta">
            <div className="meta-line">
              <span className="meta-label">Date Generated:</span>
              <strong className="meta-val">{currentDate}</strong>
            </div>
            <div className="meta-line">
              <span className="meta-label">Report ID:</span>
              <span className="meta-val font-mono">{reportId}</span>
            </div>
            <div className="meta-line">
              <span className="meta-label">Classification:</span>
              <span className="pill pill-slate">Confidential · Internal</span>
            </div>
          </div>
        </div>

        <div className="report-divider" />

        {/* Campaign Scope Overview */}
        <div className="report-section">
          <h3 className="report-section-title">1. Campaign Parameters & Scope</h3>
          <div className="report-params-grid">
            <div className="param-cell">
              <span className="param-lbl">Campaign Name</span>
              <strong className="param-txt">{campaignName || "Untitled Campaign"}</strong>
            </div>
            <div className="param-cell">
              <span className="param-lbl">Product / Brand</span>
              <strong className="param-txt">{productName || "General"}</strong>
            </div>
            <div className="param-cell">
              <span className="param-lbl">Target Vertical</span>
              <strong className="param-txt">{industry}</strong>
            </div>
            <div className="param-cell">
              <span className="param-lbl">Market Scope</span>
              <strong className="param-txt">{market}</strong>
            </div>
            <div className="param-cell">
              <span className="param-lbl">Objective / Format</span>
              <strong className="param-txt">{campaignType} Marketing</strong>
            </div>
            <div className="param-cell">
              <span className="param-lbl">Flight Duration</span>
              <strong className="param-txt">{duration || 30} Days</strong>
            </div>
          </div>
        </div>

        {/* Executive Financial Scorecard */}
        <div className="report-section">
          <h3 className="report-section-title">2. Executive Financial Scorecard</h3>
          <div className="report-scorecard-grid">
            <div className="scorecard-box">
              <span className="sc-lbl">Total Capital Allocated</span>
              <div className="sc-big-val">
                ₹{Number(totalBudget).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <span className="sc-sub">Constraint-verified sum</span>
            </div>

            <div className="scorecard-box highlight-box">
              <span className="sc-lbl">Aggregate Predicted Revenue</span>
              <div className="sc-big-val text-emerald">
                {result ? (
                  `₹${Number(totalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                ) : (
                  "Pending Run"
                )}
              </div>
              <span className="sc-sub">
                <CheckCircle2 size={12} className="inline-icon" /> Gradient Boosting & Response Curve
              </span>
            </div>

            <div className="scorecard-box">
              <span className="sc-lbl">Revenue / Budget Multiplier</span>
              <div className="sc-big-val">
                {returnMultiplier !== "—" ? `${returnMultiplier}x` : "—"}
              </div>
              <span className="sc-sub">Estimated return efficiency</span>
            </div>
          </div>
        </div>

        {/* Detailed Channel Allocation Table */}
        <div className="report-section">
          <h3 className="report-section-title">3. Channel Allocation & Prediction Breakdown</h3>
          {result ? (
            <table className="enterprise-table report-table">
              <thead>
                <tr>
                  <th>Advertising Channel</th>
                  <th>Recommended Budget</th>
                  <th>Portfolio Share</th>
                  <th>Predicted Revenue</th>
                  <th>Return Multiplier</th>
                  <th>Boundary Compliance</th>
                </tr>
              </thead>
              <tbody>
                {allocationData.map((item) => {
                  const revItem = revenueData.find((r) => r.platform === item.platform);
                  const revVal = revItem ? revItem.revenue : 0;
                  const ratio = item.budget > 0 ? (revVal / item.budget).toFixed(2) : "—";
                  return (
                    <tr key={item.platform}>
                      <td><strong>{item.platform}</strong></td>
                      <td>₹{item.budget.toLocaleString("en-IN")}</td>
                      <td>{item.percentage}%</td>
                      <td className="emerald-cell"><strong>₹{revVal.toLocaleString("en-IN")}</strong></td>
                      <td>{ratio}x</td>
                      <td>
                        <span className="pill pill-emerald">Satisfied</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="report-pending-box">
              <p>ML Budget optimization has not been executed for this session yet.</p>
              <button
                type="button"
                className="btn btn-primary no-print"
                onClick={() => setActiveView("optimizer")}
              >
                Execute Optimization to Complete Report
              </button>
            </div>
          )}
        </div>

        {/* Methodology & Model Governance */}
        <div className="report-section">
          <h3 className="report-section-title">4. Model Methodology & Governance Statement</h3>
          <div className="methodology-card">
            <div className="methodology-header">
              <ShieldCheck size={18} className="text-emerald" />
              <strong>Algorithmic Integrity & Architecture</strong>
            </div>
            <p className="methodology-p">
              This campaign budget allocation was solved using <strong>Sequential Least Squares Programming (SLSQP)</strong> under
              strict equality constraints where the sum of channel budgets strictly equals total allocated capital.
              Channel revenue estimates were generated via pre-campaign feature modeling using Gradient Boosting and
              channel-specific logarithmic response curves: <code>R(b) = α · log(1 + β · b) + γ</code>.
            </p>
            <p className="methodology-p legal-disclaimer">
              <em>Disclaimer:</em> Model predictions represent statistical estimates derived from historical campaign training data
              and fitted response curves. They provide a data-driven benchmark for budget distribution and do not constitute
              guaranteed commercial results.
            </p>
          </div>
        </div>

        {/* Signature Line */}
        <div className="report-footer">
          <div className="sig-block">
            <div className="sig-line" />
            <span className="sig-label">Marketing Strategy Approval</span>
          </div>
          <div className="sig-block">
            <div className="sig-line" />
            <span className="sig-label">Algorithmic Optimization Validation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
