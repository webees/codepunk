import { StatusPill } from "./status-pill";
import type { RuntimeState } from "../hooks/use-runtime-info";

interface RuntimeCardProps {
  readonly state: RuntimeState;
}

export function RuntimeCard({ state }: RuntimeCardProps) {
  if (state.status === "loading") {
    return (
      <section className="card" aria-busy="true" aria-live="polite">
        <h2 className="card__title">Runtime</h2>
        <p className="card__muted">Inspecting the desktop bridge…</p>
      </section>
    );
  }

  if (state.status === "error" || !state.info) {
    return (
      <section className="card" aria-live="polite">
        <h2 className="card__title">Runtime</h2>
        <StatusPill tone="danger">Bridge unavailable</StatusPill>
        <p className="card__muted" role="alert">
          {state.error ?? "Unknown error"}
        </p>
      </section>
    );
  }

  const { info } = state;

  return (
    <section className="card" aria-live="polite">
      <header className="card__header">
        <h2 className="card__title">Runtime</h2>
        <StatusPill tone="success">Connected</StatusPill>
      </header>
      <dl className="facts">
        <div className="facts__row">
          <dt>App</dt>
          <dd>
            {info.appName} v{info.appVersion}
          </dd>
        </div>
        <div className="facts__row">
          <dt>Tauri</dt>
          <dd>{info.tauriVersion}</dd>
        </div>
        <div className="facts__row">
          <dt>Platform</dt>
          <dd>
            {info.platform} · {info.architecture}
          </dd>
        </div>
      </dl>
    </section>
  );
}
