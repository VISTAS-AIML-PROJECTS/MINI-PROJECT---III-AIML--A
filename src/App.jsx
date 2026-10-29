import { CampaignProvider } from "./context/CampaignContext";
import Layout from "./components/layout/Layout";
import "./App.css";

function App() {
  return (
    <CampaignProvider>
      <Layout />
    </CampaignProvider>
  );
}

export default App;