import { Helmet } from "react-helmet";
import { BoutViewer } from "@/components/game/BoutViewer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Basho - Sumo Management Simulator</title>
        <meta name="description" content="Experience the world of sumo wrestling. Train rikishi, manage your stable, and compete in authentic tournaments with 82 kimarite techniques." />
      </Helmet>
      
      <main className="min-h-screen bg-background py-8">
        <BoutViewer />
      </main>
    </>
  );
};

export default Index;
