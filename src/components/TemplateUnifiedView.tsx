import { useState, useEffect, useRef } from "react";
import {
  FileText, Loader2, Send, Download, Save, Copy, Check,
  Bot, User, Sparkles, Pencil, Eye, MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { exportMarkdownAsDocx } from "@/lib/markdownToDocx";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TemplateUnifiedViewProps {
  template: {
    id?: string;
    name: string;
    file_path: string;
    file_name: string;
    description: string | null;
  };
  canEdit: boolean;
  existingContent?: string;
  onDownload: () => void;
  onSave?: (content: string) => Promise<void>;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fill-template`;

const TemplateUnifiedView = ({
  template,
  canEdit,
  existingContent,
  onDownload,
  onSave,
}: TemplateUnifiedViewProps) => {
  const { toast } = useToast();

  // Document state
  const [content, setContent] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Chat state
  const [showAI, setShowAI] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Fetch template content
  useEffect(() => {
    if (existingContent) {
      setContent(existingContent);
      setEditedContent(existingContent);
      setLoading(false);
      return;
    }
    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("preview-template", {
          body: { file_path: template.file_path },
        });
        if (!error && data?.content) {
          setContent(data.content);
          setEditedContent(data.content);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [template.file_path, existingContent]);

  // Scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Initialize AI chat
  const openAI = () => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `👋 Let's prepare your **${template.name}**!\n\nI'll auto-fill all legal clauses with **industry best practices** — just provide:\n\n📋 **Party 1** — Name, address, contact\n📋 **Party 2** — Name, address, contact\n\nPaste details below and I'll generate a **complete, ready-to-sign document** instantly.\n\n> 💡 *All legal terms are filled with standard best practices. Adjust anything after.*`,
        },
      ]);
    }
    setShowAI(true);
  };

  // Send AI message
  const sendAI = async (overrideText?: string) => {
    const text = (overrideText || aiInput).trim();
    if (!text || aiLoading) return;
    if (!overrideText) setAiInput("");

    const userMsg: Message = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setAiLoading(true);

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
      setAiLoading(false);
    }
  };

  // Apply AI output to document
  const applyAIContent = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        setEditedContent(messages[i].content);
        setIsEditing(true);
        setShowAI(false);
        toast({ title: "Applied", description: "AI-generated content applied to editor. Review and save." });
        return;
      }
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    await onSave(editedContent);
    setContent(editedContent);
    setSaving(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent);
    setCopied(true);
    toast({ title: "Copied!", description: "Content copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDocxDownload = () => {
    const safeName = template.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
    exportMarkdownAsDocx(editedContent, `${safeName}_FineClause.docx`);
    toast({ title: "Downloading DOCX", description: "Your formatted document is being downloaded." });
  };

  const hasChanges = editedContent !== content;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading document...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">
      {/* Main document area */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${showAI ? "w-[55%]" : "w-full"}`}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30 flex-wrap">
          <div className="flex items-center gap-1.5 mr-auto">
            {canEdit && (
              <>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button
                  variant={!isEditing ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => setIsEditing(false)}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </Button>
              </>
            )}
          </div>

          {canEdit && (
            <Button
              variant={showAI ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => showAI ? setShowAI(false) : openAI()}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Assistant
            </Button>
          )}

          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>

          {canEdit && (
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleDocxDownload}>
              <Download className="w-3.5 h-3.5" /> DOCX
            </Button>
          )}

          <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={onDownload}>
            <Download className="w-3.5 h-3.5" /> Original
          </Button>

          {canEdit && onSave && hasChanges && (
            <Button size="sm" className="text-xs gap-1.5" onClick={handleSave} disabled={saving}>
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>

        {/* Document content */}
        <div className="flex-1 overflow-y-auto">
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-full min-h-[500px] border-0 rounded-none font-mono text-sm leading-relaxed resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-6"
            />
          ) : (
            <div className="max-w-none mx-auto p-8 md:p-12">
              {/* Document header */}
              <div className="mb-8 pb-6 border-b-2 border-accent/20">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-accent" />
                  <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">
                    {template.description ? "Legal Document" : "Template"}
                  </Badge>
                </div>
                <h1 className="font-[var(--font-display)] text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {template.name}
                </h1>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">
                    {template.description}
                  </p>
                )}
              </div>

              {/* Rendered document body */}
              <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert
                prose-headings:font-[var(--font-display)] prose-headings:text-foreground prose-headings:mt-8 prose-headings:mb-3
                prose-p:text-foreground/85 prose-p:leading-relaxed
                prose-strong:text-foreground
                prose-li:text-foreground/85 prose-li:leading-relaxed
                prose-blockquote:border-accent/40 prose-blockquote:bg-accent/5 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4
                prose-hr:border-border
                prose-table:border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2
              ">
                <ReactMarkdown>{editedContent}</ReactMarkdown>
              </div>

              {/* Document footer */}
              <div className="mt-12 pt-6 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground font-mono tracking-wide">
                  Generated by FineClause • Review with legal counsel before signing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat sidebar */}
      {showAI && (
        <div className="w-[45%] min-w-[320px] max-w-[440px] border-l border-border flex flex-col bg-background">
          {/* AI header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="text-sm font-medium text-foreground">AI Assistant</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setShowAI(false)}>
              Close
            </Button>
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && !aiLoading && (
            <div className="px-4 py-3 border-b border-border/50 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 justify-start border-dashed"
                onClick={() => sendAI("Generate the complete document. Use best-practice legal terms for everything. I'll provide my company details:")}
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" /> Generate with my details
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 justify-start border-dashed"
                onClick={() => sendAI("Generate the complete filled document using industry-standard best practices for all legal terms. Use clear [PLACEHOLDER] markers for party names and addresses that I can fill in later.")}
              >
                <FileText className="w-3.5 h-3.5 text-accent" /> Fill with placeholders
              </Button>
            </div>
          )}

          {/* Chat messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                    <Bot className="w-3 h-3 text-accent" />
                  </div>
                )}
                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-xs max-w-none dark:prose-invert prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/90 prose-p:my-1.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {aiLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2.5">
                <div className="shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                  <Bot className="w-3 h-3 text-accent" />
                </div>
                <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  <span className="text-[11px] text-muted-foreground">Generating...</span>
                </div>
              </div>
            )}
          </div>

          {/* Apply button when AI generated content */}
          {messages.length > 1 && !aiLoading && messages[messages.length - 1]?.role === "assistant" && (
            <div className="px-4 py-2 border-t border-border/50">
              <Button size="sm" className="w-full text-xs gap-1.5" onClick={applyAIContent}>
                <Pencil className="w-3.5 h-3.5" /> Apply to Document
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Paste company details..."
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAI()}
              disabled={aiLoading}
              className="rounded-full text-xs h-9"
            />
            <Button
              onClick={() => sendAI()}
              disabled={aiLoading || !aiInput.trim()}
              size="icon"
              className="rounded-full shrink-0 h-9 w-9"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateUnifiedView;
