import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrescriptionForm from "./PrescriptionForm";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Mock the extractor API
vi.mock("@/api", async () => {
  const actual = await vi.importActual("@/api");
  return {
    ...actual,
    extractPrescription: vi.fn(),
  };
});

import { extractPrescription } from "@/api";

const mockExtractPrescription = vi.mocked(extractPrescription);

// Wrapper component with required providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(<LanguageProvider>{component}</LanguageProvider>);
};

// Mock extraction response
const mockExtractionResponse = {
  items: [
    {
      item_type: "medication" as const,
      item_name: "Blue pill",
      item_name_complete: "Take 1 blue pill in the morning",
      pills_per_dose: 1,
      doses_per_day: 1,
      treatment_duration_days: 7,
      total_pills_required: 7,
      raw_prescription_text: "Take 1 blue pill in the morning",
      confidence_level: "high" as const,
      requires_human_review: false,
    },
    {
      item_type: "medication" as const,
      item_name: "White pills",
      item_name_complete: "Take 2 white pills at night",
      pills_per_dose: 2,
      doses_per_day: 1,
      treatment_duration_days: 7,
      total_pills_required: 14,
      raw_prescription_text: "Take 2 white pills at night",
      confidence_level: "high" as const,
      requires_human_review: false,
    },
  ],
};

const mockSingleItemResponse = {
  items: [
    {
      item_type: "medication" as const,
      item_name: "Pill",
      item_name_complete: "Take 1 pill",
      pills_per_dose: 1,
      doses_per_day: 1,
      treatment_duration_days: null,
      total_pills_required: null,
      raw_prescription_text: "Take 1 pill",
      confidence_level: "medium" as const,
      requires_human_review: false,
    },
  ],
};

