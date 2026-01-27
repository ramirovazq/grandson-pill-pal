import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "es";

interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}

export const translations: Translations = {
  // Header
  appName: { en: "PillPal", es: "PillPal" },
  tagline: { en: "Because grandma's health is no joke", es: "Porque la salud de la abuela no es broma" },
  
  // Step indicators
  step1of2: { en: "Step 1 of 2", es: "Paso 1 de 2" },
  step2of2: { en: "Step 2 of 2", es: "Paso 2 de 2" },
  
  // Prescription form
  prescriptionTitle: { en: "What's on the prescription? 📋", es: "¿Qué dice la receta? 📋" },
  prescriptionSubtitle: { en: "Type it out exactly as it says - we'll make sure grandma never forgets a pill! 💊", es: "Escríbelo tal como dice - ¡nos aseguraremos de que la abuela nunca olvide una pastilla! 💊" },
  prescriptionPlaceholder: { en: "Example: Take 1 blue pill every morning with food. Take 2 white pills at night before bed...", es: "Ejemplo: Tomar 1 pastilla azul cada mañana con comida. Tomar 2 pastillas blancas por la noche antes de dormir..." },
  beSpecific: { en: "Be specific!", es: "¡Sé específico!" },
  nextAddPhone: { en: "Next: Add Phone Number", es: "Siguiente: Agregar Teléfono" },
  
  // Phone form
  phoneTitle: { en: "Where should we send reminders? 📱", es: "¿A dónde enviamos los recordatorios? 📱" },
  phoneSubtitle: { en: "We'll text them friendly reminders so they never miss a dose!", es: "¡Les enviaremos recordatorios amigables para que nunca olviden una dosis!" },
  prescriptionSaved: { en: "Prescription saved:", es: "Receta guardada:" },
  editPrescription: { en: "← Edit prescription", es: "← Editar receta" },
  smartTiming: { en: "Smart timing", es: "Horarios inteligentes" },
  withLove: { en: "With love", es: "Con amor" },
  startReminders: { en: "Start Sending Reminders", es: "Comenzar a Enviar Recordatorios" },
  
  // Success screen
  successTitle: { en: "You're a Superstar! 🌟", es: "¡Eres una Estrella! 🌟" },
  successSubtitle: { en: "Your loved one is all set! They'll get friendly pill reminders that'll make staying healthy feel like a breeze.", es: "¡Tu ser querido está listo! Recibirán recordatorios amigables que harán que mantenerse saludable sea muy fácil." },
  remindersGoingTo: { en: "Reminders going to:", es: "Recordatorios irán a:" },
  previewMessage: { en: "Preview message:", es: "Vista previa del mensaje:" },
  sampleMessage: { en: "💊 Hey there! Time for your morning medicine!\nRemember to take it with food. You got this! 💪", es: "💊 ¡Hola! ¡Es hora de tu medicina de la mañana!\nRecuerda tomarla con comida. ¡Tú puedes! 💪" },
  addAnother: { en: "Add Another Prescription", es: "Agregar Otra Receta" },
  
  // Footer
  madeWith: { en: "Made with", es: "Hecho con" },
  forKeeping: { en: "for keeping loved ones healthy", es: "para mantener sanos a los que amas" },
  
  // Settings
  language: { en: "Language", es: "Idioma" },
  theme: { en: "Theme", es: "Tema" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
