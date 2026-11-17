export type PiMessage = {
  role: "user" | "assistant";
  text: string;
};

export type PiStatus = {
  available: boolean;
  path: string | null;
  version: string | null;
  running: boolean;
};

export type AgentState = {
  status: PiStatus | null;
  busy: boolean;
  error: string;
  messages: PiMessage[];
  tools: string[];
};

export const createAgentState = (): AgentState => ({
  status: null,
  busy: false,
  error: "",
  messages: [],
  tools: [],
});

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;

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
  state.tools = [...state.tools.slice(-11), line];
};

export const applyPiEvent = (state: AgentState, payload: unknown): void => {
  const event = asRecord(payload);
  if (!event) return;
  const message = asRecord(event.message);

  switch (event.type) {
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
      if (typeof event.toolName === "string") {
        addTool(state, `${event.toolName} ${event.isError === true ? "失败" : "完成"}`);
      }
      break;
    case "agent_settled":
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
    case "exit":
      state.busy = false;
      if (state.status) state.status = { ...state.status, running: false };
      break;
    default:
      break;
  }
};
