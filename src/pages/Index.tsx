import { useState } from "react";
import PrescriptionForm from "@/components/PrescriptionForm";
import SuccessScreen from "@/components/SuccessScreen";
import FloatingPills from "@/components/FloatingPills";
import { Pill, Heart } from "lucide-react";

const Index = () => {
  const [submitted, setSubmitted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = (prescription: string, phone: string) => {
    console.log("Prescription:", prescription);
    console.log("Phone:", phone);
    setPhoneNumber(phone);
    setSubmitted(true);
  };

  const handleAddAnother = () => {
    setSubmitted(false);
    setPhoneNumber("");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating Pills Background */}
      <FloatingPills />

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl opacity-30" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center shadow-button">
              <Pill className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">
              PillPal
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Because grandma's health is no joke 
            <span className="inline-block animate-wiggle ml-1">💊</span>
          </p>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center py-8">
          {submitted ? (
            <SuccessScreen phone={phoneNumber} onAddAnother={handleAddAnother} />
          ) : (
            <PrescriptionForm onSubmit={handleSubmit} />
          )}
        </main>

        {/* Footer */}
        <footer className="text-center py-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 text-primary animate-pulse-soft" /> for keeping loved ones healthy
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
