import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Pill, Phone, Send, Sparkles, Heart, Clock } from "lucide-react";

interface PrescriptionFormProps {
  onSubmit: (prescription: string, phone: string) => void;
}

const PrescriptionForm = ({ onSubmit }: PrescriptionFormProps) => {
  const [step, setStep] = useState<"prescription" | "phone">("prescription");
  const [prescription, setPrescription] = useState("");
  const [phone, setPhone] = useState("");

  const handlePrescriptionNext = () => {
    if (prescription.trim()) {
      setStep("phone");
    }
  };

  const handleSubmit = () => {
    if (phone.trim()) {
      onSubmit(prescription, phone);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {step === "prescription" ? (
        <div className="animate-fade-in space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              <Pill className="w-4 h-4 animate-bounce-slow" />
              Step 1 of 2
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              What's on the prescription? 📋
            </h2>
            <p className="text-muted-foreground">
              Type it out exactly as it says - we'll make sure grandma never forgets a pill! 💊
            </p>
          </div>

          <div className="relative">
            <Textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder="Example: Take 1 blue pill every morning with food. Take 2 white pills at night before bed..."
              className="min-h-[200px] text-lg p-6 rounded-2xl border-2 border-border bg-card shadow-card focus:border-primary focus:ring-4 focus:ring-primary/20 resize-none transition-all duration-300"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-muted-foreground text-sm">
              <Sparkles className="w-4 h-4" />
              Be specific!
            </div>
          </div>

          <Button 
            onClick={handlePrescriptionNext}
            disabled={!prescription.trim()}
            size="xl"
            className="w-full"
          >
            Next: Add Phone Number
            <Phone className="w-5 h-5 ml-2" />
          </Button>
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-semibold">
              <Phone className="w-4 h-4 animate-bounce-slow" />
              Step 2 of 2
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Where should we send reminders? 📱
            </h2>
            <p className="text-muted-foreground">
              We'll text them friendly reminders so they never miss a dose!
            </p>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Pill className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Prescription saved:</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{prescription}</p>
              </div>
            </div>
            <button 
              onClick={() => setStep("prescription")}
              className="text-sm text-primary hover:underline"
            >
              ← Edit prescription
            </button>
          </div>

          <div className="relative">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="h-16 text-xl px-6 rounded-2xl border-2 border-border bg-card shadow-card focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all duration-300 text-center font-semibold"
            />
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Smart timing
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              With love
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!phone.trim()}
            size="xl"
            variant="fun"
            className="w-full"
          >
            Start Sending Reminders
            <Send className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PrescriptionForm;
