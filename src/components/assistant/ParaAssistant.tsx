import {
  Bot,
  Expand,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { assistantService, type AssistantChatMessage } from "../../services/assistantService";
import Button from "../ui/Button";

const STORAGE_KEY = "para-ai-chat-history";
const OPEN_EVENT = "para:assistant:open";

const routeShortcuts: Array<[string, string[]]> = [
  ["/dashboard", ["dashboard", "overview", "home"]],
  ["/products", ["products", "catalog"]],
  ["/inventory", ["inventory", "stock"]],
  ["/sales-data", ["sales", "revenue"]],
  ["/demand-prediction", ["demand", "forecast"]],
  ["/price-recommendation", ["recommendation", "recommend", "suggested price"]],
  ["/price-optimization", ["optimization", "optimize"]],
  ["/constraint-center", ["constraint", "guardrail", "policy"]],
  ["/sensitivity-analysis", ["sensitivity", "scenario"]],
  ["/fairness-monitor", ["fairness"]],
  ["/explainability", ["explainability", "explain"]],
  ["/pricing-history", ["history", "audit"]],
  ["/model-monitoring", ["model monitoring", "model status", "accuracy"]],
  ["/settings", ["settings", "preferences"]],
];

const welcome: AssistantChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm PARA AI. I can explain pricing recommendations, summarize demand and sales signals, review inventory risks, and guide you to the right part of the system.",
};

function loadHistory(): AssistantChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [welcome];
    const parsed = JSON.parse(raw) as AssistantChatMessage[];
    return Array.isArray(parsed) && parsed.length ? parsed : [welcome];
  } catch {
    return [welcome];
  }
}

function pageName(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  return pathname
    .replace(/^\//, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "PARA";
}

export default function ParaAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AssistantChatMessage[]>(loadHistory);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Explain this recommendation",
    "Show low stock products",
    "What should I review next?",
  ]);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentPage = useMemo(() => pageName(location.pathname), [location.pathname]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const openAssistant = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string }>;
      setOpen(true);
      if (custom.detail?.message) setDraft(custom.detail.message);
      window.setTimeout(() => inputRef.current?.focus(), 120);
    };

    const keyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "/") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape" && open && !document.fullscreenElement) setOpen(false);
    };

    window.addEventListener(OPEN_EVENT, openAssistant);
    window.addEventListener("keydown", keyboard);
    return () => {
      window.removeEventListener(OPEN_EVENT, openAssistant);
      window.removeEventListener("keydown", keyboard);
    };
  }, [open]);

  function tryNavigation(message: string): boolean {
    const normalized = message.toLowerCase();
    const asksToOpen = ["open", "go to", "show me", "take me", "navigate"].some((term) => normalized.includes(term));
    if (!asksToOpen) return false;

    const match = routeShortcuts.find(([, words]) => words.some((word) => normalized.includes(word)));
    if (!match) return false;

    navigate(match[0]);
    setMessages((current) => [
      ...current,
      { role: "user", content: message },
      { role: "assistant", content: `Opening ${pageName(match[0])}. I’m here if you want help understanding this screen.` },
    ]);
    setSuggestions(["Explain this page", "What should I look at?", "Check current pricing limits"]);
    return true;
  }

  async function send(message = draft) {
    const clean = message.trim();
    if (!clean || sending) return;
    setDraft("");

    if (tryNavigation(clean)) return;

    const userMessage: AssistantChatMessage = { role: "user", content: clean };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setSending(true);

    try {
      const response = await assistantService.ask({
        message: clean,
        page: currentPage,
        history: nextHistory.slice(-8),
      });
      setMessages((current) => [...current, { role: "assistant", content: response.message }]);
      if (response.suggestions?.length) setSuggestions(response.suggestions.slice(0, 4));
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I couldn’t connect right now, but the rest of the system is still available. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }

  function clearChat() {
    setMessages([welcome]);
    setSuggestions(["Explain this recommendation", "Show low stock products", "How is the model performing?"]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <>
      <button
        className={`para-ai-fab ${open ? "para-ai-fab-open" : ""}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close PARA AI" : "Open PARA AI"}
        title={open ? "Close PARA AI" : "Open PARA AI"}
      >
        <span className="para-ai-fab-glow" aria-hidden="true" />
        {open ? <X size={23} /> : <Bot size={25} />}
        {!open && <span className="para-ai-fab-label">PARA AI</span>}
      </button>

      <section
        className={`para-ai-panel glass-surface ${open ? "para-ai-panel-open" : ""} ${maximized ? "para-ai-panel-max" : ""}`}
        aria-hidden={!open}
        aria-label="PARA AI Assistant"
      >
        <header className="para-ai-header">
          <div className="para-ai-title-wrap">
            <div className="para-ai-logo"><Sparkles size={19} /></div>
            <div>
              <div className="para-ai-title-line"><strong>PARA AI Assistant</strong></div>
              <small>{currentPage}</small>
            </div>
          </div>

          <div className="para-ai-header-actions">
            <button type="button" onClick={clearChat} title="Clear chat" aria-label="Clear chat"><Trash2 size={17} /></button>
            <button type="button" onClick={() => setMaximized((value) => !value)} title={maximized ? "Restore assistant" : "Expand assistant"} aria-label={maximized ? "Restore assistant" : "Expand assistant"}>
              {maximized ? <Minimize2 size={17} /> : <Expand size={17} />}
            </button>
            <button type="button" onClick={() => setOpen(false)} title="Close PARA AI" aria-label="Close PARA AI"><X size={18} /></button>
          </div>
        </header>

        <div className="para-ai-context-bar">
          <span><Bot size={14} /> Ready to help with pricing, inventory, and analytics</span>
        </div>

        <div className="para-ai-messages" ref={scrollRef} aria-live="polite">
          {messages.map((message, index) => (
            <div className={`para-ai-message-row ${message.role}`} key={`${message.role}-${index}`}>
              {message.role === "assistant" && <div className="para-ai-message-avatar"><Bot size={15} /></div>}
              <div className="para-ai-message">{message.content}</div>
            </div>
          ))}

          {sending && (
            <div className="para-ai-message-row assistant">
              <div className="para-ai-message-avatar"><Bot size={15} /></div>
              <div className="para-ai-message para-ai-typing"><span /><span /><span /></div>
            </div>
          )}
        </div>

        <div className="para-ai-suggestions">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => void send(suggestion)} disabled={sending}>
              <Sparkles size={13} /> {suggestion}
            </button>
          ))}
        </div>

        <form
          className="para-ai-composer glass-input"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about pricing, demand, inventory, or fairness..."
            aria-label="Message PARA AI"
          />
          {draft && (
            <button type="button" className="para-ai-reset" onClick={() => setDraft("")} title="Clear input" aria-label="Clear input">
              <RotateCcw size={15} />
            </button>
          )}
          <Button type="submit" className="para-ai-send" icon={<Send size={17} />} disabled={!draft.trim() || sending} loading={sending}>
            Send
          </Button>
        </form>

        <footer className="para-ai-footer">
          PARA AI supports decisions while final approval remains with the user.
        </footer>
      </section>
    </>
  );
}
