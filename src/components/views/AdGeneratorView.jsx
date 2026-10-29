
import { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  Heart,
  MessageCircle,
  Bookmark,
  Music,
  ExternalLink,
  ThumbsUp,
  Search,
} from "lucide-react";
import { useCampaign } from "../../context/useCampaign";

const COPY_TEMPLATES = {
  SaaS: [
    {
      headline: "Accelerate Workflow with AI Automation",
      body: "Streamline marketing operations, forecast revenue with ML accuracy, and optimize multi-channel spend in one unified platform.",
      cta: "Start Free Trial",
    },
    {
      headline: "Stop Guessing Your Marketing Budget",
      body: "Deploy constrained optimization algorithms to squeeze maximum ROI from Google, Meta, and TikTok ad spend.",
      cta: "Request Demo",
    },
  ],
  FMCG: [
    {
      headline: "Refreshment Reimagined · Feel The Boost",
      body: "Discover the everyday essentials loved by millions. Order direct today and enjoy same-day delivery right to your door.",
      cta: "Shop Now",
    },
    {
      headline: "Pure Quality for Every Household",
      body: "Trusted by families across the nation. Crafted with premium ingredients for healthy living.",
      cta: "Learn More",
    },
  ],
  Fintech: [
    {
      headline: "Smarter Investing Powered by Precision Tech",
      body: "Zero brokerage on equity deliveries. Institutional-grade portfolio tools designed for modern wealth builders.",
      cta: "Open Account",
    },
  ],
  "E-commerce": [
    {
      headline: "Exclusive Season Deals · Up to 50% Off",
      body: "Top trending collections, fast delivery, and hassle-free returns. Upgrade your wardrobe with our latest arrivals.",
      cta: "Shop The Sale",
    },
  ],
  Healthcare: [
    {
      headline: "Compassionate Care Available 24/7",
      body: "Consult certified medical specialists from the comfort of home. Fast prescription delivery and diagnostic bookings.",
      cta: "Consult Specialist",
    },
  ],
  EdTech: [
    {
      headline: "Master In-Demand Tech Skills in 12 Weeks",
      body: "Industry-accredited programs with 1-on-1 mentorship. Build portfolio projects and land high-growth tech roles.",
      cta: "Explore Programs",
    },
  ],
};

