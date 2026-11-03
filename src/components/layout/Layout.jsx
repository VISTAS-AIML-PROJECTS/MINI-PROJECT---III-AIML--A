import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useCampaign } from "../../context/useCampaign";
import DashboardView from "../views/DashboardView";
import CampaignsView from "../views/CampaignsView";
import AdGeneratorView from "../views/AdGeneratorView";
import OptimizerView from "../views/OptimizerView";
import AnalyticsView from "../views/AnalyticsView";
import ABTestingView from "../views/ABTestingView";
import AudienceView from "../views/AudienceView";
import WhatIfView from "../views/WhatIfView";
import ReportsView from "../views/ReportsView";

export default function Layout() {
  const { activeView } = useCampaign();

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "campaigns":
        return <CampaignsView />;
      case "ad-generator":
        return <AdGeneratorView />;
      case "optimizer":
        return <OptimizerView />;
      case "analytics":
        return <AnalyticsView />;
      case "ab-testing":
        return <ABTestingView />;
      case "audience":
        return <AudienceView />;
      case "what-if":
        return <WhatIfView />;
      case "reports":
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="saas-layout">
      <Sidebar />
      <div className="saas-main">
        <Topbar />
        <main className="saas-content">{renderActiveView()}</main>
      </div>
    </div>
  );
}
