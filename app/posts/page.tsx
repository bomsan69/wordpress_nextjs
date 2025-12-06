import { getPosts, getCategories, getUsers } from "@/lib/wordpress";
import { Navbar } from "@/components/Navbar";
import { SearchFilter } from "@/components/SearchFilter";
import { Pagination } from "@/components/Pagination";
import { PostListItem } from "@/components/PostListItem";
import { PostFilters } from "@/types/wordpress";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    period?: string;
    categories?: string;
    author?: string;
  }>;
}

export default async function PostsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // period 값에 따라 날짜 범위 계산 (기본값: 1달)
  const period = params.period || "1m";
  const today = new Date();
  let dateFrom: string | undefined;

  if (period === "all") {
    // 전체: dateFrom 없음
    dateFrom = undefined;
  } else if (period === "1m") {
    const date = new Date(today);
    date.setMonth(date.getMonth() - 1);
    dateFrom = date.toISOString().split("T")[0];
  } else if (period === "3m") {
    const date = new Date(today);
    date.setMonth(date.getMonth() - 3);
    dateFrom = date.toISOString().split("T")[0];
  } else if (period === "6m") {
    const date = new Date(today);
    date.setMonth(date.getMonth() - 6);
    dateFrom = date.toISOString().split("T")[0];
  }

  // 오늘 등록한 포스트를 포함하기 위해 종료일에 +1일
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const filters: PostFilters = {
    page: params.page ? parseInt(params.page) : 1,
    perPage: 10,
    dateFrom,
    dateTo: tomorrow.toISOString().split("T")[0],
    categories: params.categories
      ? params.categories.split(",").map((id) => parseInt(id))
      : undefined,
    author: params.author ? parseInt(params.author) : undefined,
  };

  const [postsResponse, categories, users] = await Promise.all([
    getPosts(filters),
    getCategories(),
    getUsers(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchFilter
          categories={categories}
          users={users}
          currentPeriod={period}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-gray-200">
            <h1 className="text-senior-2xl font-bold">포스트 목록</h1>
            <p className="text-senior-base text-gray-600 mt-2">
              전체 {postsResponse.total}개
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {postsResponse.data.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-senior-lg text-gray-500">
                  등록된 포스트가 없습니다.
                </p>
              </div>
            ) : (
              postsResponse.data.map((post) => {
                const author =
                  post._embedded?.author?.[0]?.name || "알 수 없음";
                const categoryNames =
                  post._embedded?.["wp:term"]?.[0]?.map((cat) => cat.name) ||
                  [];

                return (
                  <PostListItem
                    key={post.id}
                    post={post}
                    author={author}
                    categoryNames={categoryNames}
                  />
                );
              })
            )}
          </div>

          <div className="px-6 py-6 border-t-2 border-gray-200">
            <Pagination
              currentPage={filters.page || 1}
              totalPages={postsResponse.totalPages}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
