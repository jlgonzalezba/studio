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
            Despliega el Poder de tus Aplicaciones
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Un espacio centralizado para tus futuras herramientas de Python. Diseñado para ser limpio, rápido y profesional.
          </p>
          <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-[0_8px_20px_rgba(108,63,240,0.25)] hover:shadow-[0_12px_28px_rgba(108,63,240,0.3)] transition-shadow">
            <Link href="#">Empezar Ahora</Link>
          </Button>
        </section>

        <section className="container mx-auto px-4 pb-20 md:pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <AppCard
              icon={Sprout}
              title="Aplicación Uno"
              description="Placeholder para la primera aplicación. Aquí podrás describir su funcionalidad principal y el valor que aporta."
            />
            <AppCard
              icon={LayoutTemplate}
              title="Aplicación Dos"
              description="Placeholder para la segunda aplicación. Explora cómo esta herramienta optimizará tus flujos de trabajo."
            />
            <AppCard
              icon={Target}
              title="Aplicación Tres"
              description="Placeholder para la tercera aplicación. Enfocada en alcanzar tus objetivos con precisión y eficiencia."
            />
            <AppCard
              icon={View}
              title="Aplicación Cuatro"
              description="Placeholder para la cuarta aplicación. Visualiza tus datos y resultados de una manera completamente nueva."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
