import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { createApp, defineComponent, h, onMounted, onUnmounted, reactive } from "vue";

type Message = { role: "user" | "assistant"; text: string };

type Status = {
  available: boolean;
  path: string | null;
  version: string | null;
  running: boolean;
};

export type AgentState = {
  status: Status | null;
  cwd: string;
  input: string;
  busy: boolean;
  error: string;
  messages: Message[];
  tools: string[];
};

export const createState = (): AgentState => ({
  status: null,
  cwd: ".",
  input: "",
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

const inTauri = (): boolean => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const statusLabel = (state: AgentState): string => {
  if (!state.status) return "检测中";
  if (!state.status.available) return "未找到 Pi";
  return `${state.status.version ?? "Pi"}${state.status.running ? " · 运行中" : " · 就绪"}`;
};

const fieldValue = (event: Event): string =>
  (event.target as HTMLInputElement | HTMLTextAreaElement).value;

const App = defineComponent({
  setup() {
    const state = reactive(createState());
    let unlisten: UnlistenFn | undefined;

    const fail = (error: unknown): void => {
      state.busy = false;
      state.error = error instanceof Error ? error.message : String(error);
    };

    const refresh = async (): Promise<void> => {
      if (!inTauri()) {
        state.error = "请在 Tauri 桌面窗口中运行 CodePunk";
        return;
      }
      try {
        state.status = await invoke<Status>("pi_status");
      } catch (error) {
        fail(error);
      }
    };

    const send = async (): Promise<void> => {
      const message = state.input.trim();
      if (!message || state.busy) return;
      state.error = "";
      state.messages.push({ role: "user", text: message });
      state.input = "";
      state.busy = true;
      try {
        let status = await invoke<Status>("pi_status");
        if (!status.available) {
          throw new Error("未找到 pi。请运行 `curl -fsSL https://pi.dev/install.sh | sh` 后登录。");
        }
        if (!status.running) {
          status = await invoke<Status>("pi_start", { cwd: state.cwd.trim() || "." });
        }
        state.status = status;
        await invoke("pi_send", { message });
      } catch (error) {
        fail(error);
      }
    };

    const abort = async (): Promise<void> => {
      try {
        await invoke("pi_abort");
      } catch (error) {
        fail(error);
      }
    };

    const stop = async (): Promise<void> => {
      try {
        await invoke("pi_stop");
        state.busy = false;
        await refresh();
      } catch (error) {
        fail(error);
      }
    };

    onMounted(async () => {
      if (!inTauri()) {
        state.error = "请在 Tauri 桌面窗口中运行 CodePunk";
        return;
      }
      try {
        unlisten = await listen<unknown>("pi://event", ({ payload }) =>
          applyPiEvent(state, payload),
        );
      } catch (error) {
        fail(error);
      }
      await refresh();
    });
    onUnmounted(() => unlisten?.());

    return () =>
      h("main", [
        h("header", [h("h1", "CodePunk"), h("p", { role: "status" }, statusLabel(state))]),
        h("label", [
          "工作目录 ",
          h("input", {
            value: state.cwd,
            disabled: state.busy || state.status?.running === true,
            onInput: (event: Event) => {
              state.cwd = fieldValue(event);
            },
          }),
        ]),
        h(
          "section",
          { "aria-live": "polite" },
          state.messages.length === 0
            ? [h("p", "输入任务，Pi 将在工作目录中执行。")]
            : state.messages.map((message, index) =>
                h("article", { key: index }, [
                  h("strong", message.role === "user" ? "你" : "Pi"),
                  h("pre", message.text),
                ]),
              ),
        ),
        state.tools.length > 0
          ? h("pre", { "aria-label": "工具活动" }, state.tools.join("\n"))
          : null,
        state.error ? h("p", { role: "alert" }, state.error) : null,
        h(
          "form",
          {
            onSubmit: (event: Event) => {
              event.preventDefault();
              void send();
            },
          },
          [
            h("textarea", {
              rows: 3,
              value: state.input,
              disabled: state.busy,
              placeholder: "描述任务",
              onInput: (event: Event) => {
                state.input = fieldValue(event);
              },
            }),
            h(
              "button",
              { type: "submit", disabled: state.busy || !state.input.trim() },
              state.busy ? "运行中" : "发送",
            ),
            h(
              "button",
              { type: "button", disabled: !state.busy, onClick: () => void abort() },
              "中止",
            ),
            h("button", { type: "button", onClick: () => void stop() }, "停止 Pi"),
          ],
        ),
      ]);
  },
});

if (typeof document !== "undefined") createApp(App).mount("#root");

export default App;
