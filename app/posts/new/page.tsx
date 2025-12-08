import { getCategories, getUsers } from "@/lib/wordpress";
import { Navbar } from "@/components/Navbar";
import { PostForm } from "@/components/PostForm";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
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
            <h1 className="text-senior-xl sm:text-senior-2xl font-bold">새 포스트 작성</h1>
          </div>

          <div className="px-4 sm:px-8 py-6 sm:py-8">
            <PostForm categories={categories} users={users} />
          </div>
        </div>
      </main>
    </div>
  );
}
