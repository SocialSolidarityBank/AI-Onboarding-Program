"use client";

import { useActionState, useMemo, useState } from "react";
import type { Program } from "@/lib/programs";
import {
  TEAM_OPTIONS,
  TEAM_OTHER_VALUE,
  TOOL_OPTIONS,
  TOOL_OTHER_VALUE,
  DIFFICULT_DAYS,
  LEARNING_GOAL_OPTIONS,
  LEARNING_GOAL_MAX,
} from "@/lib/applicationOptions";
import {
  submitApplication,
  type ApplyFormState,
} from "./actions";
import styles from "./page.module.css";

export type InitialValues = {
  email: string;
  name: string;
  team: string;
  programIds: string[];
  tools: string[];
  toolsOther: string;
  expectations: string;
  availableDays: string[];
  learningGoals: string[];
};

const INITIAL_STATE: ApplyFormState = { kind: "idle" };

export default function ApplyForm({
  initial,
  programs,
}: {
  initial: InitialValues;
  programs: Program[];
}) {
  const [state, formAction, pending] = useActionState(
    submitApplication,
    INITIAL_STATE
  );

  const [tools, setTools] = useState<string[]>(initial.tools);
  const [toolsOther, setToolsOther] = useState<string>(initial.toolsOther);
  const otherChecked = tools.includes(TOOL_OTHER_VALUE);

  const initialTeamIsPreset = (TEAM_OPTIONS as readonly string[]).includes(
    initial.team
  );
  const [teamSelect, setTeamSelect] = useState<string>(
    initial.team
      ? initialTeamIsPreset
        ? initial.team
        : TEAM_OTHER_VALUE
      : ""
  );
  const [teamOther, setTeamOther] = useState<string>(
    initial.team && !initialTeamIsPreset ? initial.team : ""
  );
  const teamOtherSelected = teamSelect === TEAM_OTHER_VALUE;
  const teamSubmitValue = teamOtherSelected ? teamOther : teamSelect;

  const grouped = useMemo(() => {
    return {
      whole: programs.filter((p) => p.type === "whole"),
      study: programs.filter((p) => p.type === "study"),
      facilitator: programs.filter((p) => p.type === "facilitator"),
    };
  }, [programs]);

  function toggleTool(value: string) {
    setTools((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  const [learningGoals, setLearningGoals] = useState<string[]>(
    initial.learningGoals
  );
  function toggleLearningGoal(value: string) {
    setLearningGoals((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= LEARNING_GOAL_MAX) return prev;
      return [...prev, value];
    });
  }
  const learningGoalsFull = learningGoals.length >= LEARNING_GOAL_MAX;

  if (state.kind === "ok") {
    return (
      <section className={styles.success} role="status">
        <h2>신청이 접수되었습니다.</h2>
        <p>
          <strong>{state.email}</strong> 으로 접수했습니다.
          {state.updated ? " (이전 신청 내역을 새 응답으로 갱신했습니다.)" : ""}
        </p>
        <p className={styles.successNote}>
          수정이 필요한 경우 같은 메일로 다시 신청해 주세요.
        </p>
      </section>
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      <Fieldset legend="신청 정보를 입력하세요" required>
        <Field label="이름" required>
          <input
            name="name"
            type="text"
            required
            defaultValue={initial.name}
            className={styles.input}
            autoComplete="name"
          />
        </Field>
        <Field label="소속 / 팀" required>
          <select
            required
            value={teamSelect}
            onChange={(e) => setTeamSelect(e.target.value)}
            className={styles.input}
            autoComplete="organization"
          >
            <option value="" disabled>
              선택해 주세요
            </option>
            {TEAM_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value={TEAM_OTHER_VALUE}>{TEAM_OTHER_VALUE}</option>
          </select>
          {teamOtherSelected ? (
            <input
              type="text"
              required
              placeholder="소속 / 팀을 직접 입력해 주세요"
              value={teamOther}
              onChange={(e) => setTeamOther(e.target.value)}
              className={styles.input}
            />
          ) : null}
          <input type="hidden" name="team" value={teamSubmitValue} />
        </Field>

        <p className={styles.subLegend}>
          참여를 희망하는 과정을 모두 선택해 주세요
        </p>
        <ProgramGroup
          title="전체 임직원 대상 과정"
          programs={grouped.whole}
          selectedIds={initial.programIds}
        />
        <ProgramGroup
          title="스터디 그룹/퍼실리테이터 신청"
          programs={[...grouped.study, ...grouped.facilitator]}
          selectedIds={initial.programIds}
        />
      </Fieldset>

      <Fieldset legend="사용하고 있는 툴을 모두 선택해 주세요">
        <div className={styles.checkGrid}>
          {TOOL_OPTIONS.map((opt) => (
            <label key={opt} className={styles.checkLabel}>
              <input
                type="checkbox"
                name="tools"
                value={opt}
                checked={tools.includes(opt)}
                onChange={() => toggleTool(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              name="tools"
              value={TOOL_OTHER_VALUE}
              checked={otherChecked}
              onChange={() => toggleTool(TOOL_OTHER_VALUE)}
            />
            <span>기타(직접입력)</span>
          </label>
        </div>
        {otherChecked ? (
          <input
            name="tools_other"
            type="text"
            placeholder="사용 중인 다른 도구를 자유롭게 적어 주세요"
            value={toolsOther}
            onChange={(e) => setToolsOther(e.target.value)}
            className={styles.input}
          />
        ) : null}
      </Fieldset>

      <Fieldset
        legend="반복 참여가 가능한 요일을 알려 주세요"
        helper="진행 시간: 오후~퇴근 후"
      >
        <div className={styles.dayGrid}>
          {DIFFICULT_DAYS.map((day) => (
            <label key={day} className={styles.dayLabel}>
              <input
                type="checkbox"
                name="available_days"
                value={day}
                defaultChecked={initial.availableDays.includes(day)}
              />
              <span>{day}</span>
            </label>
          ))}
        </div>
      </Fieldset>

      <Fieldset
        legend={
          <>
            교육에서 얻어가고 싶은 것을 알려 주세요
            <br />
            <span className={styles.legendHint}>최대 2개 선택</span>
          </>
        }
        helper={
          learningGoalsFull
            ? "2개 모두 선택했습니다. 다른 항목을 고르려면 기존 선택을 해제해 주세요."
            : `현재 ${learningGoals.length}개 선택 / 최대 ${LEARNING_GOAL_MAX}개`
        }
      >
        <div className={styles.optionList}>
          {LEARNING_GOAL_OPTIONS.map((opt) => {
            const checked = learningGoals.includes(opt);
            const disabled = !checked && learningGoalsFull;
            return (
              <label
                key={opt}
                className={styles.optionLabel}
                data-disabled={disabled || undefined}
              >
                <input
                  type="checkbox"
                  name="learning_goals"
                  value={opt}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleLearningGoal(opt)}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      </Fieldset>

      <Fieldset legend="교육이나 스터디에 기대하는 바가 있다면 알려 주세요">
        <textarea
          name="expectations"
          defaultValue={initial.expectations}
          rows={4}
          className={styles.input}
        />
      </Fieldset>

      {state.kind === "error" ? (
        <p className={styles.formError} role="alert">
          {state.message}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "제출 중…" : "신청하기"}
      </button>
    </form>
  );
}

function Fieldset({
  legend,
  required,
  helper,
  children,
}: {
  legend: React.ReactNode;
  required?: boolean;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        {legend}
        {required ? <span className={styles.req}>*</span> : null}
      </legend>
      {helper ? <p className={styles.helper}>{helper}</p> : null}
      <div className={styles.fieldsetBody}>{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {required ? <span className={styles.req}>*</span> : null}
      </span>
      {children}
    </label>
  );
}

function ProgramGroup({
  title,
  programs,
  selectedIds,
}: {
  title: string;
  programs: Program[];
  selectedIds: string[];
}) {
  if (!programs.length) return null;
  return (
    <div className={styles.programGroup}>
      <h4 className={styles.programGroupTitle}>{title}</h4>
      <div className={styles.programList}>
        {programs.map((p) => (
          <label key={p.id} className={styles.programLabel}>
            <input
              type="checkbox"
              name="program_ids"
              value={p.id}
              defaultChecked={selectedIds.includes(p.id)}
            />
            <span>
              <span className={styles.programTitle}>{p.title}</span>
              {p.subtitle ? (
                <span className={styles.programSubtitle}>{p.subtitle}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
