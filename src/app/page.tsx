import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AppCard } from "@/components/app-card";
import { LayoutTemplate, Sprout, Target, View } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 max-w-3xl">
            Energy and Technology in Sync
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A centralized space for your future tools. Designed to be clean, fast, and professional.
          </p>
          <Button asChild size="lg" className="rounded-full px-8 h-12 text-base shadow-[0_8px_20px_rgba(108,63,240,0.25)] hover:shadow-[0_12px_28px_rgba(108,63,240,0.3)] transition-shadow">
            <Link href="/login">Get Started Now</Link>
          </Button>
        </section>

        <section className="container mx-auto px-4 pb-20 md:pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <AppCard
              icon={Sprout}
              title="Units Conversor"
              description="Placeholder for the first application. Here you can describe its main functionality and the value it provides."
            />
            <AppCard
              icon={LayoutTemplate}
              title="PLT Interpretation In The Run"
              description="Placeholder for the second application. Explore how this tool will optimize your workflows."
            />
            <AppCard
              icon={Target}
              title="Fast CBL Look"
              description="Placeholder for the third application. Focused on achieving your goals with precision and efficiency."
            />
            <AppCard
              icon={View}
              title="Sigma to PseudoResistivity Converter"
              description="Placeholder for the fourth application. Visualize your data and results in a completely new way."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
