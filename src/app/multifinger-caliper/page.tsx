import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function MultifingerCaliperPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        {/* Content for Multifinger Caliper Preview Interpretation page */}
        <p className="text-2xl text-gray-500">Multifinger Caliper Preview Interpretation Page</p>
      </main>
      <Footer />
    </div>
  );
}
