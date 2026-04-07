import { useEffect, useMemo, useRef } from "react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiType,
  FiLink,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiRotateCcw,
} from "react-icons/fi";

const DEFAULT_VARIABLES = [
  { label: "Name", token: "{{name}}" },
  { label: "Email", token: "{{email}}" },
  { label: "Phone", token: "{{phone}}" },
  { label: "Company", token: "{{company}}" },
  { label: "Course", token: "{{course}}" },
];

const TOOLBAR = [
  { key: "bold", icon: FiBold, command: "bold", title: "Bold" },
  { key: "italic", icon: FiItalic, command: "italic", title: "Italic" },
  { key: "underline", icon: FiUnderline, command: "underline", title: "Underline" },
  { key: "insertUnorderedList", icon: FiList, command: "insertUnorderedList", title: "Bullet List" },
  { key: "justifyLeft", icon: FiAlignLeft, command: "justifyLeft", title: "Align Left" },
  { key: "justifyCenter", icon: FiAlignCenter, command: "justifyCenter", title: "Align Center" },
  { key: "justifyRight", icon: FiAlignRight, command: "justifyRight", title: "Align Right" },
];

export default function RichTextEmailEditor({
  value,
  onChange,
  variables = DEFAULT_VARIABLES,
  minHeight = 280,
  placeholder = "Compose your message...",
}) {
  const editorRef = useRef(null);

  const isEmpty = useMemo(() => {
    const plain = (value || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    return plain.length === 0;
  }, [value]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command, commandValue = null) => {
    focusEditor();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || "");
  };

  const insertVariable = (token) => {
    exec("insertText", token);
  };

  const createLink = () => {
    const url = window.prompt("Enter a URL");
    if (!url) return;
    exec("createLink", url);
  };

  const clearFormatting = () => {
    exec("removeFormat");
    exec("unlink");
  };

  return (
    <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TOOLBAR.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.key}
                type="button"
                onClick={() => exec(tool.command)}
                title={tool.title}
                className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-center"
              >
                <Icon size={16} />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => exec("formatBlock", "<h2>")}
            title="Heading"
            className="h-10 px-4 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider"
          >
            <FiType size={14} />
            H2
          </button>
          <button
            type="button"
            onClick={createLink}
            title="Insert Link"
            className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-center"
          >
            <FiLink size={16} />
          </button>
          <button
            type="button"
            onClick={clearFormatting}
            title="Clear Formatting"
            className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all flex items-center justify-center"
          >
            <FiRotateCcw size={16} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {variables.map((variable) => (
            <button
              key={variable.token}
              type="button"
              onClick={() => insertVariable(variable.token)}
              className="px-3 py-1.5 rounded-full border border-indigo-100 bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
            >
              {variable.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute top-5 left-6 text-sm font-medium text-slate-300">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          className="px-6 py-5 text-sm text-slate-700 leading-7 outline-none"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}
