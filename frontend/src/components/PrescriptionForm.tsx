import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, Phone, Send, Sparkles, Heart, Clock, CheckCircle, Edit3, Plus, Trash2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PrescriptionItemInput } from "@/api";

export interface PrescriptionSubmitData {
  items: PrescriptionItemInput[];
  phone: string;
}

interface PrescriptionFormProps {
  onSubmit: (data: PrescriptionSubmitData) => void | Promise<void>;
  isLoading?: boolean;
}

interface PrescriptionItem {
  id: string;
  text: string;
  validated: boolean;
}

const PrescriptionForm = ({ onSubmit, isLoading = false }: PrescriptionFormProps) => {
  const [step, setStep] = useState<"prescription" | "validate" | "phone">("prescription");
  const [prescription, setPrescription] = useState("");
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [phone, setPhone] = useState("");
  const [newItem, setNewItem] = useState("");
  const { t } = useLanguage();

  const parseItems = (text: string): PrescriptionItem[] => {
    const lines = text.split(/[.\n]/).filter(line => line.trim().length > 0);
    return lines.map((line, index) => ({
      id: `item-${index}`,
      text: line.trim(),
      validated: false
    }));
  };

  const handlePrescriptionNext = () => {
    if (prescription.trim()) {
      setItems(parseItems(prescription));
      setStep("validate");
    }
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, validated: !item.validated } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, {
        id: `item-${Date.now()}`,
        text: newItem.trim(),
        validated: false
      }]);
      setNewItem("");
    }
  };

  const allValidated = items.length > 0 && items.every(item => item.validated);

  const handleValidateNext = () => {
    if (allValidated) {
      setStep("phone");
    }
  };

  const handleSubmit = () => {
    if (phone.trim() && !isLoading) {
      const prescriptionItems: PrescriptionItemInput[] = items.map(item => ({
        text: item.text,
      }));
      onSubmit({ items: prescriptionItems, phone });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {step === "prescription" ? (
        <div className="animate-fade-in space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              <Pill className="w-4 h-4 animate-bounce-slow" />
              {t("step1of3")}
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {t("prescriptionTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("prescriptionSubtitle")}
            </p>
          </div>

          <div className="relative">
            <Textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder={t("prescriptionPlaceholder")}
              className="min-h-[200px] text-lg p-6 rounded-2xl border-2 border-border bg-card shadow-card focus:border-primary focus:ring-4 focus:ring-primary/20 resize-none transition-all duration-300"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-muted-foreground text-sm">
              <Sparkles className="w-4 h-4" />
              {t("beSpecific")}
            </div>
          </div>

          <Button 
            onClick={handlePrescriptionNext}
            disabled={!prescription.trim()}
            size="xl"
            className="w-full"
          >
            {t("nextValidate")}
            <CheckCircle className="w-5 h-5 ml-2" />
          </Button>
        </div>
      ) : step === "validate" ? (
        <div className="animate-fade-in space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-semibold">
              <CheckCircle className="w-4 h-4 animate-bounce-slow" />
              {t("step2of3")}
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {t("validateTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("validateSubtitle")}
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div 
                key={item.id}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                  item.validated 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card"
                }`}
              >
                <Checkbox
                  id={item.id}
                  checked={item.validated}
                  onCheckedChange={() => toggleItem(item.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <label 
                    htmlFor={item.id}
                    className={`text-sm cursor-pointer ${
                      item.validated ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold text-primary mr-2">#{index + 1}</span>
                    {item.text}
                  </label>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={t("addItemPlaceholder")}
              className="flex-1 h-12 rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <Button
              onClick={addItem}
              disabled={!newItem.trim()}
              size="icon"
              variant="outline"
              className="h-12 w-12"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => setStep("prescription")}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {t("editPrescription")}
            </Button>
            <Button 
              onClick={handleValidateNext}
              disabled={!allValidated}
              size="lg"
              className="flex-1"
            >
              {t("nextAddPhone")}
              <Phone className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {!allValidated && items.length > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {t("validateAllItems")}
            </p>
          )}
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-semibold">
              <Phone className="w-4 h-4 animate-bounce-slow" />
              {t("step3of3")}
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {t("phoneTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("phoneSubtitle")}
            </p>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t("itemsValidated")} ({items.length})</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  {items.slice(0, 3).map((item, index) => (
                    <li key={item.id} className="line-clamp-1">• {item.text}</li>
                  ))}
                  {items.length > 3 && (
                    <li className="text-primary">+{items.length - 3} {t("moreItems")}</li>
                  )}
                </ul>
              </div>
            </div>
            <button 
              onClick={() => setStep("validate")}
              className="text-sm text-primary hover:underline"
            >
              {t("editItems")}
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
              {t("smartTiming")}
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              {t("withLove")}
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!phone.trim() || isLoading}
            size="xl"
            variant="fun"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t("sending") || "Sending..."}
              </>
            ) : (
              <>
                {t("startReminders")}
                <Send className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PrescriptionForm;
