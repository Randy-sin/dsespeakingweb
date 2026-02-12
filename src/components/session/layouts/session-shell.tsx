"use client";

import type { ReactNode } from "react";

interface SessionShellProps {
  header: ReactNode;
  main: ReactNode;
  middle: ReactNode;
  side: ReactNode;
  footer?: ReactNode;
}

export function SessionShell({
  header,
  main,
  middle,
  side,
  footer,
}: SessionShellProps) {
  return (
    <div className="min-h-[calc(100dvh-9rem)] flex flex-col gap-4">
      <div className="shrink-0">{header}</div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_300px_minmax(0,0.95fr)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
        <section className="min-h-0 rounded-2xl border border-neutral-200/70 bg-white p-3 md:p-4">
          {main}
        </section>

        <aside className="hidden xl:block min-h-0 rounded-2xl border border-neutral-200/70 bg-white p-3 md:p-4">
          {middle}
        </aside>

        <aside className="min-h-0 rounded-2xl border border-neutral-200/70 bg-white p-3 md:p-4">
          {side}
        </aside>
      </div>

      <div className="xl:hidden rounded-2xl border border-neutral-200/70 bg-white p-3 md:p-4">
        {middle}
      </div>

      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
