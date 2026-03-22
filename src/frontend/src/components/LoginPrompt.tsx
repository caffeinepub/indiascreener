import { Button } from "@/components/ui/button";
import { Lock, LogIn } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LoginPromptProps {
  title?: string;
  description?: string;
}

export default function LoginPrompt({
  title = "Login Required",
  description = "Please log in to access this page.",
}: LoginPromptProps) {
  const { login, loginStatus } = useInternetIdentity();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
        <Lock className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-1">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Button
        onClick={() => login()}
        disabled={loginStatus === "logging-in"}
        data-ocid="login.primary_button"
        className="px-8"
      >
        <LogIn className="w-4 h-4 mr-2" />
        {loginStatus === "logging-in" ? "Signing in..." : "Sign In"}
      </Button>
    </div>
  );
}
