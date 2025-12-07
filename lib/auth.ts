import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcrypt";

const SESSION_COOKIE_NAME = "wp-admin-session";

// In-memory session store (for development)
// PRODUCTION: Replace with Redis, database, or @vercel/kv for distributed systems
interface SessionData {
  createdAt: number;
  expiresAt: number;
  userId: string;
}

const sessionStore = new Map<string, SessionData>();

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of sessionStore.entries()) {
    if (data.expiresAt < now) {
      sessionStore.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// Generate cryptographically secure session token
function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Store session server-side
async function storeSession(token: string, userId: string): Promise<void> {
  const now = Date.now();
  const sessionData: SessionData = {
    createdAt: now,
    expiresAt: now + 60 * 60 * 24 * 1000, // 24 hours
    userId,
  };
  sessionStore.set(token, sessionData);
}

// Validate session token
async function validateSessionToken(token: string): Promise<SessionData | null> {
  const sessionData = sessionStore.get(token);

  if (!sessionData) {
    return null;
  }

  if (sessionData.expiresAt < Date.now()) {
    sessionStore.delete(token);
    return null;
  }

  return sessionData;
}

// Timing-safe string comparison
function timingSafeStringCompare(a: string, b: string): boolean {
  // Normalize lengths to prevent length-based timing attacks
  const maxLen = Math.max(a.length, b.length, 256);
  const aBuffer = Buffer.from(a.padEnd(maxLen, "\0"));
  const bBuffer = Buffer.from(b.padEnd(maxLen, "\0"));

  try {
    return timingSafeEqual(aBuffer, bBuffer);
  } catch {
    return false;
  }
}

// Login attempt tracking for rate limiting
interface LoginAttempt {
  count: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

export async function checkLoginAttempts(username: string): Promise<boolean> {
  const attempts = loginAttempts.get(username);

  if (attempts?.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remainingMinutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    throw new Error(`계정이 일시적으로 잠겼습니다. ${remainingMinutes}분 후에 다시 시도해주세요.`);
  }

  return true;
}

export async function recordFailedLogin(username: string): Promise<void> {
  const attempts = loginAttempts.get(username) || { count: 0 };
  attempts.count++;

  if (attempts.count >= 5) {
    attempts.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
  }

  loginAttempts.set(username, attempts);
}

export async function resetLoginAttempts(username: string): Promise<void> {
  loginAttempts.delete(username);
}

// 로그인 검증 with bcrypt
export async function validateLogin(
  username: string,
  password: string
): Promise<boolean> {
  const adminId = process.env.ADMIN_ID;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminId || !adminPasswordHash) {
    throw new Error("Admin credentials not configured");
  }

  // Check login attempts
  await checkLoginAttempts(username);

  // Timing-safe username comparison
  const usernameMatch = timingSafeStringCompare(username, adminId);

  // bcrypt.compare uses constant-time comparison internally
  const passwordMatch = await bcrypt.compare(password, adminPasswordHash);

  const isValid = usernameMatch && passwordMatch;

  if (!isValid) {
    await recordFailedLogin(username);
  } else {
    await resetLoginAttempts(username);
  }

  return isValid;
}

// 세션 생성
export async function createSession(userId: string = "admin"): Promise<void> {
  // Delete any existing session first (prevent session fixation)
  await deleteSession();

  const sessionToken = generateSessionToken();
  const cookieStore = await cookies();

  // Store session server-side
  await storeSession(sessionToken, userId);

  // Set secure cookie
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // Changed from "lax" to "strict" for better CSRF protection
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

// 세션 확인
export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  if (!session?.value) {
    return false;
  }

  // Validate against server-side session store
  const sessionData = await validateSessionToken(session.value);

  if (!sessionData) {
    // Invalid or expired session - clean up cookie
    await deleteSession();
    return false;
  }

  return true;
}

// 세션 삭제 (로그아웃)
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  // Remove from server-side store
  if (session?.value) {
    sessionStore.delete(session.value);
  }

  // Delete cookie
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Get current user from session
export async function getCurrentUser(): Promise<{ id: string; isAdmin: boolean } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  if (!session?.value) {
    return null;
  }

  const sessionData = await validateSessionToken(session.value);

  if (!sessionData) {
    return null;
  }

  return {
    id: sessionData.userId,
    isAdmin: true, // For now, all authenticated users are admin
  };
}
