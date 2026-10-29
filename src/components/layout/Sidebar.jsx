import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  TrendingUp,
  BarChart3,
  GitCompare,
  Users2,
  HelpCircle,
  FileText,
  Layers,
} from "lucide-react";
import { useCampaign } from "../../context/useCampaign";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: FolderKanban,
    badge: "Setup",
  },
  {
    id: "ad-generator",
    label: "Ad Generator",
    icon: Sparkles,
    badge: "AI",
  },
  {
    id: "optimizer",
    label: "Budget Optimizer",
    icon: TrendingUp,
    badge: "ML Core",
    highlight: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    badge: null,
  },
  {
    id: "ab-testing",
    label: "A/B Testing",
    icon: GitCompare,
    badge: "Demo",
  },
  {
    id: "audience",
    label: "Audience Insights",
    icon: Users2,
    badge: "Demo",
  },
  {
    id: "what-if",
    label: "What-If Analysis",
    icon: HelpCircle,
    badge: "Sim",
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    badge: null,
  },
];

export default function Sidebar() {
  const { activeView, setActiveView, result, market, loading } = useCampaign();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-wrap">
          <div className="brand-icon">
            <Layers size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-name">Campaign Optimizer</div>
          </div>
        </div>
        <div className="system-pill" title="FastAPI SLSQP ML Engine Ready">
          <span className={`status-indicator ${loading ? "busy" : result ? "active" : "standby"}`} />
          <span className="system-pill-text">
            {loading ? "Optimizing..." : result ? "Model Live" : "FastAPI ML"}
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="sidebar-scroll">
        <div className="nav-group-title">MAIN NAVIGATION</div>
        <nav className="nav-menu">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`nav-item ${isActive ? "active" : ""} ${item.highlight ? "highlight-item" : ""}`}
              >
                <span className="nav-icon-wrapper">
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge ${item.highlight ? "badge-emerald" : "badge-subtle"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="api-status-card">
          <div className="api-status-row">
            <span className="api-dot" />
            <span className="api-title">Optimization Engine</span>
          </div>
          <div className="api-endpoint-text">POST /optimize</div>
          <div className="api-market-tag">
            Active Market: <strong>{market}</strong>
          </div>
        </div>

        <div className="user-profile-widget">
          <div className="user-avatar">MK</div>
          <div className="user-info">
            <span className="user-name">Marketing Ops</span>
            <span className="user-role">Enterprise Suite</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
