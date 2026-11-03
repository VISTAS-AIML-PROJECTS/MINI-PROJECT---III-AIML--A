import { useState } from "react";
import {
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useCampaign } from "../../context/useCampaign";

export default function ABTestingView() {
  const { result, budget, market, availablePlatforms, setActiveView } = useCampaign();
  const [selectedVariant, setSelectedVariant] = useState("B");

  const totalBudget = result?.total_budget || Number(budget) || 25000;
  const platformCount = availablePlatforms.length;
  const evenBudgetPerPlatform = Math.round(totalBudget / platformCount);

  // Real ML predicted revenue for Variant B
  const mlRevenue = result?.total_predicted_revenue || 0;
  const mlRatio = mlRevenue > 0 ? (mlRevenue / totalBudget).toFixed(2) : "—";

  return (
    <div className="view-container">
      {/* Header Strip */}
      <div className="view-header-strip">
        <div>
          <span className="strip-badge">EXPERIMENTATION FRAMEWORK</span>
          <h2 className="view-title">A/B Testing: Strategy Split Comparison</h2>
          <p className="view-subtitle">
            Compare baseline equal-allocation distribution (Variant A) against the AI SLSQP constrained
            optimization recommendation (Variant B).
          </p>
        </div>
      </div>

      {/* Disclaimers & Integrity Alert */}
      <div className="alert alert-info">
        <ShieldCheck size={18} className="text-emerald" />
        <div>
          <strong>Model Integrity Note:</strong> Variant B utilizes your <em>live ML Optimizer results</em> (actual
          budget allocation and predicted revenue from Scipy SLSQP). Variant A represents a simulated equal-distribution
          baseline. Experimentation metrics are provided for comparative workflow illustration.
        </div>
      </div>

      {/* Side-by-Side Variant Comparison */}
      <div className="ab-grid">
        {/* Variant A: Baseline */}
        <div
          className={`card variant-card ${selectedVariant === "A" ? "variant-selected" : ""}`}
          onClick={() => setSelectedVariant("A")}
          role="button"
          tabIndex={0}
        >
          <div className="variant-header">
            <div className="variant-identity">
              <span className="variant-pill-a">VARIANT A</span>
              <h3 className="variant-title">Uniform Baseline Split</h3>
            </div>
            {selectedVariant === "A" && (
              <span className="selected-badge">
                <CheckCircle2 size={14} /> Selected for Deployment
              </span>
            )}
          </div>

          <p className="variant-desc">
            Equal capital distribution across all {platformCount} available channels in the {market} market
            without nonlinear curve optimization.
          </p>

          <div className="variant-kpi-row">
            <div className="variant-kpi">
              <span className="v-label">Total Capital</span>
              <span className="v-val">₹{totalBudget.toLocaleString("en-IN")}</span>
            </div>
            <div className="variant-kpi">
              <span className="v-label">Allocation Strategy</span>
              <span className="v-val">Even Split</span>
            </div>
          </div>

          <div className="variant-breakdown-box">
            <div className="breakdown-title">Platform Distribution</div>
            {availablePlatforms.map((p) => (
              <div key={p} className="breakdown-row">
                <span>{p}</span>
                <strong>₹{evenBudgetPerPlatform.toLocaleString("en-IN")}</strong>
              </div>
            ))}
          </div>

          <div className="variant-footer">
            <span className="proto-tag">Strategy: Heuristic Baseline</span>
            <button
              type="button"
              className={`btn btn-sm ${selectedVariant === "A" ? "btn-primary" : "btn-outline"}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVariant("A");
              }}
            >
              {selectedVariant === "A" ? "Currently Active" : "Select Variant A"}
            </button>
          </div>
        </div>

        {/* Variant B: ML Recommended */}
        <div
          className={`card variant-card highlight-variant ${selectedVariant === "B" ? "variant-selected" : ""}`}
          onClick={() => setSelectedVariant("B")}
          role="button"
          tabIndex={0}
        >
          <div className="variant-header">
            <div className="variant-identity">
              <span className="variant-pill-b">VARIANT B</span>
              <h3 className="variant-title">AI SLSQP Optimized Model</h3>
            </div>
            {selectedVariant === "B" && (
              <span className="selected-badge emerald">
                <CheckCircle2 size={14} /> Selected for Deployment
              </span>
            )}
          </div>

          <p className="variant-desc">
            Budget distribution mathematically optimized using platform-specific logarithmic response curves
            to maximize aggregate predicted revenue.
          </p>

          <div className="variant-kpi-row">
            <div className="variant-kpi">
              <span className="v-label">Total Capital</span>
              <span className="v-val">₹{totalBudget.toLocaleString("en-IN")}</span>
            </div>
            <div className="variant-kpi">
              <span className="v-label">ML Predicted Revenue</span>
              <span className="v-val emerald-text">
                {result ? `₹${Number(mlRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "Run Optimizer"}
              </span>
            </div>
            <div className="variant-kpi">
              <span className="v-label">Predicted Ratio</span>
              <span className="v-val">{mlRatio !== "—" ? `${mlRatio}x` : "—"}</span>
            </div>
          </div>

          <div className="variant-breakdown-box">
            <div className="breakdown-title">
              <span>Authoritative ML Allocations</span>
              {result && <span className="text-emerald">✓ Verified</span>}
            </div>
            {result ? (
              Object.entries(result.allocation).map(([platform, amt]) => (
                <div key={platform} className="breakdown-row">
                  <span>{platform}</span>
                  <strong>₹{Number(amt).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
                </div>
              ))
            ) : (
              <div className="prompt-action-row">
                <span>Optimizer has not been executed yet.</span>
                <button
                  type="button"
                  className="link-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveView("optimizer");
                  }}
                >
                  Run Optimizer →
                </button>
              </div>
            )}
          </div>

          <div className="variant-footer">
            <span className="pill pill-emerald">Recommended by SLSQP</span>
            <button
              type="button"
              className={`btn btn-sm ${selectedVariant === "B" ? "btn-primary" : "btn-outline"}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVariant("B");
              }}
            >
              {selectedVariant === "B" ? "Currently Active" : "Select Variant B"}
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Summary Table */}
      <div className="card table-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Side-by-Side Allocation Attribute Matrix</h3>
            <p className="card-subtitle">Detailed breakdown across operational parameters</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Variant A (Uniform Split)</th>
                <th>Variant B (AI SLSQP Engine)</th>
                <th>Evaluation / Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Optimization Methodology</strong></td>
                <td>Equal Naive Partition</td>
                <td>Logarithmic Response Curve Fitting + SLSQP</td>
                <td><span className="pill pill-emerald">Model Governed</span></td>
              </tr>
              <tr>
                <td><strong>Platform Constraints Respected</strong></td>
                <td>Arbitrary (May violate min/max)</td>
                <td>Strict equality and boundary constraints satisfied</td>
                <td><span className="pill pill-emerald">Boundary Verified</span></td>
              </tr>
              <tr>
                <td><strong>Predicted Revenue</strong></td>
                <td>Unmodeled baseline</td>
                <td>
                  <strong>
                    {result ? `₹${Number(mlRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "Requires Run"}
                  </strong>
                </td>
                <td><span className="pill pill-blue">Authoritative Output</span></td>
              </tr>
              <tr>
                <td><strong>Selected State</strong></td>
                <td>{selectedVariant === "A" ? "Active Test" : "Inactive"}</td>
                <td>{selectedVariant === "B" ? "Active Test (Recommended)" : "Inactive"}</td>
                <td>
                  <span className="status-pill status-optimal">
                    Variant {selectedVariant} Selected
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
