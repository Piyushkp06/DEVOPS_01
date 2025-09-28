import { BarChart3, MessageSquare, FileText, Shield } from "lucide-react";
import { ActiveView } from "./Dashboard";

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: typeof BarChart3;
  primary: boolean;
}

const navItems: NavItem[] = [
  {
    id: "metrics",
    label: "Metrics Dashboard",
    icon: BarChart3,
    primary: true,
  },
  {
    id: "chat",
    label: "AI Chat Copilot",
    icon: MessageSquare,
    primary: true,
  },
  {
    id: "audit",
    label: "Audit Log",
    icon: FileText,
    primary: false,
  },
];

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  return (
    <aside className="w-64 sidebar-glow border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Infra-Guard AI</h1>
            <p className="text-xs text-muted-foreground">DevOps Monitoring</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems
            .filter((item) => item.primary)
            .map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeView === item.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        {navItems
          .filter((item) => !item.primary)
          .map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left text-sm transition-all duration-200 ${
                activeView === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
      </div>
    </aside>
  );
};