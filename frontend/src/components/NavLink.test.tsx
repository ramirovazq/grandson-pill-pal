import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { NavLink } from "./NavLink";

describe("NavLink", () => {
  const renderNavLink = (
    props: React.ComponentProps<typeof NavLink>,
    initialRoute = "/"
  ) => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<NavLink {...props} />} />
          <Route path="/about" element={<div>About Page</div>} />
          <Route path="/contact" element={<NavLink {...props} />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("should render a link with correct text", () => {
    renderNavLink({ to: "/about", children: "About" });

    const link = screen.getByRole("link", { name: "About" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/about");
  });

  it("should apply base className", () => {
    renderNavLink({
      to: "/about",
      children: "About",
      className: "base-class",
    });

    const link = screen.getByRole("link");
    expect(link).toHaveClass("base-class");
  });

  it("should apply activeClassName when route is active", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <NavLink
          to="/about"
          className="base-class"
          activeClassName="active-class"
        >
          About
        </NavLink>
      </MemoryRouter>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveClass("base-class");
    expect(link).toHaveClass("active-class");
  });

  it("should not apply activeClassName when route is not active", () => {
    renderNavLink({
      to: "/about",
      children: "About",
      className: "base-class",
      activeClassName: "active-class",
    });

    const link = screen.getByRole("link");
    expect(link).toHaveClass("base-class");
    expect(link).not.toHaveClass("active-class");
  });

  it("should forward ref correctly", () => {
    const ref = vi.fn();

    render(
      <MemoryRouter>
        <NavLink to="/about" ref={ref}>
          About
        </NavLink>
      </MemoryRouter>
    );

    expect(ref).toHaveBeenCalled();
  });

  it("should pass additional props to RouterNavLink", () => {
    render(
      <MemoryRouter>
        <NavLink to="/about" data-testid="nav-link" aria-label="Navigate to about">
          About
        </NavLink>
      </MemoryRouter>
    );

    const link = screen.getByTestId("nav-link");
    expect(link).toHaveAttribute("aria-label", "Navigate to about");
  });

  it("should handle multiple class combinations", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <NavLink
          to="/about"
          className="text-base px-4"
          activeClassName="text-primary underline"
        >
          About
        </NavLink>
      </MemoryRouter>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveClass("text-base");
    expect(link).toHaveClass("px-4");
    expect(link).toHaveClass("text-primary");
    expect(link).toHaveClass("underline");
  });

  it("should work without optional className props", () => {
    renderNavLink({ to: "/about", children: "About" });

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });
});
