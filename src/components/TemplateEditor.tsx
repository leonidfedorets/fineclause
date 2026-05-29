import { useState, useEffect } from "react";
import { Download, Save, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface TemplateEditorProps {
  template: {
    file_path: string;
    file_name: string;
    name: string;
  };
  existingContent?: string;
  onSave: (content: string) => Promise<void>;
  onDownloadOriginal: () => void;
}

const TemplateEditor = ({ template, existingContent, onSave, onDownloadOriginal }: TemplateEditorProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingContent) {
      setContent(existingContent);
      setEditedContent(existingContent);
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
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
    fetchContent();
  }, [template.file_path, existingContent]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(editedContent);
    setSaving(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    toast({ title: "Copied", description: "Template content copied to clipboard." });
  };

  const handleDownloadText = () => {
    const blob = new Blob([editedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = template.file_name.replace(/\.(docx?|pdf)$/i, "_customized.txt");
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-sm text-muted-foreground">Loading template content...</span>
      </div>
    );
  }

  const hasChanges = editedContent !== content;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Replace placeholder values (e.g. [Company Name], [Date]) with your information. Changes are saved privately to your account.
        </p>
        {hasChanges && (
          <span className="text-xs text-accent font-medium shrink-0 ml-2">Unsaved changes</span>
        )}
      </div>
      <Textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        className="flex-1 min-h-[400px] max-h-[55vh] font-mono text-sm leading-relaxed resize-none"
      />
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
          <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save to My Templates"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="w-4 h-4 mr-1" /> Copy
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadText}>
          <Download className="w-4 h-4 mr-1" /> Download as Text
        </Button>
        <Button variant="outline" size="sm" onClick={onDownloadOriginal}>
          <Download className="w-4 h-4 mr-1" /> Download Original
        </Button>
      </div>
    </div>
  );
};

export default TemplateEditor;
