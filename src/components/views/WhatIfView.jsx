import {
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useCampaign } from "../../context/useCampaign";

export default function WhatIfView() {
  const {
    market,
    minBudget,
    maxBudget,
    result,
    whatIfBudget,
    setWhatIfBudget,
    whatIfResult,
    whatIfLoading,
    whatIfError,
    analyzeWhatIf,
    revenueChange,
    setActiveView,
  } = useCampaign();

  const handleRunSimulation = (e) => {
    e.preventDefault();
    analyzeWhatIf();
  };

  const currentTotalBudget = result?.total_budget || 0;
  const currentTotalRevenue = result?.total_predicted_revenue || 0;

  const whatIfTotalBudget = whatIfResult?.total_budget || Number(whatIfBudget) || 0;
  const whatIfTotalRevenue = whatIfResult?.total_predicted_revenue || 0;

  const isPositiveChange = revenueChange >= 0;

  return (
    <div className="view-container">
      {/* Header Strip */}
      <div className="view-header-strip">
        <div>
          <span className="strip-badge">SCENARIO MODELING</span>
          <h2 className="view-title">What-If Budget Sensitivity Analysis</h2>
          <p className="view-subtitle">
            Simulate how modifying your campaign capital envelope alters the SLSQP recommended allocation
            and the model's aggregate predicted revenue.
          </p>
        </div>
      </div>

      {/* Disclaimers & Integrity Alert */}
      <div className="alert alert-info">
        <ShieldCheck size={18} className="text-emerald" />
        <div>
          <strong>Live ML Query Engine:</strong> Clicking "Run What-If Simulation" sends a real request
          to <code>POST https://campaign-budget-optimizer.onrender.com/optimize</code> with your hypothetical budget. Both scenarios
          are solved by the actual Scipy SLSQP optimizer.
        </div>
      </div>

      {!result && (
        <div className="card notice-prompt-card">
          <AlertCircle size={22} className="text-blue" />
          <div className="notice-prompt-content">
            <h4>No Baseline Campaign Optimized Yet</h4>
            <p>
              Run the primary budget optimization first so you can compare the baseline scenario
              against your hypothetical what-if budget.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveView("optimizer")}
          >
            Run Baseline Optimizer
          </button>
        </div>
      )}

      {/* Simulation Input Card */}
      <div className="card optimizer-input-card">
        <form onSubmit={handleRunSimulation} className="optimizer-form">
          <div className="optimizer-form-left">
            <div className="optimizer-param-row">
              <span className="optimizer-param-label">Active Market:</span>
              <span className="pill pill-blue">{market}</span>
              <span className="text-muted">•</span>
              <span className="optimizer-param-label">Feasible Range:</span>
              <span className="pill pill-slate">
                ₹{minBudget.toLocaleString("en-IN")} – ₹{maxBudget.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="optimizer-input-row">
              <label htmlFor="whatIfInput" className="input-label-bold">
                Hypothetical / Alternative Budget to Test
              </label>
              <div className="optimizer-input-group">
                <span className="input-symbol">₹</span>
                <input
                  id="whatIfInput"
                  type="number"
                  className="optimizer-main-input"
                  placeholder={market === "India" ? "35000" : "50000"}
                  min={minBudget}
                  max={maxBudget}
                  value={whatIfBudget}
                  onChange={(e) => setWhatIfBudget(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-optimizer"
                  disabled={whatIfLoading}
                >
                  <Sparkles size={16} />
                  <span>{whatIfLoading ? "Simulating with ML..." : "Run What-If Simulation"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {whatIfError && (
          <div className="alert alert-error" style={{ marginTop: "1rem" }}>
            <AlertCircle size={18} />
            <div>
              <strong>Simulation Error:</strong> {whatIfError}
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Scenario Comparison */}
      {result && whatIfResult && (
        <div className="whatif-results-section">
          {/* Comparison Scorecards */}
          <div className="scenario-comparison-grid">
            {/* Current Baseline Card */}
            <div className="card scenario-card baseline-scenario">
              <div className="scenario-header">
                <span className="scenario-tag">BASELINE SCENARIO</span>
                <span className="pill pill-slate">Active Plan</span>
              </div>
              <div className="scenario-budget-metric">
                <span className="sc-label">Total Capital</span>
                <strong className="sc-val">
                  ₹{Number(currentTotalBudget).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </strong>
              </div>
              <div className="scenario-rev-metric">
                <span className="sc-label">Predicted Revenue</span>
                <strong className="sc-rev-val">
                  ₹{Number(currentTotalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </strong>
              </div>
              <div className="scenario-ratio">
                Return Multiplier: <strong>{(currentTotalRevenue / currentTotalBudget).toFixed(2)}x</strong>
              </div>
            </div>

            {/* Delta Connector */}
            <div className="scenario-arrow-connector">
              <div className={`delta-circle ${isPositiveChange ? "delta-pos" : "delta-neg"}`}>
                {isPositiveChange ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
              </div>
              <span className="delta-label">
                {isPositiveChange ? "+" : ""}
                ₹{Math.abs(Math.round(revenueChange)).toLocaleString("en-IN")}
              </span>
              <span className="delta-sub">Estimated Revenue Impact</span>
            </div>

            {/* What-If Card */}
            <div className="card scenario-card whatif-scenario">
              <div className="scenario-header">
                <span className="scenario-tag whatif-tag">SIMULATED SCENARIO</span>
                <span className="pill pill-emerald">Hypothetical</span>
              </div>
              <div className="scenario-budget-metric">
                <span className="sc-label">Alternative Capital</span>
                <strong className="sc-val">
                  ₹{Number(whatIfTotalBudget).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </strong>
              </div>
              <div className="scenario-rev-metric">
                <span className="sc-label">Simulated Predicted Revenue</span>
                <strong className="sc-rev-val emerald-text">
                  ₹{Number(whatIfTotalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </strong>
              </div>
              <div className="scenario-ratio">
                Return Multiplier: <strong>{(whatIfTotalRevenue / whatIfTotalBudget).toFixed(2)}x</strong>
              </div>
            </div>
          </div>

          {/* Allocation Shift Table */}
          <div className="card table-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Channel-by-Channel Allocation Shift</h3>
                <p className="card-subtitle">
                  How the SLSQP optimizer redistributes capital between the baseline and what-if budgets
                </p>
              </div>
              <span className="pill pill-emerald">Live API Compared</span>
            </div>

            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Current Allocation</th>
                    <th>What-If Allocation</th>
                    <th>Capital Shift (Δ)</th>
                    <th>Predicted Baseline Rev</th>
                    <th>What-If Predicted Rev</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.allocation).map(([platform, currentAmt]) => {
                    const whatIfAmt = whatIfResult.allocation[platform] || 0;
                    const diff = Number(whatIfAmt) - Number(currentAmt);
                    const currentRev = Number(result.predicted_revenue[platform] || 0);
                    const whatIfRev = Number(whatIfResult.predicted_revenue[platform] || 0);

                    return (
                      <tr key={platform}>
                        <td><strong>{platform}</strong></td>
                        <td>₹{Number(currentAmt).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                        <td>
                          <strong>₹{Number(whatIfAmt).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
                        </td>
                        <td>
                          <span className={`diff-pill ${diff >= 0 ? "diff-plus" : "diff-minus"}`}>
                            {diff >= 0 ? "+" : ""}
                            ₹{Number(diff).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </span>
                        </td>
                        <td>₹{currentRev.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                        <td className="emerald-cell">
                          <strong>₹{whatIfRev.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
