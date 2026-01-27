import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrescriptionForm from "./PrescriptionForm";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Wrapper component with required providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(<LanguageProvider>{component}</LanguageProvider>);
};

describe("PrescriptionForm", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
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

    it("should proceed to validation step when next is clicked", async () => {
      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(/Example:/i);
      await userEvent.type(textarea, "Take 1 pill in the morning");

      const nextButton = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      await userEvent.click(nextButton);

      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    });
  });

  describe("Step 2: Validation", () => {
    const goToValidationStep = async () => {
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
    };

    it("should parse prescription into separate items", async () => {
      await goToValidationStep();

      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
      expect(
        screen.getByText(/Take 1 blue pill in the morning/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Take 2 white pills at night/i)
      ).toBeInTheDocument();
    });

    it("should have checkboxes for each item", async () => {
      await goToValidationStep();

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBe(2);
    });

    it("should disable next button until all items are validated", async () => {
      await goToValidationStep();

      const nextButton = screen.getByRole("button", {
        name: /Next: Add Phone/i,
      });
      expect(nextButton).toBeDisabled();
    });

    it("should enable next button when all items are checked", async () => {
      await goToValidationStep();

      const checkboxes = screen.getAllByRole("checkbox");
      for (const checkbox of checkboxes) {
        await userEvent.click(checkbox);
      }

      const nextButton = screen.getByRole("button", {
        name: /Next: Add Phone/i,
      });
      expect(nextButton).toBeEnabled();
    });

    it("should allow adding a new item", async () => {
      await goToValidationStep();

      const input = screen.getByPlaceholderText(/Add another medication/i);
      await userEvent.type(input, "Take vitamins daily");

      // Find the add button by looking for the button next to the input (with plus icon)
      const allButtons = screen.getAllByRole("button");
      const addButton = allButtons.find((btn) => 
        btn.querySelector(".lucide-plus")
      );
      expect(addButton).toBeDefined();
      await userEvent.click(addButton!);

      expect(screen.getByText(/Take vitamins daily/i)).toBeInTheDocument();
      expect(screen.getAllByRole("checkbox").length).toBe(3);
    });

    it("should allow removing an item", async () => {
      await goToValidationStep();

      // Find all delete buttons (with trash icon)
      const allButtons = screen.getAllByRole("button");
      const deleteButtons = allButtons.filter((btn) => 
        btn.querySelector(".lucide-trash2")
      );
      
      expect(deleteButtons.length).toBe(2);
      await userEvent.click(deleteButtons[0]);

      expect(screen.getAllByRole("checkbox").length).toBe(1);
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
      renderWithProviders(<PrescriptionForm onSubmit={mockOnSubmit} />);

      // Step 1: Enter prescription
      const textarea = screen.getByPlaceholderText(/Example:/i);
      await userEvent.type(textarea, "Take 1 pill");

      const nextButton1 = screen.getByRole("button", {
        name: /Next: Validate Items/i,
      });
      await userEvent.click(nextButton1);

      // Step 2: Validate all items
      const checkbox = screen.getByRole("checkbox");
      await userEvent.click(checkbox);

      const nextButton2 = screen.getByRole("button", {
        name: /Next: Add Phone/i,
      });
      await userEvent.click(nextButton2);
    };

    it("should render phone input in step 3", async () => {
      await goToPhoneStep();

      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/\+1 \(555\) 123-4567/i)
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

      const phoneInput = screen.getByPlaceholderText(/\+1 \(555\) 123-4567/i);
      await userEvent.type(phoneInput, "+1 555 123 4567");

      const submitButton = screen.getByRole("button", {
        name: /Start Sending Reminders/i,
      });
      expect(submitButton).toBeEnabled();
    });

    it("should call onSubmit with items and phone when submitted", async () => {
      await goToPhoneStep();

      const phoneInput = screen.getByPlaceholderText(/\+1 \(555\) 123-4567/i);
      await userEvent.type(phoneInput, "+1 555 123 4567");

      const submitButton = screen.getByRole("button", {
        name: /Start Sending Reminders/i,
      });
      await userEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        items: [{ text: "Take 1 pill" }],
        phone: "+1 555 123 4567",
      });
    });

    it("should show validated items summary", async () => {
      await goToPhoneStep();

      expect(screen.getByText(/Items validated/i)).toBeInTheDocument();
      // The text "Take 1 pill" should be in the summary list
      expect(screen.getByText(/Take 1 pill/i)).toBeInTheDocument();
    });

    it("should allow going back to edit items", async () => {
      await goToPhoneStep();

      const editButton = screen.getByText(/Edit items/i);
      await userEvent.click(editButton);

      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    });
  });
});
