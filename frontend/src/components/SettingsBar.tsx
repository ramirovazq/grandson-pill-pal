import { Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const SettingsBar = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* Language Toggle */}
      <Button
        variant="pill"
        size="sm"
        onClick={toggleLanguage}
        className="gap-2 px-4"
      >
        <Globe className="w-4 h-4" />
        <span className="font-semibold">{language === "en" ? "ES" : "EN"}</span>
      </Button>

      {/* Theme Toggle */}
      <Button
        variant="pill"
        size="icon"
        onClick={toggleTheme}
        className="w-10 h-10"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
};

export default SettingsBar;
