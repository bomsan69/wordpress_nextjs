// File validation utilities

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateFile(file: File): Promise<ValidationResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' };
  }

  // Check file size is not zero
  if (file.size === 0) {
    return { valid: false, error: '파일이 비어있습니다.' };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WebP만 허용)' };
  }

  // Validate file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  if (!ext || !allowedExts.includes(ext)) {
    return { valid: false, error: '잘못된 파일 확장자입니다.' };
  }

  // Check for path traversal in filename
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: '잘못된 파일 이름입니다.' };
  }

  // Validate magic bytes (file signature)
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 12));

  const signatures: Record<string, number[][]> = {
    jpeg: [[0xFF, 0xD8, 0xFF]],
    png: [[0x89, 0x50, 0x4E, 0x47]],
    gif: [[0x47, 0x49, 0x46, 0x38]],
    webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  };

  let validSignature = false;
  for (const sigs of Object.values(signatures)) {
    for (const sig of sigs) {
      if (sig.every((byte, i) => bytes[i] === byte)) {
        validSignature = true;
        break;
      }
    }
    if (validSignature) break;
  }

  if (!validSignature) {
    return { valid: false, error: '파일 내용이 올바르지 않습니다.' };
  }

  return { valid: true };
}

// Input validation for post data
interface PostData {
  title: string;
  content: string;
  categories: string;
  author: string;
}

interface PostValidationRules {
  title: { min: number; max: number };
  content: { min: number; max: number };
}

const POST_VALIDATION_RULES: PostValidationRules = {
  title: { min: 1, max: 200 },
  content: { min: 1, max: 100000 },
};

export function validatePostData(data: PostData): ValidationResult {
  // Check required fields
  if (!data.title || !data.content || !data.categories || !data.author) {
    return { valid: false, error: '모든 필드를 입력해주세요.' };
  }

  // Validate title length
  if (data.title.length < POST_VALIDATION_RULES.title.min ||
      data.title.length > POST_VALIDATION_RULES.title.max) {
    return {
      valid: false,
      error: `제목은 ${POST_VALIDATION_RULES.title.min}-${POST_VALIDATION_RULES.title.max}자 이내여야 합니다.`
    };
  }

  // Validate content length
  if (data.content.length < POST_VALIDATION_RULES.content.min ||
      data.content.length > POST_VALIDATION_RULES.content.max) {
    return {
      valid: false,
      error: `본문은 ${POST_VALIDATION_RULES.content.min}-${POST_VALIDATION_RULES.content.max}자 이내여야 합니다.`
    };
  }

  // Validate category ID is numeric
  if (!/^\d+$/.test(data.categories)) {
    return { valid: false, error: '유효하지 않은 카테고리입니다.' };
  }

  // Validate author ID is numeric
  if (!/^\d+$/.test(data.author)) {
    return { valid: false, error: '유효하지 않은 작성자입니다.' };
  }

  return { valid: true };
}

// Email data validation
interface EmailData {
  title: string;
  content: string;
}

const EMAIL_VALIDATION_RULES = {
  title: { min: 1, max: 200 },
  content: { min: 1, max: 10000 },
};

export function validateEmailData(data: EmailData): ValidationResult {
  // Check required fields
  if (!data.title || !data.content) {
    return { valid: false, error: '모든 필드를 입력해주세요.' };
  }

  // Validate title length
  if (data.title.length < EMAIL_VALIDATION_RULES.title.min ||
      data.title.length > EMAIL_VALIDATION_RULES.title.max) {
    return {
      valid: false,
      error: `제목은 ${EMAIL_VALIDATION_RULES.title.min}-${EMAIL_VALIDATION_RULES.title.max}자 이내여야 합니다.`
    };
  }

  // Validate content length
  if (data.content.length < EMAIL_VALIDATION_RULES.content.min ||
      data.content.length > EMAIL_VALIDATION_RULES.content.max) {
    return {
      valid: false,
      error: `내용은 ${EMAIL_VALIDATION_RULES.content.min}-${EMAIL_VALIDATION_RULES.content.max}자 이내여야 합니다.`
    };
  }

  return { valid: true };
}
