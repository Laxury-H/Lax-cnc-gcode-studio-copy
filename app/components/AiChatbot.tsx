import React, { useState, useEffect, useRef } from "react";
import { Icon } from "../../core/components/ui/Icon";
import { Lang } from "../i18n";

export type Message = {
  role: "user" | "assistant";
  text: string;
};

export function AiChatbot({
  lang,
  placeholder,
  contextData
}: {
  lang: Lang;
  placeholder: string;
  contextData: Record<string, unknown>;
}) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lax_ai_chat_history");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lax_ai_api_key") || "";
    }
    return "";
  });
  const [showSettings, setShowSettings] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [toastMsg, setToastMsg] = useState<{text: string, type: "success" | "error"} | null>(null);
  
  const showToast = (text: string, type: "success" | "error") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const testApiKey = async () => {
    if (!apiKey) {
      showToast(lang === "EN" ? "Please enter an API key first" : "Vui lòng nhập API key trước", "error");
      return;
    }
    setTestingKey(true);
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey })
      });
      if (res.ok) {
        showToast(lang === "EN" ? "API Key is valid!" : "API Key hợp lệ!", "success");
      } else {
        const data = await res.json();
        showToast(data.error || (lang === "EN" ? "Invalid API Key" : "API Key không hợp lệ"), "error");
      }
    } catch {
      showToast(lang === "EN" ? "Network error" : "Lỗi mạng", "error");
    } finally {
      setTestingKey(false);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lax_ai_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth"
          });
        }
      }, 50);
    }
  }, [messages, loading]);

  const exportHistory = (format: "txt" | "json") => {
    if (messages.length === 0) return;
    
    let content = "";
    let mimeType = "";
    let filename = "";

    if (format === "json") {
      content = JSON.stringify(messages, null, 2);
      mimeType = "application/json";
      filename = "gcode_ai_history.json";
    } else {
      content = messages.map(m => `${m.role.toUpperCase()}:\n${m.text}\n`).join("\n");
      mimeType = "text/plain";
      filename = "gcode_ai_history.txt";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {})
        },
        body: JSON.stringify({
          message: userMsg.text,
          history: messages,
          context: JSON.stringify(contextData, null, 2)
        }),
      });
      const data = await response.json();
      if (data.text) {
        setMessages((prev) => [...prev, { role: "assistant", text: data.text }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: data.error || "Error generating response" }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Network error." }]);
    } finally {
      setLoading(false);
    }
  };

  if (showSettings) {
    return (
      <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", gap: "12px", padding: "16px", color: "#e0e0e0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>{lang === "EN" ? "AI Settings" : "Cài đặt AI"}</h3>
          <button 
            onClick={() => setShowSettings(false)}
            style={{ background: "transparent", border: "none", color: "var(--cyan-strong)", cursor: "pointer", padding: "4px" }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "14px", color: "#d7e1e5" }}>
            {lang === "EN" ? "Gemini API Key (Optional)" : "Gemini API Key (Tùy chọn)"}
          </label>
          <input 
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              localStorage.setItem("lax_ai_api_key", e.target.value);
            }}
            placeholder={lang === "EN" ? "Enter your own API Key" : "Nhập API Key của bạn"}
            style={{
              background: "#182329",
              border: "1px solid #4a606c",
              borderRadius: "6px",
              padding: "10px",
              color: "#fff",
              fontSize: "14px"
            }}
          />
          <small style={{ color: "#657681", fontSize: "12px", marginBottom: "8px" }}>
            {lang === "EN" 
              ? "If provided, your key will be used instead of the server's default key. It is saved locally in your browser." 
              : "Nếu được cung cấp, key của bạn sẽ được sử dụng thay vì key mặc định của máy chủ. Nó được lưu cục bộ trên trình duyệt."}
          </small>
          <button
            onClick={testApiKey}
            disabled={testingKey || !apiKey}
            style={{
              background: "var(--cyan-strong)",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              color: "#000",
              cursor: testingKey || !apiKey ? "not-allowed" : "pointer",
              opacity: testingKey || !apiKey ? 0.5 : 1,
              fontWeight: "600",
              alignSelf: "flex-start",
              fontSize: "13px"
            }}
          >
            {testingKey ? (lang === "EN" ? "Testing..." : "Đang kiểm tra...") : (lang === "EN" ? "Test Key" : "Kiểm tra Key")}
          </button>
        </div>
        
        {toastMsg && (
          <div className="toast" style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            background: toastMsg.type === "success" ? "#2e7d32" : "#d32f2f",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
            animation: "toast-in 200ms ease-out"
          }}>
            {toastMsg.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "12px", padding: "16px", color: "#e0e0e0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>{lang === "EN" ? "AI Assistant" : "Trợ lý AI"}</h3>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {messages.length > 0 && (
            <>
              <button 
                onClick={() => exportHistory("txt")}
                style={{ background: "transparent", border: "1px solid #4a606c", color: "#657681", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}
                title={lang === "EN" ? "Export as TXT" : "Xuất file TXT"}
              >
                TXT
              </button>
              <button 
                onClick={() => exportHistory("json")}
                style={{ background: "transparent", border: "1px solid #4a606c", color: "#657681", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}
                title={lang === "EN" ? "Export as JSON" : "Xuất file JSON"}
              >
                JSON
              </button>
              <div style={{ width: "1px", height: "16px", background: "#4a606c", margin: "0 2px" }} />
              <button 
                onClick={() => setMessages([])}
                style={{ background: "transparent", border: "none", color: "#657681", cursor: "pointer", padding: "4px" }}
                title={lang === "EN" ? "Clear Chat" : "Xóa trò chuyện"}
              >
                <Icon name="reset" size={18} />
              </button>
            </>
          )}
          <button 
            onClick={() => setShowSettings(true)}
            style={{ background: "transparent", border: "none", color: "#657681", cursor: "pointer", padding: "4px" }}
            title={lang === "EN" ? "Settings" : "Cài đặt"}
          >
            <Icon name="settings" size={18} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: "auto", 
          display: "flex", 
          flexDirection: "column", 
          gap: "12px",
          paddingRight: "8px"
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#657681", marginTop: "20px" }}>
            <Icon name="bot" size={32} />
            <p style={{ marginTop: "12px", fontSize: "14px" }}>
              {lang === "EN" ? "Hi! I am the G-Code AI Assistant. How can I help you today?" : "Chào bạn! Tôi là trợ lý AI G-Code. Tôi có thể giúp gì cho bạn?"}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background: msg.role === "user" ? "var(--cyan-strong)" : "#23313a",
                color: msg.role === "user" ? "#000" : "#d7e1e5",
                padding: "10px 14px",
                borderRadius: "8px",
                maxWidth: "85%",
                fontSize: "14px",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap"
              }}
            >
              {msg.text}
            </div>
          ))
        )}
        {loading && (
          <div style={{ alignSelf: "flex-start", color: "#657681", fontSize: "12px" }}>
            {lang === "EN" ? "Thinking..." : "Đang suy nghĩ..."}
          </div>
        )}
      </div>
      
      <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: "#182329",
            border: "1px solid #4a606c",
            borderRadius: "6px",
            padding: "10px",
            color: "#fff",
            fontSize: "14px"
          }}
        />
        <button 
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background: "var(--cyan-strong)",
            border: "none",
            borderRadius: "6px",
            padding: "0 16px",
            color: "#000",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1
          }}
        >
          <Icon name="send" size={16} />
        </button>
      </div>
    </div>
  );
}
