import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AppCard } from "@/components/app-card";
import { LayoutTemplate, Sprout, Target, View } from "lucide-react";


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-8 pb-8 md:pt-12 md:pb-12 text-center flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-6 max-w-3xl">
            Try our best APPS to enhance your productivity
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A centralized space for your Cased Hole Logs tools. Designed to be clean, fast, and professional.
          </p>
         
        </section>

        <section className="container mx-auto px-4 pb-20 md:pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <Link href="/universal-converter">
              <AppCard
                icon={Sprout}
                title="Universal Converter"
                description="Placeholder for the first application. Here you can describe its main functionality and the value it provides."
                color="green"
              />
            </Link>
            <Link href="/multifinger-caliper">
              <AppCard
                icon={LayoutTemplate}
                title="Multifinger Caliper Preview"
                description="Get instant previews of the results of your multifinger caliper log"
                color="blue"  
              />
            </Link>
            
            <Link href="#">
              <AppCard
                icon={Target}
                title="CBL Fast Look"
                description="Placeholder for the third application. Focused on achieving your goals with precision and efficiency."
                color="red"
              />
            </Link>

            <Link href="#">
              <AppCard
                icon={View}
                title="Sigma to Pseudo-Resistivity"
                description="Placeholder for the fourth application. Visualize your data and results in a completely new way."
                color="yellow"
              />
            </Link>

            <Link href="#">
              <AppCard
                icon={View}
                title="PLT's Interpretation On The Fly"
                description="This is a placeholder for a new application. You can edit the details as needed."
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
