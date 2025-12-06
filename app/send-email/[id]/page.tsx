import { getPost } from "@/lib/wordpress";
import { Navbar } from "@/components/Navbar";
import { EmailForm } from "@/components/EmailForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SendEmailPage({ params }: PageProps) {
  const { id } = await params;
  const postId = parseInt(id);

  let post;
  try {
    post = await getPost(postId);
  } catch (error) {
    console.error("포스트 조회 실패:", error);
    redirect("/posts");
  }

  // publish 상태가 아니면 리스트로 리다이렉트
  if (post.status !== "publish") {
    redirect("/posts");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-senior-2xl font-bold mb-2">이메일 보내기</h1>
          <p className="text-senior-base text-gray-600 mb-6">
            포스트: {post.title.rendered}
          </p>

          <EmailForm post={post} />
        </div>
      </main>
    </div>
  );
}
