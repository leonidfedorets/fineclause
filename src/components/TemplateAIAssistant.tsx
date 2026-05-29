import { useState, useRef, useEffect } from "react";
import { Send, Download, Loader2, Bot, User, Save, FileText, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportMarkdownAsDocx } from "@/lib/markdownToDocx";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TemplateAIAssistantProps {
  template: {
    name: string;
    file_path: string;
    description: string | null;
  };
  onDownload: () => void;
  onSave?: (content: string) => Promise<void>;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fill-template`;

const QUICK_PROMPTS = [
  { label: "Generate with my details", icon: Sparkles, prompt: "Generate the complete document. Use best-practice legal terms for everything. I'll provide my company details:" },
  { label: "Fill with placeholders", icon: FileText, prompt: "Generate the complete filled document using industry-standard best practices for all legal terms. Use clear [PLACEHOLDER] markers for party names and addresses that I can fill in later." },
];

const TemplateAIAssistant = ({ template, onDownload, onSave }: TemplateAIAssistantProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `👋 Let's prepare your **${template.name}**!\n\nI'll auto-fill all legal clauses with **industry best practices** — you just need to provide:\n\n📋 **Party 1** — Name, address, contact\n📋 **Party 2** — Name, address, contact\n\nPaste the details below and I'll generate a **complete, ready-to-sign document** instantly.\n\n> 💡 *All legal terms (duration, termination, liability, etc.) will be filled with standard best practices. You can adjust anything after.*`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const getLastAssistantContent = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i].content;
    }
    return "";
  };

  const handleCopyLastResponse = async () => {
    const content = getLastAssistantContent();
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: "Copied!", description: "Document content copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveLastResponse = async () => {
    if (!onSave) return;
    const content = getLastAssistantContent();
    if (!content) return;
    setSaving(true);
    await onSave(content);
    setSaving(false);
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isLoading) return;
    if (!overrideText) setInput("");
    setShowQuickActions(false);

    const userMsg: Message = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          template_name: template.name,
          template_file: template.file_path,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > allMessages.length) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const hasDocumentOutput = messages.length > 2;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-4 min-h-[300px] max-h-[55vh]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 text-accent" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/90">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            {msg.role === "user" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mt-1">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-muted rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span className="text-xs text-muted-foreground">Generating your document...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick action buttons */}
      {showQuickActions && !isLoading && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((qp) => (
            <Button
              key={qp.label}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 rounded-full border-dashed"
              onClick={() => send(qp.prompt)}
            >
              <qp.icon className="w-3.5 h-3.5" />
              {qp.label}
            </Button>
          ))}
        </div>
      )}

      {/* Action bar for document output */}
      {hasDocumentOutput && !isLoading && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          <Button
            variant="default"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => {
              const content = getLastAssistantContent();
              if (content) {
                const safeName = template.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
                exportMarkdownAsDocx(content, `${safeName}_FineClause.docx`);
                toast({ title: "Downloading DOCX", description: "Your formatted document is being downloaded." });
              }
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            Download as DOCX
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleCopyLastResponse}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy text"}
          </Button>
          {onSave && (
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleSaveLastResponse} disabled={saving}>
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save to My Templates"}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={onDownload}>
            <Download className="w-3.5 h-3.5" />
            Original template
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your company details here (name, address, contact)..."
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          disabled={isLoading}
          className="rounded-full"
        />
        <Button onClick={() => send()} disabled={isLoading || !input.trim()} size="icon" className="rounded-full shrink-0">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default TemplateAIAssistant;
