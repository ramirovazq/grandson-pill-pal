import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  Phone, 
  Send, 
  Sparkles, 
  Heart, 
  Clock, 
  CheckCircle, 
  Edit3, 
  Plus, 
  Trash2, 
  Loader2,
  AlertTriangle,
  Utensils,
  Stethoscope
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { extractPrescription, type ExtractedItem } from "@/api";
import type { PrescriptionItemInput } from "@/api";

export interface PrescriptionSubmitData {
  items: PrescriptionItemInput[];
  phone: string;
}

interface PrescriptionFormProps {
  onSubmit: (data: PrescriptionSubmitData) => void | Promise<void>;
  isLoading?: boolean;
}

interface ValidatedItem extends ExtractedItem {
  id: string;
  validated: boolean;
}

const PrescriptionForm = ({ onSubmit, isLoading = false }: PrescriptionFormProps) => {
  const [step, setStep] = useState<"prescription" | "extracting" | "validate" | "phone">("prescription");
  const [prescription, setPrescription] = useState("");
  const [items, setItems] = useState<ValidatedItem[]>([]);
  const [phone, setPhone] = useState("");
  const [newItem, setNewItem] = useState("");
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handlePrescriptionNext = async () => {
    if (!prescription.trim()) return;
    
    setExtractionError(null);
    setStep("extracting");
    
    try {
      const result = await extractPrescription(prescription);
      
      const validatedItems: ValidatedItem[] = result.items.map((item, index) => ({
        ...item,
        id: `item-${index}-${Date.now()}`,
        validated: false,
      }));
      
      setItems(validatedItems);
      setStep("validate");
    } catch (error) {
      console.error("Extraction failed:", error);
      setExtractionError(t("errorExtraction"));
      setStep("prescription");
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
      const manualItem: ValidatedItem = {
        id: `item-${Date.now()}`,
        item_type: "medication",
        item_name: newItem.trim(),
        item_name_complete: newItem.trim(),
        pills_per_dose: null,
        doses_per_day: null,
        treatment_duration_days: null,
        total_pills_required: null,
        raw_prescription_text: newItem.trim(),
        confidence_level: "medium",
        requires_human_review: true,
        validated: false,
      };
      setItems([...items, manualItem]);
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
        text: item.raw_prescription_text,
      }));
      onSubmit({ items: prescriptionItems, phone });
    }
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case "medication":
        return <Pill className="w-4 h-4" />;
      case "food":
        return <Utensils className="w-4 h-4" />;
      case "procedure":
        return <Stethoscope className="w-4 h-4" />;
      default:
        return <Pill className="w-4 h-4" />;
    }
  };

  const getItemTypeBadge = (itemType: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      medication: "default",
      food: "secondary",
      procedure: "outline",
    };
    return (
      <Badge variant={variants[itemType] || "default"} className="text-xs">
        {getItemIcon(itemType)}
        <span className="ml-1">{t(itemType)}</span>
      </Badge>
    );
  };

  const getConfidenceBadge = (confidence: string, needsReview: boolean) => {
    if (needsReview) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {t("needsReview")}
        </Badge>
      );
    }
    
    const colors: Record<string, string> = {
      high: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-red-100 text-red-800",
    };
    
    const labels: Record<string, string> = {
      high: t("highConfidence"),
      medium: t("mediumConfidence"),
      low: t("lowConfidence"),
    };
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[confidence]}`}>
        {labels[confidence]}
      </span>
    );
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

          {extractionError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{extractionError}</p>
            </div>
          )}

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
      ) : step === "extracting" ? (
        <div className="animate-fade-in space-y-8 py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {t("extracting")}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("extractingSubtitle")}
            </p>
          </div>
          
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
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
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  item.validated 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={item.id}
                    checked={item.validated}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-primary">#{index + 1}</span>
                      {getItemTypeBadge(item.item_type)}
                      {getConfidenceBadge(item.confidence_level, item.requires_human_review)}
                    </div>
                    <label 
                      htmlFor={item.id}
                      className={`block text-sm cursor-pointer font-medium ${
                        item.validated ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {item.item_name_complete}
                    </label>
                    
                    {/* Medication details */}
                    {item.item_type === "medication" && (
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {item.pills_per_dose !== null && (
                          <span className="bg-muted px-2 py-1 rounded">
                            {item.pills_per_dose} {t("pillsPerDose")}
                          </span>
                        )}
                        {item.doses_per_day !== null && (
                          <span className="bg-muted px-2 py-1 rounded">
                            {item.doses_per_day} {t("dosesPerDay")}
                          </span>
                        )}
                        {item.treatment_duration_days !== null && (
                          <span className="bg-muted px-2 py-1 rounded">
                            {item.treatment_duration_days} {t("durationDays")}
                          </span>
                        )}
                        {item.total_pills_required !== null && (
                          <span className="bg-muted px-2 py-1 rounded">
                            {item.total_pills_required} {t("totalPills")}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Food details */}
                    {item.item_type === "food" && (
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {item.doses_per_day !== null && (
                          <span className="bg-muted px-2 py-1 rounded">
                            {item.doses_per_day} {t("dosesPerDay")}
                          </span>
                        )}
                        {item.treatment_duration_days !== null && (
                          <span className="bg-muted px-2 py-1 rounded">
                            {item.treatment_duration_days} {t("durationDays")}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground/70 italic">
                      "{item.raw_prescription_text}"
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
                  {items.slice(0, 3).map((item) => (
                    <li key={item.id} className="line-clamp-1 flex items-center gap-2">
                      {getItemIcon(item.item_type)}
                      {item.item_name_complete}
                    </li>
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
