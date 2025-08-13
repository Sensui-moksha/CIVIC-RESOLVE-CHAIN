import React from "react";
import WalletConnect from "@/components/wallet/WalletConnect";
import ProblemForm from "@/components/problems/ProblemForm";
import ProblemList from "@/components/problems/ProblemList";
import ThemeToggle from "@/components/theme/ThemeToggle";

const Index = () => {
  const [address, setAddress] = React.useState<string | undefined>();
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-glow/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <header className="container pt-8 sm:pt-12 pb-8 sm:pb-12 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-brand to-brand-glow bg-clip-text text-transparent">
              🏛️ DeFix
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground font-medium">
              Civic Problem Solving on Aptos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <WalletConnect onAddressChange={setAddress} />
          </div>
        </div>
        <div className="mt-6 p-4 sm:p-6 glass-card rounded-xl">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            🚀 Report local issues with photos and precise location data, propose innovative solutions, vote as a community, and automatically reward verified solvers through secure smart contracts.
          </p>
        </div>
      </header>

      <section className="container grid grid-cols-1 xl:grid-cols-5 gap-6 sm:gap-8 pb-16 animate-fade-in">
        <div className="xl:col-span-2">
          <ProblemForm currentAddress={address} />
        </div>
        <div className="xl:col-span-3">
          <ProblemList />
        </div>
      </section>
    </main>
  );
};

export default Index;
