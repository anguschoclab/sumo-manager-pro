import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import MainMenu from "./pages/MainMenu";
import Dashboard from "./pages/Dashboard";
import BashoPage from "./pages/BashoPage";
import BanzukePage from "./pages/BanzukePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { state } = useGame();
  
  // Show main menu if no world exists
  if (!state.world) {
    return <MainMenu />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/basho" element={<BashoPage />} />
        <Route path="/banzuke" element={<BanzukePage />} />
        <Route path="/stable" element={<Dashboard />} />
        <Route path="/economy" element={<Dashboard />} />
        <Route path="/governance" element={<Dashboard />} />
        <Route path="/history" element={<Dashboard />} />
        <Route path="/menu" element={<MainMenu />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GameProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
