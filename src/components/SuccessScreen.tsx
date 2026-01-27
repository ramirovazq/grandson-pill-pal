import { Button } from "@/components/ui/button";
import { Check, Heart, MessageCircle, Plus, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SuccessScreenProps {
  phone: string;
  onAddAnother: () => void;
}

const SuccessScreen = ({ phone, onAddAnother }: SuccessScreenProps) => {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-xl mx-auto text-center space-y-8 animate-fade-in">
      {/* Success Icon */}
      <div className="relative inline-block">
        <div className="w-32 h-32 rounded-full gradient-hero flex items-center justify-center shadow-button animate-pulse-soft">
          <Check className="w-16 h-16 text-primary-foreground" strokeWidth={3} />
        </div>
        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-secondary flex items-center justify-center shadow-soft animate-bounce-slow">
          <Heart className="w-6 h-6 text-secondary-foreground" />
        </div>
        <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-soft animate-float">
          <Sparkles className="w-5 h-5 text-accent-foreground" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-3">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {t("successTitle")}
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          {t("successSubtitle")}
        </p>
      </div>

      {/* Phone Confirmation */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-secondary" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">{t("remindersGoingTo")}</p>
            <p className="text-lg font-bold font-display text-foreground">{phone}</p>
          </div>
        </div>
      </div>

      {/* Example Message Preview */}
      <div className="bg-muted rounded-2xl p-4 max-w-sm mx-auto">
        <p className="text-sm text-muted-foreground mb-2">{t("previewMessage")}</p>
        <div className="bg-card rounded-xl p-4 text-left shadow-sm">
          <p className="text-sm text-foreground whitespace-pre-line">
            {t("sampleMessage")}
          </p>
        </div>
      </div>

      {/* Add Another Button */}
      <Button 
        onClick={onAddAnother}
        size="lg"
        variant="outline"
        className="gap-2"
      >
        <Plus className="w-5 h-5" />
        {t("addAnother")}
      </Button>

      {/* Fun Footer */}
      <p className="text-sm text-muted-foreground">
        {t("madeWith")} 💖 {t("forKeeping")}
      </p>
    </div>
  );
};

export default SuccessScreen;
