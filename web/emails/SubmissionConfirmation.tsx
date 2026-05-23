import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type SubmissionConfirmationProps = {
  name: string;
  team: string;
  programTitles: string[];
  availableDays: string[];
  tools: string[];
  toolsOther: string | null;
  learningGoals: string[];
  expectations: string | null;
};

const main = {
  backgroundColor: "#f6f7f9",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px 28px",
};

const heading = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: 700,
  margin: "0 0 16px",
};

const lead = {
  color: "#1f2937",
  fontSize: "15px",
  lineHeight: 1.6,
  margin: "0 0 8px",
};

const sectionTitle = {
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  margin: "20px 0 8px",
  textTransform: "uppercase" as const,
};

const row = {
  color: "#1f2937",
  fontSize: "14px",
  lineHeight: 1.55,
  margin: "4px 0",
};

const muted = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: 1.55,
  margin: "16px 0 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

function joinOrDash(items: string[], extra?: string | null) {
  const all = [...items, ...(extra ? [extra] : [])].filter(Boolean);
  return all.length ? all.join(", ") : "—";
}

export default function SubmissionConfirmation({
  name,
  team,
  programTitles,
  availableDays,
  tools,
  toolsOther,
  learningGoals,
  expectations,
}: SubmissionConfirmationProps) {
  const safeName = name || "신청자";
  return (
    <Html lang="ko">
      <Head />
      <Preview>AI 교육·스터디 신청이 정상 접수되었습니다.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            {safeName}님, AI 교육·스터디 신청이 정상 접수되었습니다.
          </Heading>
          <Text style={lead}>
            아래 신청 내용을 확인해 주세요. 이후 일정이 확정되면 같은 메일
            주소로 별도 안내드립니다.
          </Text>

          <Hr style={hr} />

          <Text style={sectionTitle}>신청 내용</Text>
          <Text style={row}>
            <strong>소속 / 팀:</strong> {team || "—"}
          </Text>

          <Text style={row}>
            <strong>신청 과정:</strong>
          </Text>
          <Section>
            {programTitles.length ? (
              programTitles.map((title) => (
                <Text key={title} style={{ ...row, margin: "2px 0 2px 12px" }}>
                  • {title}
                </Text>
              ))
            ) : (
              <Text style={{ ...row, margin: "2px 0 2px 12px" }}>—</Text>
            )}
          </Section>

          <Text style={row}>
            <strong>참여 가능 요일:</strong>{" "}
            {availableDays.length ? availableDays.join(", ") : "—"}
          </Text>

          <Text style={row}>
            <strong>사용 중인 툴:</strong> {joinOrDash(tools, toolsOther)}
          </Text>

          <Text style={row}>
            <strong>교육에서 얻고자 하는 것:</strong>
          </Text>
          <Section>
            {learningGoals.length ? (
              learningGoals.map((g) => (
                <Text key={g} style={{ ...row, margin: "2px 0 2px 12px" }}>
                  • {g}
                </Text>
              ))
            ) : (
              <Text style={{ ...row, margin: "2px 0 2px 12px" }}>—</Text>
            )}
          </Section>

          {expectations ? (
            <>
              <Text style={row}>
                <strong>기대하는 바:</strong>
              </Text>
              <Text style={{ ...row, margin: "2px 0 2px 12px" }}>
                {expectations}
              </Text>
            </>
          ) : null}

          <Hr style={hr} />

          <Text style={lead}>
            신청 내용을 수정해야 한다면 신청 페이지에 같은 회사 계정으로 다시
            로그인해 새로 제출해 주세요. 마지막 제출 내용이 유효합니다.
          </Text>

          <Text style={muted}>
            문의: 경영지원부 김성규 과장 (내선 365)
          </Text>
          <Text style={muted}>— 사회연대은행</Text>
        </Container>
      </Body>
    </Html>
  );
}