describe("PrescriptionForm", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockExtractPrescription.mockClear();
  });

  describe("Step 1: Prescription Input", () => {
    it("should render the prescription textarea", () => {
      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Example:/i)
      ).toBeInTheDocument();
    });

    it("should disable the next button when prescription is empty", () => {
      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      const nextButton = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      expect(nextButton).toBeDisabled();
    });

    it("should enable the next button when prescription has content", async () => {
      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(/Example:/i);
      await userEvent.type(textarea, "Take 1 pill in the morning");

      const nextButton = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      expect(nextButton).toBeEnabled();
    });

    it("should call extractPrescription when next button is clicked", async () => {
      mockExtractPrescription.mockResolvedValue(mockSingleItemResponse);

      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(/Example:/i);
      await userEvent.type(textarea, "Omeoprazol 5mg cada 24 horas");

      const nextButton = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      await userEvent.click(nextButton);

      // Verify extractPrescription was called with the prescription text
      expect(mockExtractPrescription).toHaveBeenCalledTimes(1);
      expect(mockExtractPrescription).toHaveBeenCalledWith("Omeoprazol 5mg cada 24 horas");

      // Wait for extraction to complete
      await waitFor(() => {
        expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      });
    });

    it("should show loading state while extracting", async () => {
      // Make extraction take time
      mockExtractPrescription.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSingleItemResponse), 100))
      );

      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(/Example:/i);
      await userEvent.type(textarea, "Take 1 pill in the morning");

      const nextButton = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      await userEvent.click(nextButton);

      // Should show loading state
      expect(screen.getByText(/Analyzing prescription/i)).toBeInTheDocument();

      // Wait for extraction to complete
      await waitFor(() => {
        expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      });
    });

    it("should proceed to validation step after successful extraction", async () => {
      mockExtractPrescription.mockResolvedValue(mockExtractionResponse);

      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(/Example:/i);
      await userEvent.type(textarea, "Take 1 blue pill. Take 2 white pills");

      const nextButton = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      });
    });

    it("should show error message on extraction failure", async () => {
      mockExtractPrescription.mockRejectedValue(new Error("API Error"));

      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(/Example:/i);
      await userEvent.type(textarea, "Take 1 pill");

      const nextButton = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to analyze prescription/i)).toBeInTheDocument();
      });

      // Should stay on step 1
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });
  });

  describe("Step 2: Validation", () => {
    const goToValidationStep = async () => {
      mockExtractPrescription.mockResolvedValue(mockExtractionResponse);

      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(/Example:/i);
      await userEvent.type(
        textarea,
        "Take 1 blue pill in the morning. Take 2 white pills at night"
      );

      const nextButton = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      });
    };

    it("should display extracted items", async () => {
      await goToValidationStep();

      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
      // Text appears in multiple places (label and raw text), use getAllByText
      expect(
        screen.getAllByText(/Take 1 blue pill in the morning/i).length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(/Take 2 white pills at night/i).length
      ).toBeGreaterThan(0);
    });

    it("should show medication type badge", async () => {
      await goToValidationStep();

      const badges = screen.getAllByText(/Medication/i);
      expect(badges.length).toBeGreaterThan(0);
    });

    it("should have validate buttons for each item", async () => {
      await goToValidationStep();

      // Check that we have 2 items by looking for item numbers
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
      
      // Find validate buttons by looking for buttons with Circle icons
      const allButtons = screen.getAllByRole("button");
      const validateButtons = allButtons.filter((btn) => 
        btn.querySelector(".lucide-circle") || btn.querySelector(".lucide-check-circle-2")
      );
      expect(validateButtons.length).toBe(2);
    });

    it("should disable next button until all items are validated", async () => {
      await goToValidationStep();

      const nextButton = screen.getByRole("button", {
        name: /Next: Add Phone/i,
      });
      expect(nextButton).toBeDisabled();
    });

    it("should enable next button when all items are validated", async () => {
      await goToValidationStep();

      // Find validate buttons by looking for buttons with Circle icons
      const allButtons = screen.getAllByRole("button");
      const validateButtons = allButtons.filter((btn) => 
        btn.querySelector(".lucide-circle")
      );
      
      for (const validateBtn of validateButtons) {
        await userEvent.click(validateBtn);
      }

      const nextButton = screen.getByRole("button", {
        name: /Next: Add Phone/i,
      });
      expect(nextButton).toBeEnabled();
    });

    it("should allow adding a new item", async () => {
      await goToValidationStep();

      // Click on "Add another item..." to open the form
      const addAnotherButton = screen.getByText(/Add another item/i);
      await userEvent.click(addAnotherButton);

      // Wait for form to appear, then find all inputs with the description placeholder
      // The new item form input is the last one
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^Add item$/i })).toBeInTheDocument();
      });
      
      const descriptionInputs = screen.getAllByPlaceholderText(/Omeprazol 20mg/i);
      const newItemDescriptionInput = descriptionInputs[descriptionInputs.length - 1];
      await userEvent.type(newItemDescriptionInput, "Take vitamins daily");

      // Click the "Add item" button
      const addItemButton = screen.getByRole("button", { name: /^Add item$/i });
      await userEvent.click(addItemButton);

      // The text appears in multiple places (label and raw text), so use getAllByText
      const vitaminsTexts = screen.getAllByText(/Take vitamins daily/i);
      expect(vitaminsTexts.length).toBeGreaterThan(0);
      
      // We should now have 3 items total (2 from extraction + 1 manual)
      // Check by counting item numbers (#1, #2, #3)
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
      expect(screen.getByText("#3")).toBeInTheDocument();
    });

    it("should allow removing an item", async () => {
      await goToValidationStep();

      // Initially we have 2 items
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();

      // Find all delete buttons (with trash icon)
      const allButtons = screen.getAllByRole("button");
      const deleteButtons = allButtons.filter((btn) => 
        btn.querySelector(".lucide-trash2")
      );
      
      expect(deleteButtons.length).toBe(2);
      await userEvent.click(deleteButtons[0]);

      // After removing, should have 1 item left (numbered #1)
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.queryByText("#2")).not.toBeInTheDocument();
    });

    it("should go back to prescription step when edit is clicked", async () => {
      await goToValidationStep();

      const editButton = screen.getByRole("button", {
        name: /Edit prescription/i,
      });
      await userEvent.click(editButton);

      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });
  });

  describe("Step 3: Phone Input", () => {
    const goToPhoneStep = async () => {
      mockExtractPrescription.mockResolvedValue(mockSingleItemResponse);

      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      // Step 1: Enter prescription
      const textarea = screen.getByPlaceholderText(/Example:/i);
      await userEvent.type(textarea, "Take 1 pill");

      const nextButton1 = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      await userEvent.click(nextButton1);

      // Wait for extraction
      await waitFor(() => {
        expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      });

      // Step 2: Validate all items - find the validate button (Circle icon)
      const allButtons = screen.getAllByRole("button");
      const validateButton = allButtons.find((btn) => 
        btn.querySelector(".lucide-circle")
      );
      expect(validateButton).toBeDefined();
      await userEvent.click(validateButton!);

      const nextButton2 = screen.getByRole("button", {
        name: /Next: Add Phone/i,
      });
      await userEvent.click(nextButton2);
    };

    it("should render phone input in step 3", async () => {
      await goToPhoneStep();

      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/555 123 4567/i)
      ).toBeInTheDocument();
    });

    it("should disable submit button when phone is empty", async () => {
      await goToPhoneStep();

      const submitButton = screen.getByRole("button", {
        name: /Start Sending Reminders/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when phone is entered", async () => {
      await goToPhoneStep();

      const phoneInput = screen.getByPlaceholderText(/555 123 4567/i);
      await userEvent.type(phoneInput, "5551234567");

      const submitButton = screen.getByRole("button", {
        name: /Start Sending Reminders/i,
      });
      expect(submitButton).toBeEnabled();
    });

    it("should call onSubmit with items and phone when submitted", async () => {
      await goToPhoneStep();

      const phoneInput = screen.getByPlaceholderText(/555 123 4567/i);
      await userEvent.type(phoneInput, "5551234567");

      const submitButton = screen.getByRole("button", {
        name: /Start Sending Reminders/i,
      });
      await userEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        items: [{ text: "Take 1 pill" }],
        phone: "+52 5551234567", // Default country is Mexico (+52)
      });
    });

    it("should show validated items summary", async () => {
      await goToPhoneStep();

      expect(screen.getByText(/Items validated/i)).toBeInTheDocument();
      // The item name should be in the summary (may appear multiple times due to debug panel)
      expect(screen.getAllByText(/Take 1 pill/i).length).toBeGreaterThan(0);
    });

    it("should allow going back to edit items", async () => {
      await goToPhoneStep();

      const editButton = screen.getByText(/Edit items/i);
      await userEvent.click(editButton);

      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("should show loading state when isLoading prop is true", async () => {
      mockExtractPrescription.mockResolvedValue(mockSingleItemResponse);

      renderWithProviders(
        <PrescriptionForm onSubmit={mockOnSubmit} isLoading={true} />
      );

      // Go through all steps to reach submit
      const textarea = screen.getByPlaceholderText(/Example:/i);
      await userEvent.type(textarea, "Take 1 pill");

      const nextButton1 = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      await userEvent.click(nextButton1);

      await waitFor(() => {
        expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      });

      // Find and click the validate button
      const allButtons = screen.getAllByRole("button");
      const validateButton = allButtons.find((btn) => 
        btn.querySelector(".lucide-circle")
      );
      await userEvent.click(validateButton!);

      const nextButton2 = screen.getByRole("button", {
        name: /Next: Add Phone/i,
      });
      await userEvent.click(nextButton2);

      const phoneInput = screen.getByPlaceholderText(/555 123 4567/i);
      await userEvent.type(phoneInput, "5551234567");

      // Submit button should show loading state and be disabled
      expect(screen.getByText(/Sending/i)).toBeInTheDocument();
      const sendingButton = screen.getByText(/Sending/i).closest("button");
      expect(sendingButton).toBeDisabled();
    });
  });
});
