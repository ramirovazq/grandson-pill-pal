import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageProvider, useLanguage, translations } from "./LanguageContext";

// Test component to access the context
const TestConsumer = () => {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="translation">{t("appName")}</span>
      <span data-testid="tagline">{t("tagline")}</span>
      <button onClick={() => setLanguage("es")}>Switch to Spanish</button>
      <button onClick={() => setLanguage("en")}>Switch to English</button>
    </div>
  );
};

describe("LanguageContext", () => {
  describe("LanguageProvider", () => {
    it("should provide default language as 'en'", () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      expect(screen.getByTestId("language").textContent).toBe("en");
    });

    it("should translate keys correctly in English", () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      expect(screen.getByTestId("translation").textContent).toBe("Grandson Pill Pal");
      expect(screen.getByTestId("tagline").textContent).toBe(
        "Because grandma's health is no joke"
      );
    });

    it("should switch language to Spanish", () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByText("Switch to Spanish"));

      expect(screen.getByTestId("language").textContent).toBe("es");
      expect(screen.getByTestId("tagline").textContent).toBe(
        "Porque la salud de la abuela no es broma"
      );
    });

    it("should switch back to English", () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      // Switch to Spanish first
      fireEvent.click(screen.getByText("Switch to Spanish"));
      expect(screen.getByTestId("language").textContent).toBe("es");

      // Switch back to English
      fireEvent.click(screen.getByText("Switch to English"));
      expect(screen.getByTestId("language").textContent).toBe("en");
    });

    it("should return the key if translation is not found", () => {
      const TestMissingKey = () => {
        const { t } = useLanguage();
        return <span data-testid="missing">{t("nonExistentKey")}</span>;
      };

      render(
        <LanguageProvider>
          <TestMissingKey />
        </LanguageProvider>
      );

      expect(screen.getByTestId("missing").textContent).toBe("nonExistentKey");
    });
  });

  describe("useLanguage hook", () => {
    it("should throw error when used outside LanguageProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useLanguage must be used within a LanguageProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("translations object", () => {
    it("should have all required keys", () => {
      const requiredKeys = [
        "appName",
        "tagline",
        "step1of3",
        "step2of3",
        "step3of3",
        "prescriptionTitle",
        "prescriptionSubtitle",
        "successTitle",
        "successSubtitle",
      ];

      requiredKeys.forEach((key) => {
        expect(translations).toHaveProperty(key);
        expect(translations[key]).toHaveProperty("en");
        expect(translations[key]).toHaveProperty("es");
      });
    });

    it("should have non-empty translations for all keys", () => {
      Object.entries(translations).forEach(([key, value]) => {
        expect(value.en).toBeTruthy();
        expect(value.es).toBeTruthy();
      });
    });
  });
});
