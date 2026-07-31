import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ExternalLink } from "lucide-react";

const STORAGE_KEY = "fineclause_ai_consent_v1";

export function hasAIConsent(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setAIConsent(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {}
}

interface Props {
  onAccept: () => void;
  onCancel: () => void;
}

export function AIConsentDialog({ onAccept, onCancel }: Props) {
  const [loading, setLoading] = useState(false);

  const handleAccept = () => {
    setLoading(true);
    setAIConsent();
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-0">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="bg-primary/10 p-6 flex items-center gap-3 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-foreground">AI Data Processing</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Required before your first analysis</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            To analyse your documents, FineClause sends the content to{" "}
            <span className="font-semibold">OpenAI</span> (openai.com), a third-party AI service.
          </p>

          <ul className="space-y-2">
            {[
              "Your document text or photo is transmitted to OpenAI's API for processing.",
              "OpenAI does not use API data to train its models by default.",
              "No document content is stored by FineClause after analysis.",
              "Your data is handled under OpenAI's privacy policy (openai.com/policies/privacy).",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <a
            href="https://openai.com/policies/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
          >
            OpenAI Privacy Policy <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-2">
          <Button onClick={handleAccept} disabled={loading} className="w-full">
            I understand — proceed with analysis
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={loading} className="w-full text-muted-foreground">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
