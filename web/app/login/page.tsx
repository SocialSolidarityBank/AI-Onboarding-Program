"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DOMAIN_HINT, DOMAIN_ERROR, isAllowedEmail } from "@/lib/constants";
import styles from "./page.module.css";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    setStatus({ kind: "sent", email: trimmed });
  }

  return (
    <main className={styles.main}>
      <div className={`container ${styles.box}`}>
        <h1 className={styles.title}>신청 페이지 로그인</h1>
        <p className={styles.lead}>{DOMAIN_HINT}</p>

        {status.kind === "sent" ? (
          <div className={styles.notice} role="status">
            <strong>{status.email}</strong> 으로 로그인 링크를 보냈습니다.
            <br />
            메일함을 확인해 링크를 눌러 주세요.
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
              {status.kind === "sending" ? "보내는 중…" : "로그인 링크 받기"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
