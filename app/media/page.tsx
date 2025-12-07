import { getMedia } from "@/lib/wordpress";
import { Navbar } from "@/components/Navbar";
import { Pagination } from "@/components/Pagination";
import { MediaItem } from "@/components/MediaItem";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function MediaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = params.page ? parseInt(params.page) : 1;

  const mediaResponse = await getMedia({
    page: currentPage,
    perPage: 20,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-senior-2xl font-bold">미디어 목록</h1>
              <p className="text-senior-base text-gray-600 mt-2">
                전체 {mediaResponse.total}개
              </p>
            </div>
            <Link
              href="/media/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-senior-lg font-medium hover:bg-blue-700 transition-colors"
            >
              이미지 등록
            </Link>
          </div>

          {mediaResponse.data.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-senior-lg text-gray-500">
                등록된 이미지가 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
              {mediaResponse.data.map((media) => (
                <MediaItem key={media.id} media={media} />
              ))}
            </div>
          )}

          {mediaResponse.totalPages > 1 && (
            <div className="px-6 py-6 border-t-2 border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={mediaResponse.totalPages}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
