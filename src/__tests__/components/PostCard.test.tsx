import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PostCard from "@/components/PostCard";

const mockPost = {
  slug: "test-post",
  title: "Test Post Title",
  excerpt: "This is a test excerpt for the post.",
  coverImage: null,
  createdAt: new Date().toISOString(),
  author: { name: "Author Name", image: null },
  categories: [{ name: "Tech", slug: "tech" }],
  tags: [{ name: "React", slug: "react" }],
  _count: { comments: 5 },
};

describe("PostCard", () => {
  it("renders the post title", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("renders the excerpt", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("This is a test excerpt for the post.")).toBeInTheDocument();
  });

  it("renders the author name", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Author Name")).toBeInTheDocument();
  });

  it("renders category badges", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Tech")).toBeInTheDocument();
  });

  it("renders tag badges", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders comment count", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("5 comments")).toBeInTheDocument();
  });

  it("renders a link to the post", () => {
    render(<PostCard post={mockPost} />);
    const link = screen.getByRole("link", { name: "Test Post Title" });
    expect(link).toHaveAttribute("href", "/blog/test-post");
  });
});
