import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function Navbar() {
  return (
    <nav className="bg-white border-b-2 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-8">
            <Link
              href="/posts"
              className="text-senior-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              WordPress 포스트 관리
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/posts"
                className="text-senior-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
              >
                목록
              </Link>
              <Link
                href="/posts/new"
                className="text-senior-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
              >
                새 글 작성
              </Link>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
