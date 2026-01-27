import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SuccessScreen from "./SuccessScreen";
import { LanguageProvider } from "@/contexts/LanguageContext";

const renderWithProviders = (component: React.ReactElement) => {
  return render(<LanguageProvider>{component}</LanguageProvider>);
};

describe("SuccessScreen", () => {
  const mockOnAddAnother = vi.fn();
  const testPhone = "+1 555 123 4567";

  beforeEach(() => {
    mockOnAddAnother.mockClear();
  });

  it("should render success message", () => {
    renderWithProviders(
      <SuccessScreen phone={testPhone} onAddAnother={mockOnAddAnother} />
    );

    expect(screen.getByText(/You're a Superstar!/i)).toBeInTheDocument();
  });

  it("should display the phone number", () => {
    renderWithProviders(
      <SuccessScreen phone={testPhone} onAddAnother={mockOnAddAnother} />
    );

    expect(screen.getByText(testPhone)).toBeInTheDocument();
    expect(screen.getByText(/Reminders going to:/i)).toBeInTheDocument();
  });

  it("should display a preview message", () => {
    renderWithProviders(
      <SuccessScreen phone={testPhone} onAddAnother={mockOnAddAnother} />
    );

    expect(screen.getByText(/Preview message:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Time for your morning medicine!/i)
    ).toBeInTheDocument();
  });

  it("should render the Add Another button", () => {
    renderWithProviders(
      <SuccessScreen phone={testPhone} onAddAnother={mockOnAddAnother} />
    );

    const addButton = screen.getByRole("button", {
      name: /Add Another Prescription/i,
    });
    expect(addButton).toBeInTheDocument();
  });

  it("should call onAddAnother when button is clicked", () => {
    renderWithProviders(
      <SuccessScreen phone={testPhone} onAddAnother={mockOnAddAnother} />
    );

    const addButton = screen.getByRole("button", {
      name: /Add Another Prescription/i,
    });
    fireEvent.click(addButton);

    expect(mockOnAddAnother).toHaveBeenCalledTimes(1);
  });

  it("should display the footer message", () => {
    renderWithProviders(
      <SuccessScreen phone={testPhone} onAddAnother={mockOnAddAnother} />
    );

    expect(screen.getByText(/Made with/i)).toBeInTheDocument();
    expect(screen.getByText(/for keeping loved ones healthy/i)).toBeInTheDocument();
  });

  it("should render success icons", () => {
    const { container } = renderWithProviders(
      <SuccessScreen phone={testPhone} onAddAnother={mockOnAddAnother} />
    );

    // Check for the check icon (success indicator)
    const checkIcon = container.querySelector(".lucide-check");
    expect(checkIcon).toBeInTheDocument();

    // Check for the heart icon
    const heartIcon = container.querySelector(".lucide-heart");
    expect(heartIcon).toBeInTheDocument();
  });

  it("should display different phone numbers correctly", () => {
    const differentPhone = "+44 20 7946 0958";
    
    renderWithProviders(
      <SuccessScreen phone={differentPhone} onAddAnother={mockOnAddAnother} />
    );

    expect(screen.getByText(differentPhone)).toBeInTheDocument();
  });
});
