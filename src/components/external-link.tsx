import { useState, type ReactNode } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";

interface ExternalLinkProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly className?: string;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Opens links in the user's default browser. Inside Tauri this goes through the
 * opener plugin so no remote content is ever loaded inside the webview.
 */
export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  const [failure, setFailure] = useState<string | null>(null);

  async function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (!isTauriRuntime()) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      await openUrl(href);
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : String(cause));
    }
  }

  return (
    <>
      <a
        className={className}
        href={href}
        rel="noreferrer noopener"
        target="_blank"
        onClick={(event) => {
          void handleClick(event);
        }}
      >
        {children}
      </a>
      {failure ? (
        <span role="alert" className="inline-error">
          Unable to open link: {failure}
        </span>
      ) : null}
    </>
  );
}
