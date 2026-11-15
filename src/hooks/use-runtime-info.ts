import { onScopeDispose, readonly, ref, type Ref } from "vue";

import { loadRuntimeInfo, type RuntimeInfo } from "../app/runtime";

export type RuntimeStatus = "loading" | "ready" | "error";

export interface RuntimeState {
  readonly status: RuntimeStatus;
  readonly info: RuntimeInfo | null;
  readonly error: string | null;
}

const initialState: RuntimeState = { status: "loading", info: null, error: null };

export function useRuntimeInfo(): Readonly<Ref<RuntimeState>> {
  const state = ref<RuntimeState>(initialState);
  let active = true;

  loadRuntimeInfo()
    .then((info) => {
      if (active) {
        state.value = { status: "ready", info, error: null };
      }
    })
    .catch((cause: unknown) => {
      if (active) {
        state.value = {
          status: "error",
          info: null,
          error: cause instanceof Error ? cause.message : String(cause),
        };
      }
    });

  onScopeDispose(() => {
    active = false;
  });

  return readonly(state);
}
