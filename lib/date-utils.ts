/**
 * 상대적인 시간 표시 함수 (예: "3일 전", "2주 전")
 */
export function getRelativeTimeString(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  // 미래 날짜인 경우
  if (diffInSeconds < 0) {
    const futureDiffInSeconds = Math.abs(diffInSeconds);

    if (futureDiffInSeconds < 60) {
      return "곧";
    } else if (futureDiffInSeconds < 3600) {
      const minutes = Math.floor(futureDiffInSeconds / 60);
      return `${minutes}분 후`;
    } else if (futureDiffInSeconds < 86400) {
      const hours = Math.floor(futureDiffInSeconds / 3600);
      return `${hours}시간 후`;
    } else if (futureDiffInSeconds < 604800) {
      const days = Math.floor(futureDiffInSeconds / 86400);
      return `${days}일 후`;
    } else if (futureDiffInSeconds < 2592000) {
      const weeks = Math.floor(futureDiffInSeconds / 604800);
      return `${weeks}주 후`;
    } else if (futureDiffInSeconds < 31536000) {
      const months = Math.floor(futureDiffInSeconds / 2592000);
      return `${months}개월 후`;
    } else {
      const years = Math.floor(futureDiffInSeconds / 31536000);
      return `${years}년 후`;
    }
  }

  // 과거 날짜인 경우
  if (diffInSeconds < 60) {
    return "방금 전";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks}주 전`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}개월 전`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years}년 전`;
  }
}

/**
 * HTML 태그를 제거하고 순수 텍스트만 추출하는 함수
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * 텍스트를 지정된 길이로 자르고 "..."을 추가하는 함수
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + "...";
}
