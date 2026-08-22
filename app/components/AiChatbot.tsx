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
  contextData: any;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Network error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "12px", padding: "16px", color: "#e0e0e0" }}>
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
