
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AnvilIcon } from "@/components/app-logo";
import type { AuthError } from "@supabase/supabase-js";


export default function LoginPage() {
  const router = useRouter();
  const { authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only redirect if authentication has finished loading and we have a confirmed user.
    if (!authLoading && authUser) {
        const redirectUrl = searchParams.get('redirect') || '/';
        router.push(redirectUrl);
    }
  }, [authUser, authLoading, router, searchParams]);


  const handleAuthError = (error: AuthError) => {
    toast({
      variant: "destructive",
      title: "Authentication Failed",
      description: error.message,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
        // Stay on the page to show the verification message
        setIsSignUp(false); 
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({
          title: "Login Successful!",
          description: "Welcome back to CharaForge. Redirecting...",
        });
        // Let the useEffect handle the redirect to ensure state is consistent
        router.refresh(); 
      }
    } catch (error: unknown) {
        handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };
  
  const totalLoading = loading || authLoading;

  // Don't render the form if we are still verifying the auth state and might redirect
  if (authLoading) {
     return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
            <CardHeader className="text-center relative">
                <Link href="/" className="absolute left-4 top-4 text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
                <div className="flex justify-center items-center gap-2 pt-8">
                    <AnvilIcon className="w-8 h-8" />
                    <CardTitle className="text-2xl font-headline tracking-wider">
                        {isSignUp ? "Create Account" : "CharaForge"}
                    </CardTitle>
                </div>
                <CardDescription>
                    {isSignUp
                    ? "Enter your email and password to get started."
                    : "Sign in to continue your journey."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={totalLoading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                id="password"
                type="password"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={totalLoading}
                />
            </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={totalLoading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
            <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={totalLoading}
            >
                {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Button>
            </CardFooter>
        </form>
        </Card>
    </div>
  );
}
