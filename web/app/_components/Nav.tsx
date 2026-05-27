import Link from "next/link";
import styles from "./Nav.module.css";

const SECTIONS: { id: string; label: string }[] = [
  { id: "whole", label: "전체 교육" },
  { id: "study", label: "스터디 그룹" },
  { id: "facilitator", label: "퍼실리테이터" },
  { id: "apply", label: "신청" },
];

export default function Nav() {
  return (
    <header className={styles.nav}>
      <div className={`container ${styles.row}`}>
        <a className={styles.logo} href="#top" aria-label="사회연대은행 홈">
          <img src="/logo.svg" alt="사회연대은행" height={32} />
        </a>
        <nav className={styles.links} aria-label="주요 섹션">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>
        <Link href="/apply" className={styles.applyLink}>
          신청하기
        </Link>
      </div>
    </header>
  );
}
