import {
  WPPost,
  WPCategory,
  WPUser,
  WPListResponse,
  PostFormData,
  PostFilters,
  WPMedia,
  MediaFilters,
} from "@/types/wordpress";

const WP_URL = process.env.WORDPRESS_URL;
const WP_USERNAME = process.env.WORDPRESS_USERNAME;
const WP_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;

// Application Password를 사용한 Basic Auth 헤더 생성
function getAuthHeader() {
  if (!WP_USERNAME || !WP_APP_PASSWORD) {
    throw new Error("WordPress credentials not configured");
  }
  // Application Password의 공백 제거
  const cleanPassword = WP_APP_PASSWORD.replace(/\s+/g, "");
  const credentials = Buffer.from(
    `${WP_USERNAME}:${cleanPassword}`
  ).toString("base64");
  return `Basic ${credentials}`;
}

// WordPress REST API 호출 헬퍼
async function wpFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!WP_URL) {
    throw new Error("WordPress URL not configured");
  }

  const url = `${WP_URL}/wp-json/wp/v2${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // POST, PUT, DELETE 요청에만 인증 헤더 추가
  if (options.method && options.method !== "GET") {
    headers["Authorization"] = getAuthHeader();
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `WordPress API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = `WordPress API Error: ${errorData.message}`;
      }
      if (errorData.code) {
        errorMessage += ` (코드: ${errorData.code})`;
      }
      console.error("WordPress API Error Details:", errorData);
    } catch (e) {
      console.error("Failed to parse error response");
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// 포스트 목록 조회
export async function getPosts(
  filters: PostFilters = {}
): Promise<WPListResponse<WPPost>> {
  const {
    dateFrom,
    dateTo,
    categories,
    author,
    page = 1,
    perPage = 10,
  } = filters;

  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    _embed: "1", // 작성자 정보 포함
    status: "publish,draft", // publish와 draft 포스트 모두 조회
  });

  if (dateFrom) {
    params.append("after", new Date(dateFrom).toISOString());
  }
  if (dateTo) {
    params.append("before", new Date(dateTo).toISOString());
  }
  if (categories && categories.length > 0) {
    params.append("categories", categories.join(","));
  }
  if (author) {
    params.append("author", author.toString());
  }

  const endpoint = `/posts?${params.toString()}`;
  const url = `${WP_URL}/wp-json/wp/v2${endpoint}`;

  // draft 포스트 조회를 위해 인증 헤더 추가
  const headers: Record<string, string> = {
    "Authorization": getAuthHeader(),
  };

  // 매번 최신 데이터를 가져오기 위해 캐시 비활성화
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorMessage = `WordPress API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = `WordPress API Error: ${errorData.message}`;
      }
    } catch (e) {
      // 에러 응답 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const total = parseInt(response.headers.get("X-WP-Total") || "0");
  const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "0");

  return {
    data,
    total,
    totalPages,
  };
}

// 포스트 상세 조회 (draft 포스트 조회를 위해 인증 필요)
export async function getPost(id: number): Promise<WPPost> {
  const url = `${WP_URL}/wp-json/wp/v2/posts/${id}?_embed=1`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": getAuthHeader(),
  };

  // 매번 최신 데이터를 가져오기 위해 캐시 비활성화
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorMessage = `WordPress API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = `WordPress API Error: ${errorData.message}`;
      }
      if (errorData.code) {
        errorMessage += ` (코드: ${errorData.code})`;
      }
      console.error("WordPress API Error Details:", errorData);
    } catch (e) {
      console.error("Failed to parse error response");
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// 포스트 생성
export async function createPost(postData: PostFormData): Promise<WPPost> {
  return wpFetch<WPPost>("/posts", {
    method: "POST",
    body: JSON.stringify({
      title: postData.title,
      content: postData.content,
      categories: postData.categories,
      author: postData.author,
      status: postData.status || "publish",
    }),
  });
}

// 포스트 수정
export async function updatePost(
  id: number,
  postData: PostFormData
): Promise<WPPost> {
  return wpFetch<WPPost>(`/posts/${id}`, {
    method: "POST",
    body: JSON.stringify({
      title: postData.title,
      content: postData.content,
      categories: postData.categories,
      author: postData.author,
      status: postData.status || "draft",
    }),
  });
}

// 카테고리 목록 조회
export async function getCategories(): Promise<WPCategory[]> {
  return wpFetch<WPCategory[]>("/categories?per_page=100");
}

// 사용자 목록 조회
export async function getUsers(): Promise<WPUser[]> {
  return wpFetch<WPUser[]>("/users?per_page=100");
}

// 포스트 삭제
export async function deletePost(id: number): Promise<void> {
  await wpFetch(`/posts/${id}`, {
    method: "DELETE",
  });
}

// 미디어 목록 조회
export async function getMedia(
  filters: MediaFilters = {}
): Promise<WPListResponse<WPMedia>> {
  const { page = 1, perPage = 20 } = filters;

  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    media_type: "image", // 이미지만 조회
  });

  const endpoint = `/media?${params.toString()}`;
  const url = `${WP_URL}/wp-json/wp/v2${endpoint}`;

  const headers: Record<string, string> = {
    "Authorization": getAuthHeader(),
  };

  const response = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `WordPress API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = `WordPress API Error: ${errorData.message}`;
      }
    } catch (e) {
      // 에러 응답 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const total = parseInt(response.headers.get("X-WP-Total") || "0");
  const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "0");

  return {
    data,
    total,
    totalPages,
  };
}

// 미디어 업로드
export async function uploadMedia(
  file: File,
  title: string
): Promise<WPMedia> {
  if (!WP_URL) {
    throw new Error("WordPress URL not configured");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);

  const url = `${WP_URL}/wp-json/wp/v2/media`;
  const headers: Record<string, string> = {
    Authorization: getAuthHeader(),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `WordPress API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = `WordPress API Error: ${errorData.message}`;
      }
      if (errorData.code) {
        errorMessage += ` (코드: ${errorData.code})`;
      }
      console.error("WordPress API Error Details:", errorData);
    } catch (e) {
      console.error("Failed to parse error response");
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// 미디어 삭제
export async function deleteMedia(id: number): Promise<void> {
  await wpFetch(`/media/${id}?force=true`, {
    method: "DELETE",
  });
}
