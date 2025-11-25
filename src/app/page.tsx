"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AppCard } from "@/components/app-card";
import { LayoutTemplate, Calculator, Target, BarChart, View } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Update email verification status in Firestore if changed
        const userDocRef = doc(db, "pending_users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.emailVerified !== user.emailVerified) {
            await updateDoc(userDocRef, { emailVerified: user.emailVerified });
          }
          setUserStatus(data.status);
          if (data.status === "pending") {
            toast({
              title: "Account pending",
              description: "Your account has not been approved yet.",
              variant: "destructive",
            });
          } else if (data.status === "rejected") {
            toast({
              title: "Account rejected",
              description: "Your account has been rejected.",
              variant: "destructive",
            });
            await auth.signOut();
            router.push("/login");
          }
        } else {
          setUserStatus("approved"); // Assume approved if no doc
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  if (!user || userStatus !== "approved") {
    return null; // Will redirect
  }
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {user && (
          <section className="bg-muted/50 py-4">
            <div className="container mx-auto px-4 text-center">
              <p className="text-lg">
                Welcome, <span className="font-semibold">{user.email}</span>!
              </p>
            </div>
          </section>
        )}
        <section className="container mx-auto px-4 pt-8 pb-8 md:pt-12 md:pb-12 text-center flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-6 max-w-3xl">
            Try our best Apps to enhance your productivity
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A centralized space for your Cased Hole Logs tools. Designed to be clean, fast, and professional.
          </p>
         
        </section>

        <section className="container mx-auto px-4 pb-12 md:pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <Link href="/universal-converter">
              <AppCard
                icon={Calculator}
                title="Universal Converter"
                subtitle="Quick unit conversion"
                description="Convert well log units quickly and accurately, supporting multiple LAS and CSV formats."
                color="green"
              />
            </Link>
            <Link href="/multifinger_caliper">
              <AppCard
                icon={LayoutTemplate}
                title="Multifinger Caliper Preview"
                subtitle="Instant preview"
                description="Get instant previews of your multifinger caliper log results"
                color="blue"
              />
            </Link>
            
            <Link href="#">
              <AppCard
                icon={Target}
                title="CBL Fast Look"
                description="Placeholder for the third application. Focused on achieving your goals with precision and efficiency."
                color="red"
                status="coming-soon"
              />
            </Link>

            <Link href="#">
              <AppCard
                icon={View}
                title="Sigma to Pseudo-Resistivity"
                description="Placeholder for the fourth application. Visualize your data and results in a completely new way."
                color="yellow"
                status="coming-soon"
              />
            </Link>

            <Link href="#">
              <AppCard
                icon={BarChart}
                title="PLT's Interpretation On The Fly"
                subtitle="Real-time interpretation"
                description="Analyze production logs (PLT) on the fly for immediate insights."
                color="purple"
              />
            </Link>
            <Link href="#">
              <AppCard
                icon={View}
                title="New App Two"
                description="This is another placeholder for a new application. Feel free to customize it."
                color="pink"
              />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
