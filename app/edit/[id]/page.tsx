import { getPost, getCategories, getUsers } from "@/lib/wordpress";
import { Navbar } from "@/components/Navbar";
import { PostEditForm } from "@/components/PostEditForm";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const postId = parseInt(id);

  if (isNaN(postId)) {
    notFound();
  }

  let post;
  try {
    post = await getPost(postId);
  } catch (error) {
    notFound();
  }

  // draft 상태가 아니면 상세 페이지로 리다이렉트
  if (post.status !== "draft") {
    redirect(`/posts/${postId}`);
  }

  const [categories, users] = await Promise.all([
    getCategories(),
    getUsers(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b-2 border-gray-200">
            <h1 className="text-senior-xl sm:text-senior-2xl font-bold">포스트 수정</h1>
            <p className="text-senior-sm sm:text-senior-base text-gray-600 mt-2">
              Draft 상태의 포스트만 수정할 수 있습니다
            </p>
          </div>

          <div className="px-4 sm:px-8 py-6 sm:py-8">
            <PostEditForm
              post={post}
              categories={categories}
              users={users}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
