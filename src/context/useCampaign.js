import { useContext } from "react";
import { CampaignContext } from "./campaignContextDef";

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error("useCampaign must be used within CampaignProvider");
  }
  return ctx;
}
