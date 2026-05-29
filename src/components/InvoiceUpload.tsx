import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Loader2, FileText } from "lucide-react";

interface ExtractedInvoice {
  invoice_type?: string;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  seller_name?: string;
  seller_address?: string;
  seller_tax_id?: string;
  seller_email?: string;
  buyer_name?: string;
  buyer_address?: string;
  buyer_tax_id?: string;
  buyer_email?: string;
  currency?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unit?: string;
    unit_price: number;
    tax_rate?: number;
    total: number;
  }>;
  subtotal?: number;
  tax_percent?: number;
  tax_amount?: number;
  total?: number;
  payment_method?: string;
  bank_account?: string;
  notes?: string;
  reverse_charge?: boolean;
  original_invoice_ref?: string;
}

interface InvoiceUploadProps {
  onExtracted: (data: ExtractedInvoice) => void;
}

const InvoiceUpload = ({ onExtracted }: InvoiceUploadProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a PDF or image (PNG, JPEG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-invoice`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      toast.success("Invoice data extracted! Review and generate.");
      onExtracted(result.extracted);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse invoice");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardContent className="py-6 text-center">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={handleUpload}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("invoices.aiReading")} <strong>{fileName}</strong>...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Upload className="w-6 h-6 text-primary" />
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{t("invoices.uploadTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("invoices.uploadDesc")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> {t("invoices.chooseFile")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceUpload;
