import Link from "next/link";
import { getProgramsByType, type Program } from "@/lib/programs";
import Nav from "./_components/Nav";
import { MarkdownBody } from "./_components/MarkdownBody";
import styles from "./page.module.css";

export default function Home() {
  const whole = getProgramsByType("whole");
  const studies = getProgramsByType("study");
  const facilitators = getProgramsByType("facilitator");
  const facilitator = facilitators[0];

  return (
    <>
      <a id="top" />
      <Nav />
      <main>
        <Hero />
        <ProgramOverviewSection />
        <WholeSection programs={whole} />
        <StudySection studies={studies} />
        {facilitator ? <FacilitatorSection program={facilitator} /> : null}
        <FaqSection />
        <ApplyCTASection />
      </main>
      <footer className={styles.footer}>
        <div className="container">
          <span>© 사회연대은행 · AI 교육 신청 페이지</span>
        </div>
      </footer>
    </>
  );
}

/* ---------------- Sections ---------------- */

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroInner}`}>
        <h1 className={styles.heroTitle}>
          사회연대은행<br />AI 교육 및 스터디
        </h1>
        <p className={styles.heroLead}>
          6월부터 10월까지 진행되는 임직원 대상 사내 AI 교육과 스터디 소개 및
          신청 페이지입니다.
          <br />
          일정은 추후에 공지됩니다. 자세한 교육 내용은 아래 소개를 확인하시고
          신청하세요.
        </p>
      </div>
    </section>
  );
}

function ProgramOverviewSection() {
  const items = [
    {
      title: "이론보다 실무 중심",
      body: "사회연대은행 AI 교육 및 스터디는 이론보다는 실무에 도움이 되는 실습 중심의 스터디와 워크샵으로 구성했습니다. 함께 학습하는 데 필요한 내용만 전체 워크샵으로 진행하고, 실제 업무에 필요한 내용은 관심 분야별 스터디로 운영합니다.",
    },
    {
      title: "퍼실리테이터(Facilitator)",
      body: "팀 내에서 AI 활용에 관심이 많고, 잘 활용할 수 있는 팀원이 퍼실리테이터가 되어 팀원들의 AX를 돕습니다.",
    },
    {
      title: "프로젝트 운영",
      body: "실무에 필요한 스킬을 배우는 것을 넘어 기관 사업에 필요한 도구를 만들거나 시스템을 설계하는 프로젝트를 수행합니다. 나만의 아이디어가 있거나 스터디 참여 후 해보고 싶은 프로젝트가 있다면 프로젝트 그룹에 참여하세요.",
    },
  ];
  return (
    <section id="overview" className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>
          교육 및 스터디는 이렇게 구성했습니다
        </h2>
        <div className={styles.cardGrid}>
          {items.map((it) => (
            <article key={it.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{it.title}</h3>
              <div className={styles.cardBody}>
                <p>{it.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WholeSection({ programs }: { programs: Program[] }) {
  return (
    <section id="whole" className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>전체 교육 및 워크샵</h2>
        <p className={styles.sectionLead}>
          6월-10월 사이에 진행되는 전체 임직원 대상 교육과 워크샵 내용을
          소개합니다.
        </p>
        <div className={styles.cardGrid}>
          {programs.map((p) => (
            <article key={p.id} className={styles.card}>
              <h3 className={styles.cardTitle}>
                ({p.order}) {p.title}
              </h3>
              {p.subtitle ? (
                <p className={styles.cardSubtitle}>{p.subtitle}</p>
              ) : null}
              <div className={styles.cardBody}>
                <MarkdownBody source={p.body} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudySection({ studies }: { studies: Program[] }) {
  return (
    <section id="study" className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>스터디 그룹</h2>
        <p className={styles.sectionLead}>
          6월부터 9월까지 총 6회(12주간 격주 1회)간 진행되는 사내 AI 스터디를
          소개합니다.
        </p>
        <p className={styles.sectionNote}>일정: 추후 공지</p>

        <h3 className={styles.subsectionTitle}>2-1. 스터디 구분</h3>
        <StudyComparison studies={studies} />

        <h3 className={styles.subsectionTitle}>2-2. 스터디 그룹 상세</h3>
        <div className={styles.studyDetailsList}>
          {studies.map((s) => (
            <StudyDetailCard key={s.id} program={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

const COMPARISON_ROWS: { label: string; key: keyof Program | "tools" }[] = [
  { label: "한 줄 정의", key: "oneLineDef" },
  { label: "목표", key: "goal" },
  { label: "사용툴", key: "tools" },
  { label: "내용", key: "contentSummary" as keyof Program },
  { label: "대상", key: "audience" },
  { label: "선택기준", key: "selectionCriteria" },
];

function StudyComparison({ studies }: { studies: Program[] }) {
  return (
    <div className={styles.compareGrid}>
      {studies.map((s) => (
        <article key={s.id} className={styles.compareCard}>
          <header className={styles.compareCardHeader}>
            <h4 className={styles.compareCardTitle}>{s.title}</h4>
          </header>
          <dl className={styles.compareCardBody}>
            {COMPARISON_ROWS.map((row) => (
              <div key={row.label} className={styles.compareCardRow}>
                <dt>{row.label}</dt>
                <dd>{renderCompareCell(s, row.key)}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function renderCompareCell(p: Program, key: string) {
  if (key === "tools") {
    const all = p.tools?.primary ?? [];
    return all.length ? all.join(", ") : "—";
  }
  if (key === "contentSummary") {
    const items = p.contentSummary ?? [];
    return (
      <ol className={styles.compareList}>
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ol>
    );
  }
  const v = (p as unknown as Record<string, string | undefined>)[key];
  return v ? <>{v}</> : <>—</>;
}

function StudyDetailCard({ program }: { program: Program }) {
  return (
    <article className={styles.studyCard}>
      <header className={styles.studyHeader}>
        {program.oneLineDef ? (
          <span className={styles.studyEyebrow}>{program.oneLineDef}</span>
        ) : null}
        <h4 className={styles.studyTitle}>
          ({program.order}) {program.title}
        </h4>
        <p className={styles.studyLead}>{program.subtitle}</p>
      </header>

      {program.body ? (
        <div className={styles.studyBody}>
          <MarkdownBody source={program.body} />
        </div>
      ) : null}

      {program.audience || program.selectionCriteria ? (
        <div className={styles.studyMeta}>
          <h5>이런 분에게 추천합니다</h5>
          <ul>
            {program.audience ? <li>{program.audience}</li> : null}
            {program.selectionCriteria ? (
              <li>{program.selectionCriteria}</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className={styles.studyMeta}>
        <h5>사용 도구</h5>
        <ul>
          {program.tools?.primary?.length ? (
            <li>{program.tools.primary.join(", ")}</li>
          ) : null}
        </ul>
      </div>

      <div className={styles.studyMeta}>
        <h5>다루는 내용</h5>
        <div className={styles.sessionsTableWrap}>
          <table className={styles.sessionsTable}>
            <thead>
              <tr>
                <th>회차</th>
                <th>시간</th>
                <th>학습 내용</th>
                <th>학습 결과</th>
              </tr>
            </thead>
            <tbody>
              {program.sessions?.map((s) => (
                <tr key={s.index}>
                  <td>{s.index}</td>
                  <td>{s.duration}</td>
                  <td>{s.content}</td>
                  <td>{s.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}

function FacilitatorSection({ program }: { program: Program }) {
  return (
    <section id="facilitator" className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>퍼실리테이터</h2>
        <p className={styles.sectionLead}>{program.subtitle}</p>
        <div className={styles.facGrid}>
          <article className={styles.facCard}>
            <h4>역할</h4>
            <ul>
              {program.roles?.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </article>
          <article className={styles.facCard}>
            <h4>혜택</h4>
            <ul>
              {program.benefits?.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

const STATIC_FAQS: { q: string; a: string }[] = [
  {
    q: "강사가 있나요?",
    a: "외부 강사를 초빙할 계획이지만, 한 번의 강의보다 10시간의 사용이 더 효율적입니다. 최대한 많은 정보를 드리고, 궁금한 것에 답변을 해드릴 예정입니다. 그리고 이미 사내에도 은둔 고수들이 많이 계셔서 서로 도울 수 있도록 스터디 그룹을 지향하고 있습니다.",
  },
  {
    q: "프로젝트 그룹은 무엇을 만드나요?",
    a: "신청 접수부터 안내까지 대응하는 신청 자동화, 사업 홈페이지 직접 만들기, 나만의 데이터베이스 구축하기, 엑셀/한글/워드/PPT 활용 봇(Bot), 개인 비서, 사회연대은행을 잘 아는 사내 챗봇, 고객 CS 대응 챗봇 등 다양한 프로젝트를 할 수 있습니다. 본인의 아이디어를 구현하고 결과물을 만듭니다.",
  },
  {
    q: "퍼실리테이터는 아무나 할 수 있나요?",
    a: "누구든지 의지만 있으면 할 수 있습니다. 학습에 시간을 많이 써야 하지만 의지만 있다면 못할 이유가 없어요. 많이 쓰고 공부한 사람이 잘하는 사람이 됩니다. 다만, 주변 동료들을 도와줄 수 있는 열린 마음은 필요한 것 같아요.",
  },
  {
    q: "일정이 어려우면 어떻게 하나요?",
    a: "일정 문제로 고민하는 분들이 많아서 스터디 형태로 진행합니다. 신청시 가능한 일정을 미리 받아 일정별로 모이는 시간을 조정하려고 합니다.",
  },
  {
    q: "어떤 툴을 사용하나요?",
    a: "스터디별로 스터디에 맞는 툴을 지원할 예정입니다. 클로드나 챗지피티를 사용하는데 토큰 사용량이 많은 챗지피티를 우선 사용해 보려고 합니다. 회사 지원 계정과 별도로 비영리 단체 할인 지원이 되는 개인 계정으로 지급할 예정입니다. 프로젝트 그룹이나 퍼실리테이터 그룹에는 사용량이 많고 저렴한 구독 모델을 고려하고 있습니다.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
        <div className={styles.faqAccordion}>
          {STATIC_FAQS.map((item, i) => (
            <details key={i} className={styles.faqItem}>
              <summary className={styles.faqSummary}>
                <span>{item.q}</span>
                <span className={styles.faqIcon} aria-hidden />
              </summary>
              <div className={styles.faqBody}>
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ApplyCTASection() {
  return (
    <section id="apply" className={styles.applySection}>
      <div className={`container ${styles.applyInner}`}>
        <h2 className={styles.applyTitle}>신청하기</h2>
        <p className={styles.applyHint}>
          신청 시 이메일은 회사 계정(@bss.or.kr 또는 @ggbss.or.kr)으로
          신청하셔야 확인 메일을 받으실 수 있습니다.
        </p>
        <Link href="/apply" className={styles.applyButton}>
          신청하기
        </Link>
      </div>
    </section>
  );
}
