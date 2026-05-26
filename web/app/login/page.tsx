"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DOMAIN_HINT, DOMAIN_ERROR, isAllowedEmail } from "@/lib/constants";
import styles from "./page.module.css";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "code"; email: string; verifying: boolean; error?: string }
  | { kind: "error"; message: string };

// Supabase 프로젝트의 OTP 길이 설정에 따라 코드는 6~10자리.
// 현재 8자리로 발급되지만 향후 변경 대비해 범위로 검증.
const OTP_PATTERN = /^\d{6,10}$/;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [existingEmail, setExistingEmail] = useState<string | null>(null);

  // 기존 세션 감지 — 다른 계정으로 로그인된 채면 사용자에게 알리고 로그아웃 옵션 제공.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setExistingEmail(data.user.email);
    });
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setExistingEmail(null);
    setStatus({ kind: "idle" });
    setEmail("");
    setCode("");
  }

  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "idle" });

    const trimmed = email.trim();
    if (!isAllowedEmail(trimmed)) {
      setStatus({ kind: "error", message: DOMAIN_ERROR });
      return;
    }

    setStatus({ kind: "sending" });
    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    }/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus({
        kind: "error",
        message: `메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요. (${error.message})`,
      });
      return;
    }

    setStatus({ kind: "code", email: trimmed, verifying: false });
  }

  async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind !== "code") return;

    const token = code.trim();
    if (!OTP_PATTERN.test(token)) {
      setStatus({ ...status, error: "인증 코드 숫자를 정확히 입력해 주세요." });
      return;
    }

    setStatus({ ...status, verifying: true, error: undefined });
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.verifyOtp({
      email: status.email,
      token,
      type: "email",
    });

    if (error) {
      setStatus({
        ...status,
        verifying: false,
        error: `인증에 실패했습니다. 코드를 다시 확인해 주세요. (${error.message})`,
      });
      return;
    }

    window.location.href = "/apply";
  }

  function handleResendOrChangeEmail() {
    setCode("");
    setStatus({ kind: "idle" });
  }

  return (
    <main className={styles.main}>
      <div className={`container ${styles.box}`}>
        <h1 className={styles.title}>신청 페이지 로그인</h1>
        <p className={styles.lead}>{DOMAIN_HINT}</p>

        {existingEmail ? (
          <div className={styles.notice} role="status" style={{ marginBottom: 16 }}>
            현재 <strong>{existingEmail}</strong> 으로 로그인되어 있습니다.
            <br />
            <button
              type="button"
              onClick={handleSignOut}
              className={styles.submit}
              style={{ marginTop: 12, padding: "10px 14px", fontSize: 14 }}
            >
              로그아웃하고 다른 계정으로 로그인
            </button>
          </div>
        ) : null}

        {status.kind === "code" ? (
          <form className={styles.form} onSubmit={handleVerifyCode} noValidate>
            <div className={styles.notice} role="status">
              <strong>{status.email}</strong> 으로 인증 코드와 로그인 링크를 보냈습니다.
              <br />
              메일의 코드를 아래에 입력해 주세요. (다른 디바이스에서 메일을 여신 경우 링크 대신 코드 입력이 안전합니다)
            </div>
            <label className={styles.label} htmlFor="code">
              인증 코드
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6,10}"
              maxLength={10}
              className={styles.input}
              placeholder="메일에 표시된 숫자"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              disabled={status.verifying}
              autoFocus
            />
            {status.error ? (
              <p className={styles.error} role="alert">
                {status.error}
              </p>
            ) : null}
            <button
              type="submit"
              className={styles.submit}
              disabled={status.verifying || !OTP_PATTERN.test(code)}
            >
              {status.verifying ? "확인 중…" : "로그인"}
            </button>
            <button
              type="button"
              onClick={handleResendOrChangeEmail}
              className={styles.submit}
              style={{
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--card-border)",
              }}
              disabled={status.verifying}
            >
              다른 이메일로 다시 받기
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleSendCode} noValidate>
            <label className={styles.label} htmlFor="email">
              회사 이메일
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="name@bss.or.kr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={status.kind === "sending"}
            />
            {status.kind === "error" ? (
              <p className={styles.error} role="alert">
                {status.message}
              </p>
            ) : null}
            <button
              type="submit"
              className={styles.submit}
              disabled={status.kind === "sending"}
            >
              {status.kind === "sending" ? "보내는 중…" : "인증 코드 받기"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
