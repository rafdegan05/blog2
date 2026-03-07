import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";

describe("Footer", () => {
  it("renders the blog link", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/blog");
  });

  it("renders the podcast link", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Podcasts" })).toHaveAttribute("href", "/podcasts");
  });

  it("renders the sign in link", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/auth/signin");
  });

  it("renders the copyright year", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
