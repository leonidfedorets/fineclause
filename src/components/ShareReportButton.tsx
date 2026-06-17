import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Share2, Copy, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ShareReportButtonProps {
  scanId: string;
  fileName: string;
}

const ShareReportButton = ({ scanId, fileName }: ShareReportButtonProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [note, setNote] = useState("");

  const handleShare = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("share-report", {
        body: {
          action: "create",
          scan_id: scanId,
          recipient_email: recipientEmail || undefined,
          note: note || undefined,
        },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed to create share link");

      // In Capacitor, window.location.origin is capacitor://localhost — use the real domain
      const base = window.location.origin.startsWith("capacitor")
        ? "https://fineclause.com"
        : window.location.origin;
      const url = `${base}/shared/${data.share.share_token}`;
      setShareUrl(url);
      toast.success("Share link created! Valid for 7 days.");
    } catch (e: any) {
      toast.error(e.message || "Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setShareUrl(null);
    setRecipientEmail("");
    setNote("");
    setCopied(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Share Report</DialogTitle>
            <DialogDescription>
              Create a secure link to share "<span className="font-medium">{fileName}</span>" with your team or lawyer. Link expires in 7 days.
            </DialogDescription>
          </DialogHeader>

          {!shareUrl ? (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Recipient email (optional)</label>
                <Input
                  type="email"
                  placeholder="lawyer@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Note (optional)</label>
                <Textarea
                  placeholder="Please review clause 4.2 regarding non-compete..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleShare} disabled={loading} className="w-full" variant="hero">
                {loading ? "Creating link..." : "Generate Share Link"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <code className="text-xs text-foreground flex-1 break-all">{shareUrl}</code>
              </div>
              <Button onClick={handleCopy} className="w-full gap-2" variant="hero">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Anyone with this link can view the report until it expires. You can revoke access from your dashboard.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareReportButton;
