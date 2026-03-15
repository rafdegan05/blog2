import UserProfileContent from "@/components/UserProfileContent";
import { prisma } from "@/lib/prisma";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

async function getUserProfile(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      bannerImage: true,
      bio: true,
      role: true,
      banned: true,
      createdAt: true,
      _count: {
        select: {
          posts: { where: { published: true, moderation: "APPROVED" } },
          podcasts: { where: { published: true, moderation: "APPROVED" } },
          comments: true,
        },
      },
      posts: {
        where: { published: true, moderation: "APPROVED" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          content: true,
          createdAt: true,
          categories: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          post: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!user || user.banned) return null;

  const posts = user.posts.map((p) => {
    const words = p.content?.trim().split(/\s+/).length ?? 0;
    return {
      ...p,
      content: undefined,
      createdAt: p.createdAt.toISOString(),
      readingTime: Math.max(1, Math.round(words / 200)),
    };
  });

  const comments = user.comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return {
    id: user.id,
    name: user.name,
    image: user.image,
    bannerImage: user.bannerImage,
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    _count: user._count,
    posts,
    comments,
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params;
  const profile = await getUserProfile(id);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-base-content/60">This user doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return <UserProfileContent profile={profile} />;
}
