import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import FloatingPills from "./FloatingPills";

describe("FloatingPills", () => {
  it("should render the component", () => {
    const { container } = render(<FloatingPills />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("should render all pill emojis", () => {
    const { container } = render(<FloatingPills />);

    const expectedEmojis = ["💊", "💉", "🩺", "❤️", "⏰", "🌟", "💪", "🏥"];

    expectedEmojis.forEach((emoji) => {
      expect(container.textContent).toContain(emoji);
    });
  });

  it("should render 8 floating elements", () => {
    const { container } = render(<FloatingPills />);

    // The container has a wrapper div with 8 children
    const floatingElements = container.querySelectorAll(".animate-float");
    expect(floatingElements).toHaveLength(8);
  });

  it("should have correct container styles", () => {
    const { container } = render(<FloatingPills />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("fixed");
    expect(wrapper).toHaveClass("inset-0");
    expect(wrapper).toHaveClass("pointer-events-none");
    expect(wrapper).toHaveClass("overflow-hidden");
    expect(wrapper).toHaveClass("z-0");
  });

  it("should apply animation styles to each pill", () => {
    const { container } = render(<FloatingPills />);

    const floatingElements = container.querySelectorAll(".animate-float");

    floatingElements.forEach((element) => {
      const style = element.getAttribute("style");
      expect(style).toContain("animation-delay");
      expect(style).toContain("animation-duration");
    });
  });

  it("should apply opacity class to all pills", () => {
    const { container } = render(<FloatingPills />);

    const floatingElements = container.querySelectorAll(".animate-float");

    floatingElements.forEach((element) => {
      expect(element).toHaveClass("opacity-30");
    });
  });

  it("should have different sizes for pills", () => {
    const { container } = render(<FloatingPills />);

    const floatingElements = container.querySelectorAll(".animate-float");
    const sizes = new Set<string>();

    floatingElements.forEach((element) => {
      if (element.classList.contains("text-2xl")) sizes.add("text-2xl");
      if (element.classList.contains("text-3xl")) sizes.add("text-3xl");
      if (element.classList.contains("text-4xl")) sizes.add("text-4xl");
    });

    // Should have at least 2 different sizes
    expect(sizes.size).toBeGreaterThanOrEqual(2);
  });

  it("should position elements absolutely", () => {
    const { container } = render(<FloatingPills />);

    const floatingElements = container.querySelectorAll(".animate-float");

    floatingElements.forEach((element) => {
      expect(element).toHaveClass("absolute");
    });
  });
});
