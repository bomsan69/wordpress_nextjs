import { Navbar } from "@/components/Navbar";
import { MediaUploadForm } from "@/components/MediaUploadForm";

export default function NewMediaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-gray-200">
            <h1 className="text-senior-2xl font-bold">이미지 등록</h1>
          </div>

          <div className="p-6">
            <MediaUploadForm />
          </div>
        </div>
      </main>
    </div>
  );
}