export default function AdGeneratorView() {
  const { campaignName, productName, industry } = useCampaign();

  const [platform, setPlatform] = useState("google");
  const [tone, setTone] = useState("Professional Enterprise");

  const [headline, setHeadline] = useState(
    `${productName || "Campaign Optimizer"} · AI Marketing Automation`
  );

  const [description, setDescription] = useState(
    "Empower your marketing team with predictive revenue modeling, automated budget optimization, and cross-platform campaign analytics."
  );

  const [cta, setCta] = useState("Get Started");
  const [copied, setCopied] = useState(false);

  const brandDisplay = productName || "Campaign Optimizer";

  const displayUrl = `https://www.${(
    productName || "campaignoptimizer"
  )
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")}.com/${industry.toLowerCase()}`;

  const handleApplyTemplate = (tpl) => {
    setHeadline(tpl.headline);
    setDescription(tpl.body);
    setCta(tpl.cta);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${headline}\n\n${description}\n\nCTA: ${cta}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Unable to copy ad copy:", error);
    }
  };

  const templates = COPY_TEMPLATES[industry] || COPY_TEMPLATES.SaaS;

  return (
    <div className="view-container">
      {/* Header Strip */}
      <div className="view-header-strip">
        <div>
          <span className="strip-badge">CREATIVE STUDIO</span>
          <h2 className="view-title">
            AI Ad Generator &amp; Creative Workspace
          </h2>
          <p className="view-subtitle">
            Configure tone, value proposition, and copy on the left. Inspect
            high-fidelity, platform-accurate ad previews on the right before
            deployment.
          </p>
        </div>
      </div>

      <div className="ad-generator-layout">
        {/* Left Panel: Configuration Studio */}
        <div className="card ad-config-panel">
          <div className="card-header">
            <div>
              <h3 className="card-title">Ad Configuration</h3>
              <p className="card-subtitle">Format and messaging controls</p>
            </div>
            <span className="pill pill-slate">{industry}</span>
          </div>

          <div className="config-form-body">
            {/* Platform Format Selector */}
            <div className="form-group">
              <label className="form-label">Target Ad Channel</label>

              <div className="platform-toggle-tabs">
                <button
                  type="button"
                  className={`tab-btn ${
                    platform === "google" ? "active" : ""
                  }`}
                  onClick={() => setPlatform("google")}
                >
                  Google Search
                </button>

                <button
                  type="button"
                  className={`tab-btn ${
                    platform === "meta" ? "active" : ""
                  }`}
                  onClick={() => setPlatform("meta")}
                >
                  Meta Sponsored
                </button>

                <button
                  type="button"
                  className={`tab-btn ${
                    platform === "tiktok" ? "active" : ""
                  }`}
                  onClick={() => setPlatform("tiktok")}
                >
                  TikTok In-Feed
                </button>
              </div>
            </div>

            {/* Headline Input */}
            <div className="form-group">
              <label htmlFor="adHeadline" className="form-label">
                Ad Headline
              </label>

              <input
                id="adHeadline"
                type="text"
                className="form-input"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={60}
              />

              <span className="char-count">
                {headline.length}/60 characters
              </span>
            </div>

            {/* Description Input */}
            <div className="form-group">
              <label htmlFor="adDesc" className="form-label">
                Body Copy / Value Proposition
              </label>

              <textarea
                id="adDesc"
                rows={3}
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={180}
              />

              <span className="char-count">
                {description.length}/180 characters
              </span>
            </div>

            {/* Tone of Voice */}
            <div className="form-group">
              <label htmlFor="toneSelect" className="form-label">
                Tone of Voice
              </label>

              <select
                id="toneSelect"
                className="form-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="Professional Enterprise">
                  Professional Enterprise
                </option>
                <option value="Conversion-Focused">
                  Conversion-Focused Direct
                </option>
                <option value="Innovative Tech">Innovative Tech &amp; Bold</option>
                <option value="Value & Urgency">
                  Value &amp; Urgency Oriented
                </option>
              </select>
            </div>

            {/* Call to Action */}
            <div className="form-group">
              <label htmlFor="ctaSelect" className="form-label">
                Call to Action Label
              </label>

              <select
                id="ctaSelect"
                className="form-select"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
              >
                <option value="Get Started">Get Started</option>
                <option value="Learn More">Learn More</option>
                <option value="Request Demo">Request Demo</option>
                <option value="Shop Now">Shop Now</option>
                <option value="Start Free Trial">Start Free Trial</option>
              </select>
            </div>

            {/* AI Copy Presets */}
            <div className="templates-section">
              <div className="templates-title">
                <Sparkles size={14} className="text-emerald" />
                <span>AI Copy Variations ({industry})</span>
              </div>

              <div className="template-cards-list">
                {templates.map((tpl, i) => (
                  <div
                    key={i}
                    className="template-card-item"
                    onClick={() => handleApplyTemplate(tpl)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="template-headline">{tpl.headline}</div>
                    <div className="template-preview-text">
                      {tpl.body.substring(0, 75)}...
                    </div>
                    <span className="apply-tag">Click to apply</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline full-width"
              onClick={handleCopy}
            >
              {copied ? (
                <Check size={16} className="text-emerald" />
              ) : (
                <Copy size={16} />
              )}
              <span>
                {copied ? "Copied to Clipboard!" : "Copy Ad Copy Package"}
              </span>
            </button>
          </div>
        </div>

        {/* Right Panel: Live Preview */}
        <div className="card ad-preview-panel">
          <div className="card-header">
            <div>
              <h3 className="card-title">Realistic Channel Ad Preview</h3>
              <p className="card-subtitle">
                Rendered with official typography, metadata tags, and channel
                UI elements
              </p>
            </div>

            <span className="pill pill-blue">
              {platform === "google"
                ? "Google SERP"
                : platform === "meta"
                ? "Meta Feed"
                : "TikTok Feed"}
            </span>
          </div>

          <div className="preview-stage">
            {/* Google Search Preview */}
            {platform === "google" && (
              <div className="google-preview-box">
                <div className="serp-bar-mock">
                  <Search size={14} className="text-muted" />
                  <span className="serp-query">
                    {productName || "marketing ai"} {campaignName}
                  </span>
                </div>

                <div className="google-ad-result">
                  <div className="google-ad-header">
                    <span className="google-ad-badge">Sponsored</span>
                    <span className="google-url-path">{displayUrl}</span>
                  </div>

                  <h3 className="google-ad-title">
                    {headline} | Official Site
                  </h3>

                  <p className="google-ad-snippet">{description}</p>

                  <div className="google-sitelinks-grid">
                    <div className="sitelink-item">
                      <span className="sitelink-title">{cta}</span>
                      <span className="sitelink-desc">
                        Quick setup in under 5 minutes
                      </span>
                    </div>

                    <div className="sitelink-item">
                      <span className="sitelink-title">
                        Live Pricing &amp; Plans
                      </span>
                      <span className="sitelink-desc">
                        Transparent enterprise tiers
                      </span>
                    </div>

                    <div className="sitelink-item">
                      <span className="sitelink-title">
                        Customer Case Studies
                      </span>
                      <span className="sitelink-desc">
                        Read real results and ROI lift
                      </span>
                    </div>

                    <div className="sitelink-item">
                      <span className="sitelink-title">
                        Security &amp; Compliance
                      </span>
                      <span className="sitelink-desc">
                        SOC2 Type II certified platform
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Meta Sponsored Preview */}
            {platform === "meta" && (
              <div className="meta-post-card">
                <div className="meta-post-header">
                  <div className="meta-avatar">
                    {(brandDisplay[0] || "C").toUpperCase()}
                  </div>

                  <div className="meta-meta-info">
                    <div className="meta-page-title">
                      <span>{brandDisplay}</span>
                      <span className="meta-verified-check">✓</span>
                    </div>

                    <div className="meta-sponsored-tag">
                      Sponsored · Paid Partnership
                    </div>
                  </div>
                </div>

                <div className="meta-post-caption">{description}</div>

                <div className="meta-post-media">
                  <div className="meta-media-placeholder">
                    <div className="media-overlay-content">
                      <div className="media-badge">
                        AI CAMPAIGN ACCELERATOR
                      </div>
                      <div className="media-title">{headline}</div>
                    </div>
                  </div>

                  <div className="meta-callout-footer">
                    <div className="meta-callout-left">
                      <span className="meta-domain">
                        {(productName || "campaignoptimizer").toLowerCase()}
                        .com
                      </span>
                      <span className="meta-headline-sub">{headline}</span>
                    </div>

                    <button type="button" className="meta-cta-button">
                      {cta}
                    </button>
                  </div>
                </div>

                <div className="meta-reactions-bar">
                  <div className="reaction-stat">
                    <ThumbsUp size={14} className="text-blue" />
                    <span>1,248</span>
                  </div>

                  <div className="reaction-stat">
                    <MessageCircle size={14} />
                    <span>84 Comments</span>
                  </div>

                  <div className="reaction-stat">
                    <Share2 size={14} />
                    <span>112 Shares</span>
                  </div>
                </div>
              </div>
            )}

            {/* TikTok In-Feed Preview */}
            {platform === "tiktok" && (
              <div className="tiktok-phone-frame">
                <div className="tiktok-card-content">
                  <div className="tiktok-bg-mock">
                    <div className="tiktok-badge-pill">Sponsored Ad</div>

                    <div className="tiktok-visual-center">
                      <Sparkles size={40} className="text-emerald" />
                      <h4>{brandDisplay}</h4>
                    </div>
                  </div>

                  <div className="tiktok-bottom-overlay">
                    <div className="tiktok-user-handle">
                      @
                      {brandDisplay.toLowerCase().replace(/[^a-z0-9]/g, "")}
                      _official
                    </div>

                    <p className="tiktok-caption-text">
                      {description}{" "}
                      <span className="hashtag">#marketing #ai #growth</span>
                    </p>

                    <div className="tiktok-music-track">
                      <Music size={13} />
                      <span>Original Audio - {brandDisplay} Official Sound</span>
                    </div>

                    <div className="tiktok-cta-banner">
                      <span>{cta}</span>
                      <ExternalLink size={14} />
                    </div>
                  </div>

                  <div className="tiktok-side-actions">
                    <div className="side-action-item">
                      <div className="action-circle">
                        <Heart size={18} />
                      </div>
                      <span>24.8k</span>
                    </div>

                    <div className="side-action-item">
                      <div className="action-circle">
                        <MessageCircle size={18} />
                      </div>
                      <span>892</span>
                    </div>

                    <div className="side-action-item">
                      <div className="action-circle">
                        <Bookmark size={18} />
                      </div>
                      <span>4.1k</span>
                    </div>

                    <div className="side-action-item">
                      <div className="action-circle">
                        <Share2 size={18} />
                      </div>
                      <span>1.6k</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
