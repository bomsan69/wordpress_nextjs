"use client";

import { logout } from "@/app/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-senior-base px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        로그아웃
      </button>
    </form>
  );
}
