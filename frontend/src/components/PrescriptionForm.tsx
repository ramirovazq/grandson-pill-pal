import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  Phone, 
  Send, 
  Sparkles, 
  Heart, 
  Clock, 
  CheckCircle, 
  CheckCircle2,
  Circle,
  Edit3, 
  Plus, 
  Trash2, 
  Loader2,
  AlertTriangle,
  Utensils,
  Stethoscope,
  Bug,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { extractPrescription, type ExtractedItem, type ExtractionResponse } from "@/api";
import type { PrescriptionItemInput } from "@/api";

export interface PrescriptionSubmitData {
  items: PrescriptionItemInput[];
  phone: string;
}

interface PrescriptionFormProps {
  onSubmit: (data: PrescriptionSubmitData) => void | Promise<void>;
  isLoading?: boolean;
  showDebug?: boolean;
}

interface ValidatedItem extends ExtractedItem {
  id: string;
  validated: boolean;
}

// Initial state for new item form
const initialNewItemState = {
  item_type: "medication" as "medication" | "food" | "procedure",
  item_name_complete: "",
  pills_per_dose: "" as string | number,
  doses_per_day: "" as string | number,
  treatment_duration_days: "" as string | number,
  total_pills_required: "" as string | number,
};

// Country codes for phone input
const countries = [
  { code: "MX", name: "México", dialCode: "+52", flag: "🇲🇽" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "ES", name: "España", dialCode: "+34", flag: "🇪🇸" },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴" },
  { code: "PE", name: "Perú", dialCode: "+51", flag: "🇵🇪" },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱" },
  { code: "EC", name: "Ecuador", dialCode: "+593", flag: "🇪🇨" },
  { code: "VE", name: "Venezuela", dialCode: "+58", flag: "🇻🇪" },
  { code: "GT", name: "Guatemala", dialCode: "+502", flag: "🇬🇹" },
  { code: "CU", name: "Cuba", dialCode: "+53", flag: "🇨🇺" },
  { code: "BO", name: "Bolivia", dialCode: "+591", flag: "🇧🇴" },
  { code: "DO", name: "Dominican Republic", dialCode: "+1", flag: "🇩🇴" },
  { code: "HN", name: "Honduras", dialCode: "+504", flag: "🇭🇳" },
  { code: "PY", name: "Paraguay", dialCode: "+595", flag: "🇵🇾" },
  { code: "SV", name: "El Salvador", dialCode: "+503", flag: "🇸🇻" },
  { code: "NI", name: "Nicaragua", dialCode: "+505", flag: "🇳🇮" },
  { code: "CR", name: "Costa Rica", dialCode: "+506", flag: "🇨🇷" },
  { code: "PA", name: "Panamá", dialCode: "+507", flag: "🇵🇦" },
  { code: "UY", name: "Uruguay", dialCode: "+598", flag: "🇺🇾" },
  { code: "PR", name: "Puerto Rico", dialCode: "+1", flag: "🇵🇷" },
  { code: "BR", name: "Brasil", dialCode: "+55", flag: "🇧🇷" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
];

const PrescriptionForm = ({ onSubmit, isLoading = false, showDebug = true }: PrescriptionFormProps) => {
  const [step, setStep] = useState<"prescription" | "extracting" | "validate" | "phone">("prescription");
  const [prescription, setPrescription] = useState("");
  const [items, setItems] = useState<ValidatedItem[]>([]);
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to Mexico
  const [newItemForm, setNewItemForm] = useState(initialNewItemState);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [debugResponse, setDebugResponse] = useState<ExtractionResponse | null>(null);
  const [debugExpanded, setDebugExpanded] = useState(true);
  const { t } = useLanguage();
  
  // Full phone number with country code
  const fullPhoneNumber = phone ? `${selectedCountry.dialCode} ${phone}` : "";

  const handlePrescriptionNext = async () => {
    if (!prescription.trim()) return;
    
    setExtractionError(null);
    setDebugResponse(null);
    setStep("extracting");
    
    try {
      const result = await extractPrescription(prescription);
      
      // Store debug response
      setDebugResponse(result);
      
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

  const updateItemField = (id: string, field: keyof ValidatedItem, value: string | number | null) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      
      // Handle numeric fields
      if (field === "pills_per_dose" || field === "doses_per_day" || 
          field === "treatment_duration_days" || field === "total_pills_required") {
        const numValue = value === "" || value === null ? null : Number(value);
        return { ...item, [field]: numValue };
      }
      
      return { ...item, [field]: value };
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (newItemForm.item_name_complete.trim()) {
      const manualItem: ValidatedItem = {
        id: `item-${Date.now()}`,
        item_type: newItemForm.item_type,
        item_name: newItemForm.item_name_complete.trim().split(" ")[0], // Extract first word as name
        item_name_complete: newItemForm.item_name_complete.trim(),
        pills_per_dose: newItemForm.pills_per_dose === "" ? null : Number(newItemForm.pills_per_dose),
        doses_per_day: newItemForm.doses_per_day === "" ? null : Number(newItemForm.doses_per_day),
        treatment_duration_days: newItemForm.treatment_duration_days === "" ? null : Number(newItemForm.treatment_duration_days),
        total_pills_required: newItemForm.total_pills_required === "" ? null : Number(newItemForm.total_pills_required),
        raw_prescription_text: `[Manual] ${newItemForm.item_name_complete.trim()}`,
        confidence_level: "high", // Manual items are high confidence since user entered them
        requires_human_review: false,
        validated: true, // Auto-validate manual items
      };
      setItems([...items, manualItem]);
      setNewItemForm(initialNewItemState);
      setShowNewItemForm(false);
    }
  };

  const updateNewItemField = (field: keyof typeof initialNewItemState, value: string | number) => {
    setNewItemForm(prev => ({ ...prev, [field]: value }));
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
        text: item.item_name_complete || item.raw_prescription_text,
        item_type: item.item_type,
        item_name: item.item_name,
        item_name_complete: item.item_name_complete,
        pills_per_dose: item.pills_per_dose,
        doses_per_day: item.doses_per_day,
        treatment_duration_days: item.treatment_duration_days,
        total_pills_required: item.total_pills_required,
        raw_prescription_text: item.raw_prescription_text,
        confidence_level: item.confidence_level,
        requires_human_review: item.requires_human_review,
      }));
      // Use full phone number with country code
      onSubmit({ items: prescriptionItems, phone: fullPhoneNumber });
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
    
    // Only show badge for medium or low confidence (not for high)
    if (confidence === "high") {
      return null;
    }
    
    const colors: Record<string, string> = {
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-red-100 text-red-800",
    };
    
    const labels: Record<string, string> = {
      medium: t("mediumConfidence"),
      low: t("lowConfidence"),
    };
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[confidence]}`}>
        <AlertTriangle className="w-3 h-3 inline mr-1" />
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

          <div className="space-y-4">
            {items.map((item, index) => (
              <div 
                key={item.id}
                className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                  item.validated 
                    ? "border-primary" 
                    : "border-border"
                }`}
              >
                <div className="flex">
                  {/* Left side: Form fields */}
                  <div className={`flex-1 p-4 transition-colors ${
                    item.validated ? "bg-primary/5" : "bg-card"
                  }`}>
                    {/* Header with item number, badges, and delete button */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-primary text-lg">#{index + 1}</span>
                        {getConfidenceBadge(item.confidence_level, item.requires_human_review)}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Editable fields */}
                    <div className="space-y-3">
                      {/* Row 1: Item Type and Full description */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            {t("itemType") || "Type"}
                          </label>
                          <select
                            value={item.item_type}
                            onChange={(e) => updateItemField(item.id, "item_type", e.target.value as "medication" | "food" | "procedure")}
                            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="medication">💊 {t("medication")}</option>
                            <option value="food">🍎 {t("food")}</option>
                            <option value="procedure">🩺 {t("procedure")}</option>
                          </select>
                        </div>
                        {/* item_name is stored but hidden from UI - Full description is used instead */}
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            {t("itemNameComplete") || "Full description"}
                          </label>
                          <Input
                            value={item.item_name_complete}
                            onChange={(e) => updateItemField(item.id, "item_name_complete", e.target.value)}
                            className="h-10 rounded-lg"
                            placeholder="e.g., Omeprazol 20mg capsules"
                          />
                        </div>
                      </div>

                      {/* Row 2: Numeric fields (for medication/food) */}
                      {(item.item_type === "medication" || item.item_type === "food") && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {item.item_type === "medication" && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                {t("pillsPerDose")}
                              </label>
                              <select
                                value={item.pills_per_dose ?? ""}
                                onChange={(e) => updateItemField(item.id, "pills_per_dose", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">--</option>
                                <option value="0.25">1/4</option>
                                <option value="0.5">1/2</option>
                                <option value="0.75">3/4</option>
                                <option value="1">1</option>
                                <option value="1.5">1 1/2</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                                <option value="9">9</option>
                                <option value="10">10</option>
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              {t("dosesPerDay")}
                            </label>
                            <select
                              value={item.doses_per_day ?? ""}
                              onChange={(e) => updateItemField(item.id, "doses_per_day", e.target.value)}
                              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">--</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="6">6</option>
                              <option value="7">7</option>
                              <option value="8">8</option>
                              <option value="9">9</option>
                              <option value="10">10</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              {t("durationDays")}
                            </label>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              value={item.treatment_duration_days ?? ""}
                              onChange={(e) => updateItemField(item.id, "treatment_duration_days", e.target.value)}
                              className="h-10 rounded-lg"
                              placeholder="0"
                            />
                          </div>
                          {item.item_type === "medication" && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                {t("totalPills")}
                              </label>
                              <Input
                                type="number"
                                step="1"
                                min="0"
                                value={item.total_pills_required ?? ""}
                                onChange={(e) => updateItemField(item.id, "total_pills_required", e.target.value)}
                                className="h-10 rounded-lg"
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Read-only section */}
                      <div className="mt-3 pt-3 border-t border-dashed border-muted-foreground/20">
                        <p className="text-xs text-muted-foreground/70 italic">
                          <span className="font-medium not-italic">{t("originalText") || "Original"}:</span> "{item.raw_prescription_text}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Validation button */}
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`w-20 md:w-24 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                      item.validated 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                    title={item.validated ? t("clickToUnvalidate") || "Click to unvalidate" : t("clickToValidate") || "Click to validate"}
                  >
                    {item.validated ? (
                      <>
                        <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
                        <span className="text-xs font-medium">{t("validated") || "OK"}</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-8 h-8 md:w-10 md:h-10" />
                        <span className="text-xs font-medium">{t("validate") || "Validate"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new item section */}
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-4">
            {!showNewItemForm ? (
              <button
                onClick={() => setShowNewItemForm(true)}
                className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors py-2"
              >
                <Plus className="w-5 h-5" />
                <span>{t("addItemPlaceholder")}</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{t("addNewItem") || "Add new item"}</h4>
                  <button
                    onClick={() => {
                      setShowNewItemForm(false);
                      setNewItemForm(initialNewItemState);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Row 1: Type and Full description */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {t("itemType") || "Type"}
                    </label>
                    <select
                      value={newItemForm.item_type}
                      onChange={(e) => updateNewItemField("item_type", e.target.value as "medication" | "food" | "procedure")}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="medication">💊 {t("medication")}</option>
                      <option value="food">🍎 {t("food")}</option>
                      <option value="procedure">🩺 {t("procedure")}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {t("itemNameComplete") || "Full description"} *
                    </label>
                    <Input
                      value={newItemForm.item_name_complete}
                      onChange={(e) => updateNewItemField("item_name_complete", e.target.value)}
                      className="h-10 rounded-lg"
                      placeholder="e.g., Omeprazol 20mg capsules"
                    />
                  </div>
                </div>

                {/* Row 2: Numeric fields (for medication/food) */}
                {(newItemForm.item_type === "medication" || newItemForm.item_type === "food") && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {newItemForm.item_type === "medication" && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {t("pillsPerDose")}
                        </label>
                        <select
                          value={newItemForm.pills_per_dose}
                          onChange={(e) => updateNewItemField("pills_per_dose", e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">--</option>
                          <option value="0.25">1/4</option>
                          <option value="0.5">1/2</option>
                          <option value="0.75">3/4</option>
                          <option value="1">1</option>
                          <option value="1.5">1 1/2</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="6">6</option>
                          <option value="7">7</option>
                          <option value="8">8</option>
                          <option value="9">9</option>
                          <option value="10">10</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        {t("dosesPerDay")}
                      </label>
                      <select
                        value={newItemForm.doses_per_day}
                        onChange={(e) => updateNewItemField("doses_per_day", e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">--</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        {t("durationDays")}
                      </label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={newItemForm.treatment_duration_days}
                        onChange={(e) => updateNewItemField("treatment_duration_days", e.target.value)}
                        className="h-10 rounded-lg"
                        placeholder="0"
                      />
                    </div>
                    {newItemForm.item_type === "medication" && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {t("totalPills")}
                        </label>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          value={newItemForm.total_pills_required}
                          onChange={(e) => updateNewItemField("total_pills_required", e.target.value)}
                          className="h-10 rounded-lg"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Add button */}
                <Button
                  onClick={addItem}
                  disabled={!newItemForm.item_name_complete.trim()}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("addItem") || "Add item"}
                </Button>
              </div>
            )}
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

          {/* Phone input - Split box layout */}
          <div className="rounded-xl border-2 border-secondary overflow-hidden">
            <div className="flex">
              {/* Left side: Country selector */}
              <div className="w-1/3 md:w-1/4 p-4 bg-card border-r border-border">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  {t("selectCountry") || "Country"}
                </label>
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const country = countries.find(c => c.code === e.target.value);
                    if (country) setSelectedCountry(country);
                  }}
                  className="w-full h-12 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.dialCode}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  {selectedCountry.name}
                </p>
              </div>
              
              {/* Right side: Phone number */}
              <div className="flex-1 p-4 bg-secondary/5">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  {t("phoneNumber") || "Phone number"}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-secondary">
                    {selectedCountry.dialCode}
                  </span>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="555 123 4567"
                    className="flex-1 h-12 text-lg px-3 rounded-lg border-2 border-secondary/30 bg-background focus:border-secondary focus:ring-2 focus:ring-secondary/20 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Validated items summary - showing form details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t("itemsValidated")} ({items.length})
              </p>
              <button 
                onClick={() => setStep("validate")}
                className="text-sm text-primary hover:underline"
              >
                {t("editItems")}
              </button>
            </div>
            
            <div className="space-y-2">
              {items.map((item, index) => (
                <div 
                  key={item.id}
                  className="bg-card rounded-lg border border-border p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getItemIcon(item.item_type)}
                        <span className="font-medium text-sm">{item.item_name_complete}</span>
                      </div>
                      
                      {/* Show medication/food details */}
                      {(item.item_type === "medication" || item.item_type === "food") && (
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {item.item_type === "medication" && item.pills_per_dose !== null && (
                            <span className="bg-muted px-2 py-0.5 rounded">
                              {item.pills_per_dose} {t("pillsPerDose")}
                            </span>
                          )}
                          {item.doses_per_day !== null && (
                            <span className="bg-muted px-2 py-0.5 rounded">
                              {item.doses_per_day}x/{t("day") || "day"}
                            </span>
                          )}
                          {item.treatment_duration_days !== null && (
                            <span className="bg-muted px-2 py-0.5 rounded">
                              {item.treatment_duration_days} {t("durationDays")}
                            </span>
                          )}
                          {item.item_type === "medication" && item.total_pills_required !== null && (
                            <span className="bg-muted px-2 py-0.5 rounded">
                              = {item.total_pills_required} {t("totalPills")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

      {/* Debug Panel - Shows extraction API response */}
      {showDebug && debugResponse && (
        <div className="mt-8 border-t border-dashed border-orange-300 pt-4">
          <button
            onClick={() => setDebugExpanded(!debugExpanded)}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-mono text-sm mb-2"
          >
            <Bug className="w-4 h-4" />
            <span>DEBUG: Extraction API Response</span>
            {debugExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {debugExpanded && (
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(debugResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionForm;
