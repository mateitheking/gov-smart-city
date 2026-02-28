// site/support-widget.js
(() => {
  const LS_KEY = "aq_support_chat_v1";

  const pad2 = (n) => String(n).padStart(2, "0");
  const nowHM = () => {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const escapeHtml = (s) =>
    String(s || "").replace(/[&<>"']/g, (ch) => {
      switch (ch) {
        case "&": return "&amp;";
        case "<": return "&lt;";
        case ">": return "&gt;";
        case '"': return "&quot;";
        case "'": return "&#039;";
        default: return ch;
      }
    });

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveState(state) {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }

  function getOrInitState() {
    let st = loadState();
    if (!st) {
      st = {
        counter: 1000,
        messages: [
          {
            role: "agent",
            text:
              "Здравствуйте! 👋\n" +
              "Я техподдержка Aqyldy Qala.\n" +
              "Опишите вопрос — мы ответим.",
            time: nowHM()
          }
        ]
      };
      saveState(st);
    }
    return st;
  }

  function buildWidgetHtml() {
    return `
      <button class="support-fab" id="supportFab" aria-label="Support">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a9 9 0 0 0-9 9v3a4 4 0 0 0 4 4h1v-8H7a1 1 0 0 0-1 1v3a2 2 0 0 1-2-2v-3a8 8 0 1 1 16 0v3a2 2 0 0 1-2 2v-3a1 1 0 0 0-1-1h-1v8h1a4 4 0 0 0 4-4v-3a9 9 0 0 0-9-9z"/>
        </svg>
      </button>

      <div class="support-panel" id="supportPanel" role="dialog" aria-label="Support chat">
        <div class="support-head">
          <div class="support-title">
            <span class="support-dot"></span>
            <span>Техподдержка</span>
          </div>
          <button class="support-close" id="supportClose" aria-label="Close">
            ✕
          </button>
        </div>

        <div class="support-body" id="supportBody">
          <div class="support-hint">
            Это локальный демо-чат (сообщения сохраняются в браузере).
          </div>
        </div>

        <div class="support-foot">
          <textarea class="support-input" id="supportInput" placeholder="Напишите сообщение…"></textarea>
          <button class="support-send" id="supportSend" aria-label="Send">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  function renderMessages(bodyEl, messages) {
    // keep first hint block
    const hint = bodyEl.querySelector(".support-hint");
    bodyEl.innerHTML = "";
    if (hint) bodyEl.appendChild(hint);

    for (const m of messages) {
      const div = document.createElement("div");
      div.className = `support-msg ${m.role === "user" ? "user" : "agent"}`;
      div.innerHTML = `
        <div>${escapeHtml(m.text)}</div>
        <div class="support-meta">${escapeHtml(m.time || "")}</div>
      `;
      bodyEl.appendChild(div);
    }

    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function pushMessage(state, role, text) {
    state.messages.push({
      role,
      text,
      time: nowHM()
    });
    saveState(state);
  }

  function autoAgentReply(state, bodyEl, userText) {
    // Simple “realistic” reply for demo
    const id = `SUP-${state.counter++}`;
    saveState(state);

    setTimeout(() => {
      pushMessage(
        state,
        "agent",
        `Спасибо! Мы получили ваше сообщение.\nВаш тикет: ${id}\nОбычно отвечаем в течение 5–10 минут.\n\nЕсли вопрос срочный — опишите, что именно не работает.`
      );
      renderMessages(bodyEl, state.messages);
    }, 700);
  }

  function init() {
    document.body.insertAdjacentHTML("beforeend", buildWidgetHtml());

    const fab = document.getElementById("supportFab");
    const panel = document.getElementById("supportPanel");
    const closeBtn = document.getElementById("supportClose");
    const bodyEl = document.getElementById("supportBody");
    const input = document.getElementById("supportInput");
    const sendBtn = document.getElementById("supportSend");

    const state = getOrInitState();
    renderMessages(bodyEl, state.messages);

    const open = () => {
      panel.classList.add("open");
      setTimeout(() => input.focus(), 50);
      renderMessages(bodyEl, state.messages);
    };

    const close = () => panel.classList.remove("open");

    fab.addEventListener("click", () => {
      if (panel.classList.contains("open")) close();
      else open();
    });

    closeBtn.addEventListener("click", close);

    const send = () => {
      const text = String(input.value || "").trim();
      if (!text) return;

      input.value = "";
      pushMessage(state, "user", text);
      renderMessages(bodyEl, state.messages);

      autoAgentReply(state, bodyEl, text);
    };

    sendBtn.addEventListener("click", send);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    // Esc to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("open")) close();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();