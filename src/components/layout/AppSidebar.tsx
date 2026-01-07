// App Sidebar - Main navigation for Stable Lords
// Traditional Japanese aesthetic with sumo terminology

import { 
  Home, 
  Trophy, 
  Users, 
  Sword, 
  Wallet, 
  Scale, 
  History, 
  Settings,
  CircleDot,
  Swords
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useGame } from "@/contexts/GameContext";
import { BASHO_CALENDAR } from "@/engine/calendar";
import { RANK_HIERARCHY } from "@/engine/banzuke";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home, phase: "interim" as const },
  { title: "Basho", url: "/basho", icon: Swords, phase: "basho" as const },
  { title: "Banzuke", url: "/banzuke", icon: Trophy, phase: "banzuke" as const },
  { title: "Stable", url: "/stable", icon: Users, phase: "stable" as const },
];

const secondaryNavItems = [
  { title: "Economy", url: "/economy", icon: Wallet, phase: "economy" as const },
  { title: "Governance", url: "/governance", icon: Scale, phase: "governance" as const },
  { title: "History", url: "/history", icon: History, phase: "history" as const },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { state: gameState } = useGame();
  const collapsed = state === "collapsed";
  
  const currentBasho = gameState.world?.currentBashoName 
    ? BASHO_CALENDAR[gameState.world.currentBashoName] 
    : null;
  
  const playerHeya = gameState.playerHeyaId && gameState.world
    ? gameState.world.heyas.get(gameState.playerHeyaId)
    : null;

  // Count sekitori in player's stable
  const sekitoriCount = playerHeya 
    ? playerHeya.rikishiIds.filter(id => {
        const r = gameState.world?.rikishi.get(id);
        return r && RANK_HIERARCHY[r.rank]?.isSekitori;
      }).length
    : 0;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <CircleDot className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-lg font-semibold">Stable Lords</span>
              <span className="text-xs text-muted-foreground">相撲経営</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Current Status */}
        {!collapsed && gameState.world && (
          <div className="border-b border-border px-4 py-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Year</span>
                <span className="font-medium">{gameState.world.year}</span>
              </div>
              {currentBasho && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Basho</span>
                  <span className="font-display">{currentBasho.nameJa}</span>
                </div>
              )}
              {gameState.world.currentBasho && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Day</span>
                  <span className="font-medium">{gameState.world.currentBasho.day}日目</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className="flex items-center gap-3 hover:bg-accent/50 transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 hover:bg-accent/50 transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        {/* Player Stable Info */}
        {!collapsed && playerHeya && (
          <div className="px-4 py-3">
            <div className="text-xs text-muted-foreground mb-1">Your Stable</div>
            <div className="font-display text-sm font-medium">{playerHeya.name}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{sekitoriCount} sekitori</span>
              <span>•</span>
              <span>¥{(playerHeya.funds / 1_000_000).toFixed(1)}M</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
