import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz");
  });

  it("should handle undefined and null values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("should merge tailwind classes correctly", () => {
    // twMerge should handle conflicting tailwind classes
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("should handle arrays of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("should handle object syntax", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("should handle complex combinations", () => {
    const result = cn(
      "base-class",
      true && "conditional-true",
      false && "conditional-false",
      { "object-true": true, "object-false": false },
      ["array-class"]
    );
    expect(result).toBe("base-class conditional-true object-true array-class");
  });
});
