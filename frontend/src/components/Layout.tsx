import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  FileText, 
  AlertTriangle, 
  Server, 
  GitBranch,
  Sparkles,
  Menu,
  X,
  BarChart3,
  Activity,
  Settings
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'AI Analyzer', href: '/ai-analyzer', icon: Sparkles },
];

const monitoringNavigation = [
  { name: 'Logs', href: '/logs', icon: FileText },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Services', href: '/services', icon: Server },
  { name: 'Deployments', href: '/deployments', icon: GitBranch },
];

const settingsNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">DevOps AI</h1>
                <p className="text-xs text-muted-foreground">Infra Guard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-6">
              {/* Main Navigation */}
              <div>
                <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Main
                </p>
                <div className="space-y-1">
                  {mainNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Monitoring Navigation */}
              <div>
                <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Monitoring
                </p>
                <div className="space-y-1">
                  {monitoringNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Settings Navigation */}
              <div>
                <div className="space-y-1">
                  {settingsNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <p>Powered by Groq AI</p>
              <p className="mt-1">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
