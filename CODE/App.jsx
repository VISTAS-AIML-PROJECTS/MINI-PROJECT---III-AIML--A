import { useState } from "react";
import axios from "axios";
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
import "./App.css";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4"];

function App() {
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState(null);

  // Campaign configuration
  const [campaignName, setCampaignName] = useState("");
  const [productName, setProductName] = useState("");
  const [market, setMarket] = useState("India");
  const [industry, setIndustry] = useState("FMCG");
  const [campaignType, setCampaignType] = useState("Search");
  const [duration, setDuration] = useState("");
  const [revenueGoal, setRevenueGoal] = useState("");

  // What-if analysis
  const [whatIfBudget, setWhatIfBudget] = useState("");
  const [whatIfResult, setWhatIfResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [whatIfLoading, setWhatIfLoading] = useState(false);

  const [error, setError] = useState("");
  const [whatIfError, setWhatIfError] = useState("");

  // Market-specific budget limits
  const minBudget = market === "India" ? 10000 : 15000;
  const maxBudget = market === "India" ? 40000 : 60000;

  // Platforms available for each market
  const availablePlatforms =
    market === "India"
      ? ["Google Ads", "Meta Ads"]
      : ["Google Ads", "Meta Ads", "TikTok Ads"];

  // Product / Brand options based on industry
  const productOptions = {
    FMCG: [
      "Colgate",
      "Coca-Cola",
      "Pepsi",
      "Nestle",
      "Dove",
      "Unilever",
    ],

    "E-commerce": [
      "Amazon",
      "Flipkart",
      "Myntra",
      "Meesho",
      "Nykaa",
    ],

    Healthcare: [
      "Apollo",
      "PharmEasy",
      "Netmeds",
      "Tata 1mg",
    ],

    Fintech: [
      "PhonePe",
      "Paytm",
      "Razorpay",
      "CRED",
      "Groww",
    ],

    EdTech: [
      "Unacademy",
      "BYJU'S",
      "Coursera",
      "Udemy",
    ],

    SaaS: [
      "Zoho",
      "Freshworks",
      "Salesforce",
      "HubSpot",
    ],
  };

  // Optimize main campaign budget
  const optimizeBudget = async () => {
    const numericBudget = Number(budget);

    setError("");

    if (!budget) {
      setError("Please enter a campaign budget.");
      return;
    }

    if (numericBudget < minBudget || numericBudget > maxBudget) {
      setError(
        "Please enter a budget between Rs." +
          minBudget.toLocaleString("en-IN") +
          " and Rs." +
          maxBudget.toLocaleString("en-IN") +
          "."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/optimize",
        {
          total_budget: numericBudget,
          market: market,
        }
      );

      setResult(response.data);
      setWhatIfResult(null);
      setWhatIfError("");
    } catch (err) {
      setError(
        err.response?.data?.detail?.[0]?.msg ||
          "Something went wrong. Please try again."
      );
    }

    setLoading(false);
  };

  // What-if budget analysis
  const analyzeWhatIf = async () => {
    const numericBudget = Number(whatIfBudget);

    setWhatIfError("");

    if (!whatIfBudget) {
      setWhatIfError("Please enter another budget.");
      return;
    }

    if (numericBudget < minBudget || numericBudget > maxBudget) {
      setWhatIfError(
        "Please enter a budget between Rs." +
          minBudget.toLocaleString("en-IN") +
          " and Rs." +
          maxBudget.toLocaleString("en-IN") +
          "."
      );
      return;
    }

    setWhatIfLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/optimize",
        {
          total_budget: numericBudget,
          market: market,
        }
      );

      setWhatIfResult(response.data);
    } catch (err) {
      setWhatIfError(
        err.response?.data?.detail?.[0]?.msg ||
          "Something went wrong. Please try again."
      );
    }

    setWhatIfLoading(false);
  };

  // Change market
  const handleMarketChange = (event) => {
    const newMarket = event.target.value;

    setMarket(newMarket);

    // Clear previous results because platform availability changes
    setResult(null);
    setWhatIfResult(null);
    setError("");
    setWhatIfError("");
    setBudget("");
    setWhatIfBudget("");
  };

  // Change industry
  const handleIndustryChange = (event) => {
    const newIndustry = event.target.value;

    setIndustry(newIndustry);

    // Reset selected product when industry changes
    setProductName("");
  };

  // Allocation chart data
  const allocationData = result
    ? Object.entries(result.allocation).map(
        ([platform, amount]) => ({
          platform: platform.replace(" Ads", ""),
          budget: Number(amount),
        })
      )
    : [];

  // Revenue chart data
  const revenueData = result
    ? Object.entries(result.predicted_revenue).map(
        ([platform, revenue]) => ({
          platform: platform.replace(" Ads", ""),
          revenue: Number(revenue),
        })
      )
    : [];

  // What-if revenue difference
  const revenueChange =
    result && whatIfResult
      ? whatIfResult.total_predicted_revenue -
        result.total_predicted_revenue
      : 0;

  return (
    <div className="app">

      {/* HEADER */}
      <header className="hero">
        <div className="hero-content">

          <div className="badge">
            AI POWERED
          </div>

          <h1>
            Campaign Budget Optimizer
          </h1>

          <p>
            Intelligent budget allocation using historical campaign
            performance and constrained optimization.
          </p>

        </div>
      </header>

      <main>

        {/* CAMPAIGN CONFIGURATION */}
        <section className="input-section">

          <div className="section-label">
            CAMPAIGN CONFIGURATION
          </div>

          <h2>
            Set Up Your Campaign
          </h2>

          <p className="section-description">
            Configure your campaign details and budget before running
            the AI optimization system.
          </p>

          <div className="campaign-details">

            {/* Campaign Name */}
            <div className="campaign-field">
              <label>
                Campaign Name
              </label>

              <input
                type="text"
                placeholder="Summer Product Campaign"
                value={campaignName}
                onChange={(e) =>
                  setCampaignName(e.target.value)
                }
              />
            </div>

            {/* Product / Brand Dropdown */}
            <div className="campaign-field">

              <label>
                Product / Brand
              </label>

              <select
                value={productName}
                onChange={(e) =>
                  setProductName(e.target.value)
                }
              >

                <option value="">
                  Select a product / brand
                </option>

                {productOptions[industry].map(
                  (product) => (
                    <option
                      value={product}
                      key={product}
                    >
                      {product}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* Market */}
            <div className="campaign-field">

              <label>
                Market
              </label>

              <select
                value={market}
                onChange={handleMarketChange}
              >

                <option value="India">
                  India
                </option>

                <option value="Global">
                  Global
                </option>

              </select>

            </div>

            {/* Industry */}
            <div className="campaign-field">

              <label>
                Industry
              </label>

              <select
                value={industry}
                onChange={handleIndustryChange}
              >

                <option value="FMCG">
                  FMCG
                </option>

                <option value="E-commerce">
                  E-commerce
                </option>

                <option value="Healthcare">
                  Healthcare
                </option>

                <option value="Fintech">
                  Fintech
                </option>

                <option value="EdTech">
                  EdTech
                </option>

                <option value="SaaS">
                  SaaS
                </option>

              </select>

            </div>

            {/* Campaign Type */}
            <div className="campaign-field">

              <label>
                Campaign Type
              </label>

              <select
                value={campaignType}
                onChange={(e) =>
                  setCampaignType(e.target.value)
                }
              >

                <option value="Search">
                  Search
                </option>

                <option value="Display">
                  Display
                </option>

                <option value="Video">
                  Video
                </option>

                <option value="Shopping">
                  Shopping
                </option>

              </select>

            </div>

            {/* Duration */}
            <div className="campaign-field">

              <label>
                Duration
              </label>

              <input
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) =>
                  setDuration(e.target.value)
                }
                min="1"
              />

            </div>

            {/* Revenue Goal */}
            <div className="campaign-field">

              <label>
                Revenue Goal
              </label>

              <input
                type="number"
                placeholder="100000"
                value={revenueGoal}
                onChange={(e) =>
                  setRevenueGoal(e.target.value)
                }
                min="0"
              />

            </div>

          </div>

          {/* MARKET / PLATFORM INFORMATION */}
          <div className="market-platforms">

            <div>

              <span className="market-label">
                Selected Market
              </span>

              <strong>
                {market === "India"
                  ? "India"
                  : "Global"}
              </strong>

            </div>

            <div>

              <span className="market-label">
                Supported Platforms
              </span>

              <div className="platform-tags">

                {availablePlatforms.map(
                  (platform) => (
                    <span
                      className="platform-tag"
                      key={platform}
                    >
                      ✓ {platform}
                    </span>
                  )
                )}

              </div>

            </div>

          </div>

          {/* INDIA NOTICE */}
          {market === "India" && (
            <div className="market-note">

              <span>
                i
              </span>

              <p>
                TikTok is excluded from the India campaign
                configuration because it is not an available
                advertising platform in the Indian market.
              </p>

            </div>
          )}

          {/* BUDGET */}
          <div className="budget-heading">

            <h3>
              Campaign Budget
            </h3>

            <p>
              {market === "India"
                ? "India campaigns support a budget between Rs.10,000 and Rs.40,000."
                : "Global campaigns support a budget between Rs.15,000 and Rs.60,000."}
            </p>

          </div>

          <div className="input-row">

            <div className="input-wrapper">

              <span className="currency">
                Rs.
              </span>

              <input
                type="number"
                placeholder={
                  market === "India"
                    ? "20000"
                    : "40000"
                }
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value)
                }
                min={minBudget}
                max={maxBudget}
              />

            </div>

            <button
              onClick={optimizeBudget}
              disabled={loading}
            >
              {loading
                ? "Optimizing..."
                : "Optimize Budget"}
            </button>

          </div>

          {error && (
            <p className="error">
              {error}
            </p>
          )}

        </section>

        {/* RESULTS */}
        {result && (
          <section className="dashboard">

            <div className="section-label">
              OPTIMIZATION RESULTS
            </div>

            <h2>
              AI Budget Recommendation
            </h2>

            {/* CAMPAIGN SUMMARY */}
            <div className="campaign-summary">

              <div>
                <span>
                  Campaign
                </span>

                <strong>
                  {campaignName ||
                    "Unnamed Campaign"}
                </strong>
              </div>

              <div>
                <span>
                  Product / Brand
                </span>

                <strong>
                  {productName ||
                    "Not specified"}
                </strong>
              </div>

              <div>
                <span>
                  Market
                </span>

                <strong>
                  {market === "India"
                    ? "India"
                    : "Global"}
                </strong>
              </div>

              <div>
                <span>
                  Industry
                </span>

                <strong>
                  {industry}
                </strong>
              </div>

            </div>

            {/* SUMMARY CARDS */}
            <div className="summary">

              <div className="stat-card">

                <div className="stat-icon">
                  Rs.
                </div>

                <div>

                  <span>
                    Total Budget
                  </span>

                  <strong>
                    Rs.
                    {Number(
                      result.total_budget
                    ).toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits: 0,
                      }
                    )}
                  </strong>

                </div>

              </div>

              <div className="stat-card highlight">

                <div className="stat-icon">
                  ↗
                </div>

                <div>

                  <span>
                    Predicted Revenue
                  </span>

                  <strong>
                    Rs.
                    {Number(
                      result.total_predicted_revenue
                    ).toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits: 0,
                      }
                    )}
                  </strong>

                </div>

              </div>

            </div>

            {/* CHARTS */}
            <div className="charts-grid">

              {/* ALLOCATION CHART */}
              <div className="chart-card">

                <div className="chart-header">

                  <div>

                    <h3>
                      Budget Allocation
                    </h3>

                    <p>
                      Recommended distribution
                    </p>

                  </div>

                </div>

                <div className="chart-container">

                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >

                    <PieChart>

                      <Pie
                        data={allocationData}
                        dataKey="budget"
                        nameKey="platform"
                        cx="50%"
                        cy="50%"
                        outerRadius={105}
                        innerRadius={60}
                        paddingAngle={3}
                      >

                        {allocationData.map(
                          (_, index) => (
                            <Cell
                              key={index}
                              fill={
                                COLORS[
                                  index %
                                    COLORS.length
                                ]
                              }
                            />
                          )
                        )}

                      </Pie>

                      <Tooltip
                        formatter={(value) =>
                          "Rs." +
                          Number(
                            value
                          ).toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 0,
                            }
                          )
                        }
                      />

                    </PieChart>

                  </ResponsiveContainer>

                </div>

                <div className="legend">

                  {allocationData.map(
                    (item, index) => (
                      <div
                        className="legend-item"
                        key={item.platform}
                      >

                        <span
                          className="legend-dot"
                          style={{
                            background:
                              COLORS[
                                index %
                                  COLORS.length
                              ],
                          }}
                        />

                        <span>
                          {item.platform}
                        </span>

                        <strong>
                          Rs.
                          {item.budget.toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 0,
                            }
                          )}
                        </strong>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* REVENUE CHART */}
              <div className="chart-card">

                <div className="chart-header">

                  <div>

                    <h3>
                      Predicted Revenue
                    </h3>

                    <p>
                      Estimated revenue by platform
                    </p>

                  </div>

                </div>

                <div className="chart-container">

                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >

                    <BarChart
                      data={revenueData}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />

                      <XAxis
                        dataKey="platform"
                        stroke="#94a3b8"
                      />

                      <YAxis
                        stroke="#94a3b8"
                        tickFormatter={(value) =>
                          "Rs." +
                          Math.round(
                            value / 1000
                          ) +
                          "k"
                        }
                      />

                      <Tooltip
                        formatter={(value) =>
                          "Rs." +
                          Number(
                            value
                          ).toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 0,
                            }
                          )
                        }
                      />

                      <Bar
                        dataKey="revenue"
                        fill="#8b5cf6"
                        radius={[
                          8,
                          8,
                          0,
                          0,
                        ]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              </div>

            </div>

            {/* PLATFORM BREAKDOWN */}
            <div className="platform-section">

              <div className="section-label">
                PLATFORM BREAKDOWN
              </div>

              <div className="platforms">

                {Object.entries(
                  result.allocation
                ).map(
                  ([platform, amount], index) => (

                    <div
                      className="platform-card"
                      key={platform}
                    >

                      <div
                        className="platform-indicator"
                        style={{
                          background:
                            COLORS[
                              index %
                                COLORS.length
                            ],
                        }}
                      />

                      <h3>
                        {platform}
                      </h3>

                      <div className="platform-value">
                        Rs.
                        {Number(
                          amount
                        ).toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </div>

                      <p>
                        Recommended Budget
                      </p>

                      <div className="platform-revenue">

                        <span>
                          Predicted Revenue
                        </span>

                        <strong>
                          Rs.
                          {Number(
                            result.predicted_revenue[
                              platform
                            ]
                          ).toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 0,
                            }
                          )}
                        </strong>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

            {/* WHAT-IF ANALYSIS */}
            <section className="whatif-section">

              <div className="section-label">
                WHAT-IF ANALYSIS
              </div>

              <h2>
                Explore Another Budget
              </h2>

              <p className="section-description">
                Test how the optimizer changes the
                recommended allocation when the
                total campaign budget changes.
              </p>

              <div className="whatif-input-row">

                <div className="input-wrapper">

                  <span className="currency">
                    Rs.
                  </span>

                  <input
                    type="number"
                    placeholder={
                      market === "India"
                        ? "30000"
                        : "50000"
                    }
                    value={whatIfBudget}
                    onChange={(e) =>
                      setWhatIfBudget(
                        e.target.value
                      )
                    }
                    min={minBudget}
                    max={maxBudget}
                  />

                </div>

                <button
                  onClick={analyzeWhatIf}
                  disabled={whatIfLoading}
                >
                  {whatIfLoading
                    ? "Analyzing..."
                    : "Analyze Budget"}
                </button>

              </div>

              {whatIfError && (
                <p className="error">
                  {whatIfError}
                </p>
              )}

              {whatIfResult && (
                <div className="whatif-result">

                  <div className="comparison-cards">

                    <div className="comparison-card">

                      <span>
                        Current Budget
                      </span>

                      <strong>
                        Rs.
                        {Number(
                          result.total_budget
                        ).toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </strong>

                      <small>
                        Predicted Revenue
                      </small>

                      <b>
                        Rs.
                        {Number(
                          result.total_predicted_revenue
                        ).toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </b>

                    </div>

                    <div className="comparison-arrow">
                      →
                    </div>

                    <div className="comparison-card accent">

                      <span>
                        What-If Budget
                      </span>

                      <strong>
                        Rs.
                        {Number(
                          whatIfResult.total_budget
                        ).toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </strong>

                      <small>
                        Predicted Revenue
                      </small>

                      <b>
                        Rs.
                        {Number(
                          whatIfResult.total_predicted_revenue
                        ).toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </b>

                    </div>

                  </div>

                  <div className="change-card">

                    <span>
                      Estimated Revenue Change
                    </span>

                    <strong>
                      {revenueChange >= 0
                        ? "+"
                        : ""}
                      Rs.
                      {Number(
                        revenueChange
                      ).toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits: 0,
                        }
                      )}
                    </strong>

                  </div>

                  <h3>
                    Allocation Comparison
                  </h3>

                  <div className="comparison-table">

                    <div className="table-header">

                      <span>
                        Platform
                      </span>

                      <span>
                        Current
                      </span>

                      <span>
                        What-If
                      </span>

                    </div>

                    {Object.entries(
                      result.allocation
                    ).map(
                      ([platform, amount]) => (

                        <div
                          className="table-row"
                          key={platform}
                        >

                          <span>
                            {platform}
                          </span>

                          <span>
                            Rs.
                            {Number(
                              amount
                            ).toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits: 0,
                              }
                            )}
                          </span>

                          <span>
                            Rs.
                            {Number(
                              whatIfResult
                                .allocation[
                                platform
                              ] || 0
                            ).toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits: 0,
                              }
                            )}
                          </span>

                        </div>

                      )
                    )}

                  </div>

                </div>
              )}

            </section>

            {/* AI SYSTEM ARCHITECTURE */}
            <section className="ai-system-section">

              <div className="section-label">
                AI SYSTEM ARCHITECTURE
              </div>

              <h2>
                How the AI System Works
              </h2>

              <p className="section-description">
                The system combines machine learning,
                budget-response modeling, and constrained
                optimization to generate a data-driven
                campaign budget recommendation.
              </p>

              <div className="ai-flow">

                {/* STEP 1 */}
                <div className="ai-step">

                  <div className="ai-step-number">
                    01
                  </div>

                  <div className="ai-step-content">

                    <h3>
                      Historical Campaign Data
                    </h3>

                    <p>
                      The system analyzes historical
                      campaign information such as
                      platform, campaign type, industry,
                      country, timing, and planned budget.
                    </p>

                  </div>

                </div>

                <div className="flow-arrow">
                  ↓
                </div>

                {/* STEP 2 */}
                <div className="ai-step">

                  <div className="ai-step-number">
                    02
                  </div>

                  <div className="ai-step-content">

                    <h3>
                      Revenue Prediction
                    </h3>

                    <p>
                      A Gradient Boosting machine learning
                      model estimates campaign revenue using
                      pre-campaign information without using
                      post-campaign outcome variables.
                    </p>

                  </div>

                </div>

                <div className="flow-arrow">
                  ↓
                </div>

                {/* STEP 3 */}
                <div className="ai-step">

                  <div className="ai-step-number">
                    03
                  </div>

                  <div className="ai-step-content">

                    <h3>
                      Budget Response Modeling
                    </h3>

                    <p>
                      Platform-specific logarithmic response
                      curves model how estimated revenue changes
                      as campaign budget increases.
                    </p>

                  </div>

                </div>

                <div className="flow-arrow">
                  ↓
                </div>

                {/* STEP 4 */}
                <div className="ai-step">

                  <div className="ai-step-number">
                    04
                  </div>

                  <div className="ai-step-content">

                    <h3>
                      Constrained Optimization
                    </h3>

                    <p>
                      The optimizer distributes the available
                      budget across platforms while respecting
                      platform-specific minimum and maximum
                      allocation constraints.
                    </p>

                  </div>

                </div>

                <div className="flow-arrow">
                  ↓
                </div>

                {/* STEP 5 */}
                <div className="ai-step final-step">

                  <div className="ai-step-number">
                    05
                  </div>

                  <div className="ai-step-content">

                    <h3>
                      Recommended Allocation
                    </h3>

                    <p>
                      The system returns a recommended
                      allocation and estimated revenue for
                      each supported advertising platform.
                    </p>

                  </div>

                </div>

              </div>

            </section>

            {/* NOTICE */}
            <div className="notice">

              <span>
                i
              </span>

              <p>
                Revenue figures are model estimates
                based on historical campaign data and
                fitted budget-response curves. They
                are not guaranteed outcomes.
              </p>

            </div>

          </section>
        )}

      </main>

      <footer>
        Campaign Budget Optimizer · AI & Cloud Project
      </footer>

    </div>
  );
}

export default App;