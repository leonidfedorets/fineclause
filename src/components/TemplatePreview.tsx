import { useState, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TemplatePreviewProps {
  template: {
    file_path: string;
    file_name: string;
    name: string;
  };
}

const TemplatePreview = ({ template }: TemplatePreviewProps) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("preview-template", {
          body: { file_path: template.file_path },
        });
        if (fnError) throw fnError;
        setContent(data?.content ?? "No content available.");
      } catch (e: any) {
        setError("Unable to load preview. Please try again.");
        console.error("Preview error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [template.file_path]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-md p-6 max-h-[60vh] overflow-y-auto">
      <pre className="whitespace-pre-wrap text-sm text-foreground font-[var(--font-body)] leading-relaxed">
        {content}
      </pre>
    </div>
  );
};

export default TemplatePreview;
