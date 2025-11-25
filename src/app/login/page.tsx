"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        toast({
          title: "Email not verified",
          description: "Please verify your email before logging in.",
          variant: "destructive",
        });
        await auth.signOut();
        return;
      }

      // Update Firestore with current verification status
      await updateDoc(doc(db, "pending_users", user.uid), {
        emailVerified: user.emailVerified
      });

      // Check user status in Firestore
      const userDoc = await getDoc(doc(db, "pending_users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.status === "approved") {
          toast({
            title: "Login successful",
            description: "Welcome back.",
          });
          router.push("/");
        } else if (userData.status === "pending") {
          toast({
            title: "Account pending",
            description: "Your account has not been approved by the administrator yet.",
            variant: "destructive",
          });
          await auth.signOut();
        } else {
          toast({
            title: "Account rejected",
            description: "Your account has been rejected. Contact the administrator.",
            variant: "destructive",
          });
          await auth.signOut();
        }
      } else {
        // If no doc, assume approved (for existing users)
        router.push("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
          <div className="mt-4">
            
            <p className="text-center text-sm text-muted-foreground mb-2">
              Don't have an account?
            </p>
            <Button variant="destructive" className="w-full" asChild>
              <Link href="/register">
                Sign up
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
