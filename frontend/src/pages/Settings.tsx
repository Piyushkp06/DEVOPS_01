import { Layout } from "@/components/Layout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Monitor,
  Bell,
  Zap,
  Shield,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [notifications, setNotifications] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Check system preference
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme("system");
      applyTheme(isDark ? "dark" : "light");
    }
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = window.document.documentElement;
    
    // Remove the dark class first
    root.classList.remove("dark");
    
    if (newTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        root.classList.add("dark");
      }
    } else if (newTheme === "dark") {
      root.classList.add("dark");
    }
  };

  const handleThemeChange = (isDark: boolean) => {
    const newTheme = isDark ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
    
    toast({
      title: "Theme Updated",
      description: `Switched to ${newTheme} mode`,
      duration: 2000,
    });
  };

  const handleSave = () => {
    // Save all settings
    localStorage.setItem("notifications", String(notifications));
    localStorage.setItem("autoAnalysis", String(autoAnalysis));
    localStorage.setItem("advancedMode", String(advancedMode));

    toast({
      title: "Settings Saved",
      description: "Your preferences have been saved successfully",
      duration: 3000,
    });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your preferences and application settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-base">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {theme === "light" && <Sun className="h-4 w-4 text-muted-foreground" />}
                  <Switch
                    id="dark-mode"
                    checked={theme === "dark"}
                    onCheckedChange={handleThemeChange}
                  />
                  {theme === "dark" && <Moon className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Monitor className="h-4 w-4" />
                  <span>Current theme: <strong className="text-foreground">{theme}</strong></span>
                </div>
                <div className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm">
                    The theme affects the entire application including all pages, components, and charts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications" className="text-base">
                    Enable Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts for incidents and important events
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <Separator />

              <div className="space-y-3 opacity-50 pointer-events-none">
                <p className="text-sm font-medium">Notification Types (Coming Soon)</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Critical incidents
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Service disruptions
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Deployment updates
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Features
              </CardTitle>
              <CardDescription>
                Configure AI-powered automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-analysis" className="text-base">
                    Auto Analysis
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically analyze logs and incidents
                  </p>
                </div>
                <Switch
                  id="auto-analysis"
                  checked={autoAnalysis}
                  onCheckedChange={setAutoAnalysis}
                />
              </div>

              <Separator />

              <div className="p-4 rounded-lg border bg-muted/50">
                <p className="text-sm">
                  <strong>Note:</strong> Auto analysis runs every 15 minutes and uses AI credits. 
                  Enable only if you need continuous monitoring.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Advanced
              </CardTitle>
              <CardDescription>
                Advanced configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="advanced-mode" className="text-base">
                    Advanced Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show advanced features and debugging tools
                  </p>
                </div>
                <Switch
                  id="advanced-mode"
                  checked={advancedMode}
                  onCheckedChange={setAdvancedMode}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">Advanced Options</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Raw log access</p>
                  <p>• API response inspection</p>
                  <p>• Performance metrics</p>
                  <p>• Debug console</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="min-w-[200px]">
            <CheckCircle className="mr-2 h-4 w-4" />
            Save All Settings
          </Button>
        </div>

        {/* Info Section */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <SettingsIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">About Settings</p>
                <p className="text-sm text-muted-foreground">
                  All settings are stored locally in your browser. Some features may require additional 
                  configuration or permissions. Changes take effect immediately unless otherwise noted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
