
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type AuthError,
} from "firebase/auth";
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
import { Loader2 } from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";

const errorMessages: Record<string, string> = {
  "auth/invalid-email": "The email address is not valid.",
  "auth/user-not-found": "No account found with this email. Please sign up.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use":
    "This email is already registered. Please log in.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/too-many-requests": "Access to this account has been temporarily disabled due to many failed login attempts. You can try again later.",
  "auth/configuration-not-found": "Authentication configuration failed. Please ensure Email/Password sign-in is enabled in your Firebase console.",
};

export function LoginForm() {
  const router = useRouter();
  const { authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (authUser && !authLoading) {
      router.push("/");
    }
  }, [authUser, authLoading, router]);


  const handleAuthError = (error: AuthError) => {
    const message =
      errorMessages[error.code] ||
      "An unexpected error occurred. Please try again.";
    toast({
      variant: "destructive",
      title: "Authentication Failed",
      description: message,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { auth } = getFirebaseClient();

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: "Account Created!",
          description: "You have been successfully registered. Redirecting...",
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: "Login Successful!",
          description: "Welcome back to CharaForge. Redirecting...",
        });
      }
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error) {
            handleAuthError(error as AuthError);
        } else {
             toast({
                variant: "destructive",
                title: "Authentication Failed",
                description: "An unknown error occurred.",
            });
        }
    } finally {
      setLoading(false);
    }
  };
  
  const totalLoading = loading || authLoading;

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline tracking-wider">
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Enter your email and password to get started."
              : "Sign in to continue to CharaForge."}
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
            {totalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
  );
}
