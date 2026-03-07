import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PodcastCard from "@/components/PodcastCard";

const mockPodcast = {
  slug: "test-podcast",
  title: "Test Podcast Episode",
  description: "A great episode about web development.",
  coverImage: null,
  audioUrl: "https://example.com/audio.mp3",
  duration: 3600,
  createdAt: new Date().toISOString(),
  author: { name: "Podcast Host", image: null },
  categories: [{ name: "Tech", slug: "tech" }],
  tags: [{ name: "JavaScript", slug: "javascript" }],
};

describe("PodcastCard", () => {
  it("renders the podcast title", () => {
    render(<PodcastCard podcast={mockPodcast} />);
    expect(screen.getByText("Test Podcast Episode")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<PodcastCard podcast={mockPodcast} />);
    expect(screen.getByText("A great episode about web development.")).toBeInTheDocument();
  });

  it("renders the author name", () => {
    render(<PodcastCard podcast={mockPodcast} />);
    expect(screen.getByText("Podcast Host")).toBeInTheDocument();
  });

  it("renders formatted duration", () => {
    render(<PodcastCard podcast={mockPodcast} />);
    expect(screen.getByText("🎧 60:00")).toBeInTheDocument();
  });

  it("renders an audio element", () => {
    render(<PodcastCard podcast={mockPodcast} />);
    const audio = document.querySelector("audio");
    expect(audio).toBeInTheDocument();
  });

  it("renders a link to the podcast detail page", () => {
    render(<PodcastCard podcast={mockPodcast} />);
    const link = screen.getByRole("link", { name: "Listen" });
    expect(link).toHaveAttribute("href", "/podcasts/test-podcast");
  });
});
