// Validate and store email API credentials
function getEmailCredentials(): { url: string; key: string } {
  const url = process.env.EMAIL_API_URL;
  const key = process.env.EMAIL_API_KEY;

  if (!url || !key) {
    throw new Error("Email API credentials not configured. Please set EMAIL_API_URL and EMAIL_API_KEY in environment variables.");
  }

  return { url, key };
}

export interface SendEmailParams {
  to: string;
  title: string;
  content: string;
}

export async function sendEmail({ to, title, content }: SendEmailParams): Promise<void> {
  const { url, key } = getEmailCredentials();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api_key": key,
      },
      body: JSON.stringify({
        to,
        title,
        content,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`이메일 발송 실패: ${response.status} ${errorText}`);
    }

    // Log success without sensitive data
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[EMAIL_SENT] timestamp=${Date.now()}`);
    }
  } catch (error) {
    // Log error without exposing sensitive details
    console.error('[EMAIL_ERROR]', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}
