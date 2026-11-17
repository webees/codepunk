export type PiCommand =
  | { type: "prompt" | "steer" | "follow_up"; message: string }
  | { type: "abort" }
  | { type: "get_state" };

export type PiEvent = {
  type: string;
  message?: unknown;
  assistantMessageEvent?: { type?: string; delta?: string };
  toolName?: string;
  isError?: boolean;
  success?: boolean;
  error?: string;
  [key: string]: unknown;
};

export type PiMessage = {
  role: "user" | "assistant";
  text: string;
};

export type AgentState = {
  busy: boolean;
  error: string;
  messages: PiMessage[];
  tools: string[];
};

export type Unsubscribe = () => void;

export type AgentTransport = {
  start(cwd: string): Promise<void>;
  send(command: PiCommand): Promise<void>;
  stop(): Promise<void>;
  subscribe(handler: (payload: unknown) => void): Promise<Unsubscribe>;
};

export type Agent = {
  readonly state: AgentState;
  start(cwd: string): Promise<void>;
  prompt(message: string): Promise<void>;
  steer(message: string): Promise<void>;
  followUp(message: string): Promise<void>;
  abort(): Promise<void>;
  refresh(): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: () => void): Unsubscribe;
};

export const createAgentState = (): AgentState => ({
  busy: false,
  error: "",
  messages: [],
  tools: [],
});

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;

const parsePiEvent = (payload: unknown): PiEvent | undefined => {
  try {
    const event = asRecord(typeof payload === "string" ? JSON.parse(payload) : payload);
    return typeof event?.type === "string" ? (event as PiEvent) : undefined;
  } catch {
    return undefined;
  }
};

const textOf = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => {
      const item = asRecord(block);
      return item?.type === "text" && typeof item.text === "string" ? item.text : "";
    })
    .join("");
};

const addTool = (state: AgentState, line: string): void => {
  state.tools = [...state.tools, line].slice(-12);
};

export const applyPiEvent = (state: AgentState, payload: unknown): void => {
  const event = parsePiEvent(payload);
  if (!event) return;
  const message = asRecord(event.message);

  switch (event.type) {
    case "agent_start":
      state.busy = true;
      break;
    case "message_start":
      if (message?.role === "assistant") state.messages.push({ role: "assistant", text: "" });
      break;
    case "message_update": {
      const update = asRecord(event.assistantMessageEvent);
      const last = state.messages.at(-1);
      if (
        update?.type === "text_delta" &&
        typeof update.delta === "string" &&
        last?.role === "assistant"
      ) {
        last.text += update.delta;
      }
      break;
    }
    case "message_end": {
      const last = state.messages.at(-1);
      const text = textOf(message?.content);
      if (message?.role === "assistant" && last?.role === "assistant") {
        if (text) last.text = text;
        else state.messages.pop();
      }
      break;
    }
    case "tool_execution_start":
      if (typeof event.toolName === "string") addTool(state, `${event.toolName} 执行中`);
      break;
    case "tool_execution_end":
      if (typeof event.toolName === "string")
        addTool(state, `${event.toolName} ${event.isError === true ? "失败" : "完成"}`);
      break;
    case "agent_settled":
    case "exit":
      state.busy = false;
      break;
    case "response":
      if (event.success === false) {
        state.busy = false;
        state.error = typeof event.error === "string" ? event.error : "Pi 请求失败";
      }
      break;
    case "error":
      state.busy = false;
      state.error = typeof event.message === "string" ? event.message : "Pi 错误";
      break;
  }
};

export const createAgent = (transport: AgentTransport): Agent => {
  const state = createAgentState();
  const listeners = new Set<() => void>();
  let unsubscribe: Unsubscribe | undefined;

  const notify = (): void => {
    for (const listener of listeners) listener();
  };

  const run = async (action: () => Promise<void>): Promise<void> => {
    try {
      state.error = "";
      await action();
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
    } finally {
      notify();
    }
  };

  const send = (command: PiCommand): Promise<void> => run(() => transport.send(command));

  return {
    state,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    start: (cwd) =>
      run(async () => {
        if (!unsubscribe) {
          unsubscribe = await transport.subscribe((payload) => {
            applyPiEvent(state, payload);
            notify();
          });
        }
        await transport.start(cwd);
      }),
    prompt: (message) => send({ type: "prompt", message }),
    steer: (message) => send({ type: "steer", message }),
    followUp: (message) => send({ type: "follow_up", message }),
    abort: () => send({ type: "abort" }),
    refresh: () => send({ type: "get_state" }),
    stop: () =>
      run(async () => {
        try {
          await transport.stop();
        } finally {
          unsubscribe?.();
          unsubscribe = undefined;
          state.busy = false;
        }
      }),
  };
};
