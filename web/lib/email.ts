import "server-only";
import { Resend } from "resend";
import SubmissionConfirmation, {
  type SubmissionConfirmationProps,
} from "@/emails/SubmissionConfirmation";

/**
 * 트랜잭셔널 메일 발송 (Phase H)
 *
 * RESEND_API_KEY 가 비어 있으면 발송하지 않고 콘솔 로그만 남긴다.
 * 로컬 개발이나 도메인 인증 전 단계에서도 신청 흐름 자체는 정상 동작하도록
 * graceful fallback 처리한다.
 */

const SUBJECT = "[사회연대은행] AI 교육·스터디 신청 접수 안내";

type SendArgs = SubmissionConfirmationProps & {
  to: string;
};

export async function sendSubmissionConfirmation(args: SendArgs): Promise<
  | { kind: "skipped"; reason: string }
  | { kind: "sent"; id: string | undefined }
  | { kind: "error"; message: string }
> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY가 비어 있어 신청 확인 메일을 건너뜁니다.",
      { to: args.to }
    );
    return { kind: "skipped", reason: "RESEND_API_KEY missing" };
  }
  if (!from) {
    console.warn("[email] EMAIL_FROM 설정이 없어 메일을 건너뜁니다.");
    return { kind: "skipped", reason: "EMAIL_FROM missing" };
  }

  try {
    const resend = new Resend(apiKey);
    const { to, ...templateProps } = args;
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: SUBJECT,
      react: SubmissionConfirmation(templateProps),
    });

    if (error) {
      console.error("[email] Resend send error", error);
      return { kind: "error", message: error.message ?? "unknown" };
    }
    return { kind: "sent", id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] unexpected error", err);
    return { kind: "error", message };
  }
}
