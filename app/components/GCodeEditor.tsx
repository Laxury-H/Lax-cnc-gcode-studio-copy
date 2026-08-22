import { useState, useRef, useMemo } from "react";
import { Icon } from "@/core/components/ui/Icon";

export function GCodeEditor({
  value,
  onChange,
  lang,
}: {
  value: string;
  onChange: (value: string) => void;
  lang: "EN" | "VI";
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const highlightedHTML = useMemo(() => {
    if (!searchQuery) return value;
    // Escape HTML to prevent XSS and formatting issues
    const escapeHTML = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const safeValue = escapeHTML(value);
    
    // We need to highlight matches.
    if (searchQuery.trim().length === 0) return safeValue;

    try {
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
      return safeValue.replace(regex, "<mark class='search-highlight'>$1</mark>");
    } catch {
      return safeValue;
    }
  }, [value, searchQuery]);

  return (
    <div className="gcode-editor-container">
      <div className="gcode-editor-toolbar">
        <div className="search-box">
          <Icon name="search" />
          <input
            type="text"
            placeholder={lang === "EN" ? "Search G-code..." : "Tìm G-code..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <Icon name="close" />
            </button>
          )}
        </div>
      </div>
      <div className="gcode-editor-inner">
        <pre
          ref={preRef}
          className="gcode-editor-pre"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedHTML + "\n" }}
        />
        <textarea
          ref={textareaRef}
          className="gcode-editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          aria-label={lang === "EN" ? "G-code content" : "Nội dung G-code"}
        />
      </div>
    </div>
  );
}
