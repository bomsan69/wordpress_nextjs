const EMAIL_API_URL = process.env.EMAIL_API_URL || "http://apisvr.boranet.net:3300/api/v2/send";
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || "d91f0a72929403aee77799434c9a0fd230e681ff0bb095d3dc556393ab752c50";

export interface SendEmailParams {
  to: string;
  title: string;
  content: string;
}

export async function sendEmail({ to, title, content }: SendEmailParams): Promise<void> {
  try {
    const response = await fetch(EMAIL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api_key": EMAIL_API_KEY,
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

    console.log(`이메일 발송 성공: ${to}`);
  } catch (error) {
    console.error("이메일 발송 중 오류:", error);
    throw error;
  }
}
