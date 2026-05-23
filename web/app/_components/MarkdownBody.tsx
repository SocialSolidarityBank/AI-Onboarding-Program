import { Fragment } from "react";

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] };

/**
 * Minimal Markdown renderer for V3 program bodies — supports only
 * paragraphs and bullet lists ("- " prefix). Sufficient for Phase A,
 * where bodies are short V3 excerpts.
 */
export function MarkdownBody({ source }: { source: string }) {
  const blocks: Block[] = [];
  let current: Block | null = null;

  for (const raw of source.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("- ")) {
      if (!current || current.type !== "ul") {
        if (current) blocks.push(current);
        current = { type: "ul", items: [] };
      }
      current.items.push(line.slice(2).trim());
    } else if (line.trim() === "") {
      if (current) {
        blocks.push(current);
        current = null;
      }
    } else {
      if (!current || current.type !== "p") {
        if (current) blocks.push(current);
        current = { type: "p", lines: [] };
      }
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);

  return (
    <>
      {blocks.map((b, i) =>
        b.type === "ul" ? (
          <ul key={i}>
            {b.items.map((t, j) => (
              <li key={j}>{t}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            {b.lines.map((l, j) => (
              <Fragment key={j}>
                {l}
                {j < b.lines.length - 1 ? " " : null}
              </Fragment>
            ))}
          </p>
        )
      )}
    </>
  );
}
