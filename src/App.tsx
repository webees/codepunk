import { APP_NAME, APP_VERSION, externalLinks, REPOSITORY_URL } from "./app/config";
import { ExternalLink } from "./components/external-link";
import { RuntimeCard } from "./components/runtime-card";
import { useRuntimeInfo } from "./hooks/use-runtime-info";

export default function App() {
  const runtime = useRuntimeInfo();

  return (
    <div className="shell">
      <header className="hero">
        <p className="eyebrow">Tauri 2 · React 19 · Rust</p>
        <h1 className="hero__title">
          {APP_NAME}
          <span className="hero__version">v{APP_VERSION}</span>
        </h1>
        <p className="hero__lede">
          A small, honest desktop foundation: strict TypeScript, a hardened Rust core, and a build
          pipeline that bundles installers on every platform.
        </p>
        <div className="hero__actions">
          <a className="button button--primary" href={REPOSITORY_URL} rel="noreferrer noopener">
            Source
          </a>
          <ExternalLink className="button" href="https://tauri.app/start/">
            Read the docs
          </ExternalLink>
        </div>
      </header>

      <main className="grid">
        <RuntimeCard state={runtime} />

        <section className="card">
          <h2 className="card__title">Next steps</h2>
          <ol className="steps">
            <li>
              Run <code>pnpm tauri dev</code> for the desktop shell.
            </li>
            <li>
              Add commands in <code>src-tauri/src</code> and type them once.
            </li>
            <li>Tag a release; CI builds macOS, Linux and Windows artifacts.</li>
          </ol>
        </section>

        <section className="card">
          <h2 className="card__title">Stack</h2>
          <ul className="chips">
            {externalLinks.map((link) => (
              <li key={link.href}>
                <ExternalLink className="chip" href={link.href}>
                  {link.label}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="footer">
        <span>MIT licensed · Built in the open</span>
        <ExternalLink href={`${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`}>
          Contributing
        </ExternalLink>
      </footer>
    </div>
  );
}
