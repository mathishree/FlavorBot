// FoodSage Chatbot — JavaScript Logic

// ── State ──
let isLoading = false;
let currentLanguage = "english";
const chatMessages  = document.getElementById("chatMessages");
const userInput     = document.getElementById("userInput");
const sendBtn       = document.getElementById("sendBtn");
const languageSelect = document.getElementById("languageSelect");

// ── Language Selector ──
languageSelect.addEventListener("change", () => {
  currentLanguage = languageSelect.value;
  const langNames = { english: "English 🇬🇧", tamil: "Tamil 🇮🇳", telugu: "Telugu 🇮🇳" };
  showSystemMessage(`Language switched to <strong>${langNames[currentLanguage]}</strong>. I'll now respond in ${langNames[currentLanguage]}!`);
});

// ── Auto-resize textarea ──
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
});

// ── Keyboard handler ──
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// ── Send button ──
sendBtn.addEventListener("click", handleSend);

// ── Main send handler ──
async function handleSend() {
  const message = userInput.value.trim();
  if (!message || isLoading) return;

  // Add user message
  addMessage(message, "user");
  userInput.value = "";
  userInput.style.height = "auto";

  // Hide suggestions after first message
  const suggestionsBar = document.getElementById("suggestionsBar");
  if (suggestionsBar) suggestionsBar.style.display = "none";

  // Show typing indicator
  const typingEl = showTyping();
  setLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language: currentLanguage }),
    });

    const data = await response.json();
    removeTyping(typingEl);

    if (!response.ok) {
      addMessage(data.error || "Something went wrong. Please try again.", "bot", true);
    } else {
      addMessage(data.response, "bot");
    }
  } catch (err) {
    removeTyping(typingEl);
    addMessage("⚠️ Network error. Please check your connection and try again.", "bot", true);
  } finally {
    setLoading(false);
  }
}

// ── Suggestion chips ──
function sendSuggestion(text) {
  userInput.value = `How do I make ${text}?`;
  handleSend();
}

// ── Add a message to the chat ──
function addMessage(text, sender, isError = false) {
  const msgEl = document.createElement("div");
  msgEl.className = `message ${sender}-message`;

  const avatar = sender === "bot" ? "🤖" : "👤";
  const timeStr = getCurrentTime();
  const bubbleClass = isError ? "msg-bubble error-bubble" : "msg-bubble";
  const formattedText = sender === "bot" ? formatMarkdown(text) : escapeHtml(text);

  msgEl.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-content">
      <div class="${bubbleClass}">${formattedText}</div>
      <span class="msg-time">${timeStr}</span>
    </div>
  `;

  chatMessages.appendChild(msgEl);
  scrollToBottom();
}

// ── System message (language switch etc) ──
function showSystemMessage(html) {
  const el = document.createElement("div");
  el.style.cssText = `
    text-align: center;
    padding: 8px 16px;
    font-size: 12px;
    color: rgba(167, 139, 250, 0.7);
    border-top: 1px solid rgba(167, 139, 250, 0.1);
    border-bottom: 1px solid rgba(167, 139, 250, 0.1);
    background: rgba(139, 92, 246, 0.04);
    animation: msgSlideIn 0.3s ease forwards;
  `;
  el.innerHTML = `🌐 ${html}`;
  chatMessages.appendChild(el);
  scrollToBottom();
}

// ── Typing Indicator ──
function showTyping() {
  const el = document.createElement("div");
  el.className = "message bot-message typing-indicator";
  el.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  chatMessages.appendChild(el);
  scrollToBottom();
  return el;
}

function removeTyping(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

// ── Loading state ──
function setLoading(state) {
  isLoading = state;
  sendBtn.disabled = state;
  userInput.disabled = state;
  if (!state) userInput.focus();
}

// ── Scroll to bottom ──
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: "smooth" });
  });
}

// ── Format Markdown-like text to HTML ──
function formatMarkdown(text) {
  // Escape first, then apply formatting
  let html = escapeHtml(text);

  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic: *text*
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Headings: ### or ## or #
  html = html.replace(/^#{1,3}\s+(.+)$/gm, '<div class="recipe-heading">$1</div>');

  // Numbered list items
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, (_, num, content) => `
    <div class="recipe-step">
      <span class="step-num">${num}</span>
      <span>${content}</span>
    </div>`);

  // Unordered list items
  html = html.replace(/^[•\-\*]\s+(.+)$/gm, "<div>• $1</div>");

  // Line breaks
  html = html.replace(/\n{2,}/g, "<br><br>");
  html = html.replace(/\n/g, "<br>");

  // Blockquote: > text
  html = html.replace(/&gt;\s(.+)/g, '<blockquote style="border-left:3px solid #8b5cf6;padding:4px 12px;margin:8px 0;opacity:0.7">$1</blockquote>');

  return html;
}

// ── Escape HTML ──
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Get current time string ──
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Initial focus ──
window.addEventListener("load", () => {
  userInput.focus();
});
