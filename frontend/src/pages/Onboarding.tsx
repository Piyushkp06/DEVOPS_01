import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Box, Command, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const Onboarding = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth or connect to actual API
    setTimeout(() => {
      setIsLoading(false);
      toast.success(type === 'login' ? "Welcome back!" : "Account created successfully!");
      navigate("/");
    }, 1000);
  };

  const handleOAuth = (provider: 'github' | 'google') => {
    window.location.href = `${API_URL}/api/auth/oauth/${provider}`;
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background text-foreground">
      {/* Left Branding Panel */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-zinc-900 to-zinc-900/50" />
        
        <div className="relative z-20 flex items-center text-lg font-medium tracking-tight">
          <Command className="mr-2 h-6 w-6" />
          NexusPlatform
        </div>

        <div className="relative z-20 mt-auto">
          <div className="space-y-6 mb-8">
            <h1 className="text-4xl font-semibold tracking-tight">
              Next-generation continuous delivery & observability.
            </h1>
            <p className="text-lg text-zinc-300">
              Stop fighting your infrastructure. We bring metrics, incidents, deployments, and unified AI analysis into a single, cohesive dashboard.
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              "Zero-config intelligent incident triaging",
              "Out-of-the-box Kubernetes monitoring insights",
              "Collaborative actions and audit logging"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                <span className="text-sm font-medium text-zinc-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="lg:p-8 flex items-center justify-center h-full w-full">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Get started with Nexus
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account or create a new workspace
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={(e) => handleEmailAuth(e, 'login')} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required className="bg-background" />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={(e) => handleEmailAuth(e, 'register')} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-register">Full Name</Label>
                  <Input id="name-register" type="text" placeholder="John Doe" required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-register">Work Email</Label>
                  <Input id="email-register" type="email" placeholder="m@company.com" required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-register">Password</Label>
                  <Input id="password-register" type="password" required className="bg-background" />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button" onClick={() => handleOAuth('github')} className="w-full" disabled={isLoading}>
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button variant="outline" type="button" onClick={() => handleOAuth('google')} className="w-full" disabled={isLoading}>
              <Box className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
          
          <p className="px-8 text-center text-sm text-muted-foreground mt-6">
            By clicking continue, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;