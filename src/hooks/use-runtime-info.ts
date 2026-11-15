import { useEffect, useState } from "react";

import { loadRuntimeInfo, type RuntimeInfo } from "../app/runtime";

export type RuntimeStatus = "loading" | "ready" | "error";

export interface RuntimeState {
  readonly status: RuntimeStatus;
  readonly info: RuntimeInfo | null;
  readonly error: string | null;
}

const initialState: RuntimeState = { status: "loading", info: null, error: null };

export function useRuntimeInfo(): RuntimeState {
  const [state, setState] = useState<RuntimeState>(initialState);

  useEffect(() => {
    let active = true;

    loadRuntimeInfo()
      .then((info) => {
        if (active) {
          setState({ status: "ready", info, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setState({
            status: "error",
            info: null,
            error: cause instanceof Error ? cause.message : String(cause),
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
