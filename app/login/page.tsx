"use client";

import { login } from "./actions";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string>("");

  async function handleSubmit(formData: FormData) {
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-senior-3xl font-bold text-gray-900">
            WordPress 포스트 관리
          </h2>
          <p className="mt-4 text-center text-senior-base text-gray-600">
            로그인하여 계속하세요
          </p>
        </div>
        <form className="mt-8 space-y-6" action={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-senior-lg font-medium text-gray-900 mb-2"
              >
                아이디
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-6 py-4 border-2 border-gray-300 placeholder-gray-500 text-gray-900 text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="아이디를 입력하세요"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-senior-lg font-medium text-gray-900 mb-2"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-6 py-4 border-2 border-gray-300 placeholder-gray-500 text-gray-900 text-senior-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="비밀번호를 입력하세요"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
              <p className="text-senior-base text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-senior-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
