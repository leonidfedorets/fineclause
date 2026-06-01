import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InvoiceUpload from "@/components/InvoiceUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Download, Loader2, Eye, ArrowLeft, Send, Mail, Save, RefreshCw, Play, Pause, Calendar, Pencil } from "lucide-react";

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  price: number;
  taxRate: number | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  client_address: string | null;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  total: number;
  currency: string;
  status: string;
  created_at: string;
  pdf_path: string | null;
  notes: string | null;
  items: any;
}

interface RecurringTemplate {
  id: string;
  template_name: string;
  is_active: boolean;
  schedule_type: string;
  schedule_day: number;
  schedule_weekday: number | null;
  schedule_months_interval: number;
  next_generate_at: string;
  last_generated_at: string | null;
  invoice_type: string;
  currency: string;
  tax_percent: number;
  reverse_charge: boolean;
  payment_method: string | null;
  bank_account: string | null;
  notes: string | null;
  seller_name: string | null;
  seller_address: string | null;
  seller_tax_id: string | null;
  seller_email: string | null;
  client_name: string;
  client_email: string | null;
  client_address: string | null;
  client_tax_id: string | null;
  items: any;
  send_on_generate: boolean;
  created_at: string;
}

const useInvoiceConstants = () => {
  const { t } = useTranslation();
  const SCHEDULE_TYPES = [
    { value: "weekly", label: t("invoices.scheduleWeekly") },
    { value: "biweekly", label: t("invoices.scheduleBiweekly") },
    { value: "monthly", label: t("invoices.scheduleMonthly") },
    { value: "quarterly", label: t("invoices.scheduleQuarterly") },
    { value: "semiannual", label: t("invoices.scheduleSemiannual") },
    { value: "yearly", label: t("invoices.scheduleYearly") },
  ];
  const WEEKDAYS = [
    { value: 1, label: t("invoices.monday") },
    { value: 2, label: t("invoices.tuesday") },
    { value: 3, label: t("invoices.wednesday") },
    { value: 4, label: t("invoices.thursday") },
    { value: 5, label: t("invoices.friday") },
    { value: 6, label: t("invoices.saturday") },
    { value: 0, label: t("invoices.sunday") },
  ];
  const INVOICE_TYPES = [
    { value: "standard", label: t("invoices.typeStandard") },
    { value: "proforma", label: t("invoices.typeProforma") },
    { value: "credit_note", label: t("invoices.typeCreditNote") },
    { value: "debit_note", label: t("invoices.typeDebitNote") },
    { value: "corrective", label: t("invoices.typeCorrective") },
    { value: "advance", label: t("invoices.typeAdvance") },
    { value: "final", label: t("invoices.typeFinal") },
    { value: "recurring", label: t("invoices.typeRecurring") },
    { value: "receipt", label: t("invoices.typeReceipt") },
    { value: "vat", label: t("invoices.typeVat") },
  ];
  const getScheduleLabel = (tpl: RecurringTemplate) => {
    const weekdayName = WEEKDAYS.find(w => w.value === tpl.schedule_weekday)?.label;
    switch (tpl.schedule_type) {
      case "weekly": return `${t("invoices.scheduleEvery")} ${weekdayName || t("invoices.scheduleWeekly")}`;
      case "biweekly": return `${t("invoices.scheduleEveryOther")} ${weekdayName || t("invoices.scheduleWeekly")}`;
      case "monthly": return `${t("invoices.scheduleDay")} ${tpl.schedule_day} ${t("invoices.scheduleOfMonth")}`;
      case "quarterly": return `${t("invoices.scheduleDay")} ${tpl.schedule_day}, ${t("invoices.scheduleEvery3")}`;
      case "semiannual": return `${t("invoices.scheduleDay")} ${tpl.schedule_day}, ${t("invoices.scheduleEvery6")}`;
      case "yearly": return `${t("invoices.scheduleDay")} ${tpl.schedule_day}, ${t("invoices.scheduleOnceYear")}`;
      default: return `${t("invoices.scheduleDay")} ${tpl.schedule_day} ${t("invoices.scheduleOfMonth")}`;
    }
  };
  return { SCHEDULE_TYPES, WEEKDAYS, INVOICE_TYPES, getScheduleLabel };
};
const computeNextGenerateAt = (type: string, day: number, weekday: number) => {
  const now = new Date();
  let next: Date;
  if (type === "weekly" || type === "biweekly") {
    next = new Date(now);
    const currentDay = next.getDay();
    let diff = weekday - currentDay;
    if (diff <= 0) diff += 7;
    if (type === "biweekly" && diff <= 0) diff += 14;
    next.setDate(next.getDate() + diff);
  } else {
    next = new Date(now.getFullYear(), now.getMonth(), day);
    if (next <= now) {
      const interval = type === "quarterly" ? 3 : type === "semiannual" ? 6 : type === "yearly" ? 12 : 1;
      next.setMonth(next.getMonth() + interval);
    }
  }
  next.setHours(6, 0, 0, 0);
  return next.toISOString();
};

const InvoicesPage = () => {
  const { user, currentTierKey } = useAuth();
  const { t } = useTranslation();
  const { SCHEDULE_TYPES, WEEKDAYS, INVOICE_TYPES, getScheduleLabel } = useInvoiceConstants();
  const navigate = useNavigate();
  const [tab, setTab] = useState("create");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendEmailTo, setSendEmailTo] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState<Invoice | null>(null);
  const [sendToClientOnGenerate, setSendToClientOnGenerate] = useState(false);
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [saveTemplateDay, setSaveTemplateDay] = useState(1);
  const [saveScheduleType, setSaveScheduleType] = useState("monthly");
  const [saveScheduleWeekday, setSaveScheduleWeekday] = useState(1);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editScheduleType, setEditScheduleType] = useState("monthly");
  const [editScheduleDay, setEditScheduleDay] = useState(1);
  const [editScheduleWeekday, setEditScheduleWeekday] = useState(1);
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientAddress, setEditClientAddress] = useState("");
  const [editClientTaxId, setEditClientTaxId] = useState("");
  const [editSellerName, setEditSellerName] = useState("");
  const [editSellerAddress, setEditSellerAddress] = useState("");
  const [editSellerTaxId, setEditSellerTaxId] = useState("");
  const [editSellerEmail, setEditSellerEmail] = useState("");
  const [editInvoiceType, setEditInvoiceType] = useState("standard");
  const [editCurrency, setEditCurrency] = useState("EUR");
  const [editTaxPercent, setEditTaxPercent] = useState("23");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editBankAccount, setEditBankAccount] = useState("");
  const [editReverseCharge, setEditReverseCharge] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<LineItem[]>([]);
  const [editSendOnGenerate, setEditSendOnGenerate] = useState(false);
  const [updatingTemplate, setUpdatingTemplate] = useState(false);

  // Form state — universal
  const [invoiceType, setInvoiceType] = useState("standard");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerTaxId, setSellerTaxId] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [taxPercent, setTaxPercent] = useState("23");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [reverseCharge, setReverseCharge] = useState(false);
  const [originalInvoiceRef, setOriginalInvoiceRef] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit: "pcs", price: 0, taxRate: null }]);

  const hasAccess = ["invoice", "enterprise", "pro"].includes(currentTierKey);

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    const { data } = await supabase
      .from("recurring_invoice_templates")
      .select("*")
      .order("created_at", { ascending: false });
    setTemplates((data as RecurringTemplate[]) || []);
    setLoadingTemplates(false);
  };

  const fetchInvoices = async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from("invoices")
      .select("id, invoice_number, client_name, client_email, client_address, subtotal, tax_percent, tax_amount, total, currency, status, created_at, pdf_path, notes, items")
      .order("created_at", { ascending: false });
    setInvoices((data as Invoice[]) || []);
    setLoadingList(false);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit: "pcs", price: 0, taxRate: null }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: string | number | null) => {
    const updated = [...items];
    (updated[i] as any)[field] = value;
    setItems(updated);
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const tax = subtotal * (parseFloat(taxPercent) || 0) / 100;
  const total = subtotal + tax;

  const resetForm = () => {
    setInvoiceType("standard");
    setInvoiceNumber("");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setSellerName("");
    setSellerAddress("");
    setSellerTaxId("");
    setSellerEmail("");
    setClientName("");
    setClientEmail("");
    setClientAddress("");
    setClientTaxId("");
    setCurrency("EUR");
    setTaxPercent("23");
    setNotes("");
    setPaymentMethod("");
    setBankAccount("");
    setReverseCharge(false);
    setOriginalInvoiceRef("");
    setItems([{ description: "", quantity: 1, unit: "pcs", price: 0, taxRate: null }]);
  };

  const handleExtracted = (data: any) => {
    if (data.invoice_type) setInvoiceType(data.invoice_type);
    if (data.invoice_number) setInvoiceNumber(data.invoice_number);
    if (data.issue_date) setIssueDate(data.issue_date);
    if (data.due_date) setDueDate(data.due_date);
    if (data.seller_name) setSellerName(data.seller_name);
    if (data.seller_address) setSellerAddress(data.seller_address);
    if (data.seller_tax_id) setSellerTaxId(data.seller_tax_id);
    if (data.seller_email) setSellerEmail(data.seller_email);
    if (data.buyer_name) setClientName(data.buyer_name);
    if (data.buyer_email) setClientEmail(data.buyer_email);
    if (data.buyer_address) setClientAddress(data.buyer_address);
    if (data.buyer_tax_id) setClientTaxId(data.buyer_tax_id);
    if (data.currency) setCurrency(data.currency);
    if (data.tax_percent != null) setTaxPercent(String(data.tax_percent));
    if (data.notes) setNotes(data.notes);
    if (data.payment_method) setPaymentMethod(data.payment_method);
    if (data.bank_account) setBankAccount(data.bank_account);
    if (data.reverse_charge) setReverseCharge(data.reverse_charge);
    if (data.original_invoice_ref) setOriginalInvoiceRef(data.original_invoice_ref);
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      setItems(data.items.map((it: any) => ({
        description: it.description || "",
        quantity: it.quantity || 1,
        unit: it.unit || "pcs",
        price: it.unit_price || it.price || 0,
        taxRate: it.tax_rate ?? null,
      })));
    }
  };

  const handleGenerate = async () => {
    if (!clientName.trim()) { toast.error("Buyer / client name is required"); return; }
    if (items.some(i => !i.description.trim())) { toast.error("All items need a description"); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice", {
        body: {
          invoice_type: invoiceType,
          invoice_number: invoiceNumber || undefined,
          issue_date: issueDate || undefined,
          due_date: dueDate || undefined,
          seller_name: sellerName || undefined,
          seller_address: sellerAddress || undefined,
          seller_tax_id: sellerTaxId || undefined,
          seller_email: sellerEmail || undefined,
          client_name: clientName,
          client_email: clientEmail || undefined,
          client_address: clientAddress || undefined,
          client_tax_id: clientTaxId || undefined,
          items: items.map(i => ({ description: i.description, quantity: i.quantity, unit: i.unit, price: i.price, tax_rate: i.taxRate })),
          tax_percent: parseFloat(taxPercent) || 0,
          currency,
          notes: notes || undefined,
          payment_method: paymentMethod || undefined,
          bank_account: bankAccount || undefined,
          reverse_charge: reverseCharge,
          original_invoice_ref: originalInvoiceRef || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Invoice ${data.invoice.invoice_number} generated!`);
      setPreviewHtml(data.html);
      setPreviewOpen(true);

      // Auto-send to client if toggle is on and email is provided
      if (sendToClientOnGenerate && clientEmail.trim()) {
        try {
          await supabase.functions.invoke("send-invoice-email", {
            body: { invoice_id: data.invoice.id, recipient_email: clientEmail.trim() },
          });
          toast.success(`Invoice also sent to ${clientEmail}`);
        } catch {
          toast.error("Invoice generated but email sending failed");
        }
      }

      resetForm();
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoice: Invoice) => {
    if (!invoice.pdf_path) return;
    const { data } = await supabase.storage.from("invoice-pdfs").createSignedUrl(invoice.pdf_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handlePreview = async (invoice: Invoice) => {
    if (!invoice.pdf_path) return;
    const { data } = await supabase.storage.from("invoice-pdfs").download(invoice.pdf_path);
    if (data) {
      const text = await data.text();
      setPreviewHtml(text);
      setPreviewOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("invoices").delete().eq("id", id);
    toast.success("Invoice deleted");
    fetchInvoices();
  };

  const openSendDialog = (inv: Invoice) => {
    setSendingInvoice(inv);
    setSendEmailTo(inv.client_email || "");
    setSendDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!sendingInvoice || !sendEmailTo.trim()) {
      toast.error("Please enter a recipient email");
      return;
    }
    setSendingId(sendingInvoice.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-invoice-email", {
        body: { invoice_id: sendingInvoice.id, recipient_email: sendEmailTo.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Invoice sent to ${sendEmailTo}`);
      setSendDialogOpen(false);
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.message || "Failed to send invoice");
    } finally {
      setSendingId(null);
    }
  };

  const showCreditFields = ["credit_note", "corrective", "debit_note"].includes(invoiceType);

  const handleSaveTemplate = async () => {
    if (!saveTemplateName.trim()) { toast.error("Template name is required"); return; }
    if (!clientName.trim()) { toast.error("Client name is required"); return; }
    setSavingTemplate(true);
    try {
      const { error } = await supabase.from("recurring_invoice_templates").insert({
        user_id: user!.id,
        template_name: saveTemplateName,
        schedule_type: saveScheduleType,
        schedule_day: saveTemplateDay,
        schedule_weekday: (saveScheduleType === "weekly" || saveScheduleType === "biweekly") ? saveScheduleWeekday : null,
        schedule_months_interval: saveScheduleType === "quarterly" ? 3 : saveScheduleType === "semiannual" ? 6 : saveScheduleType === "yearly" ? 12 : 1,
        next_generate_at: computeNextGenerateAt(saveScheduleType, saveTemplateDay, saveScheduleWeekday),
        invoice_type: invoiceType,
        currency,
        tax_percent: parseFloat(taxPercent) || 0,
        reverse_charge: reverseCharge,
        payment_method: paymentMethod || null,
        bank_account: bankAccount || null,
        notes: notes || null,
        seller_name: sellerName || null,
        seller_address: sellerAddress || null,
        seller_tax_id: sellerTaxId || null,
        seller_email: sellerEmail || null,
        client_name: clientName,
        client_email: clientEmail || null,
        client_address: clientAddress || null,
        client_tax_id: clientTaxId || null,
        items: items.map(i => ({ description: i.description, quantity: i.quantity, unit: i.unit, price: i.price, tax_rate: i.taxRate })),
        send_on_generate: sendToClientOnGenerate,
      } as any);
      if (error) throw error;
      toast.success("Recurring template saved!");
      setSaveTemplateDialogOpen(false);
      setSaveTemplateName("");
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.message || "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const loadTemplateToForm = (tpl: RecurringTemplate) => {
    setInvoiceType(tpl.invoice_type);
    setCurrency(tpl.currency);
    setTaxPercent(String(tpl.tax_percent));
    setReverseCharge(tpl.reverse_charge);
    setPaymentMethod(tpl.payment_method || "");
    setBankAccount(tpl.bank_account || "");
    setNotes(tpl.notes || "");
    setSellerName(tpl.seller_name || "");
    setSellerAddress(tpl.seller_address || "");
    setSellerTaxId(tpl.seller_tax_id || "");
    setSellerEmail(tpl.seller_email || "");
    setClientName(tpl.client_name);
    setClientEmail(tpl.client_email || "");
    setClientAddress(tpl.client_address || "");
    setClientTaxId(tpl.client_tax_id || "");
    setSendToClientOnGenerate(tpl.send_on_generate);
    if (Array.isArray(tpl.items) && tpl.items.length > 0) {
      setItems(tpl.items.map((it: any) => ({
        description: it.description || "",
        quantity: it.quantity || 1,
        unit: it.unit || "pcs",
        price: it.price || it.unit_price || 0,
        taxRate: it.tax_rate ?? null,
      })));
    }
    setIssueDate(new Date().toISOString().slice(0, 10));
    setInvoiceNumber("");
    setTab("create");
    toast.success(`Loaded template "${tpl.template_name}" into form`);
  };

  const toggleTemplateActive = async (tpl: RecurringTemplate) => {
    await supabase.from("recurring_invoice_templates").update({ is_active: !tpl.is_active } as any).eq("id", tpl.id);
    toast.success(tpl.is_active ? "Template paused" : "Template activated");
    fetchTemplates();
  };

  const openEditDialog = (tpl: RecurringTemplate) => {
    setEditingTemplate(tpl);
    setEditTemplateName(tpl.template_name);
    setEditScheduleType(tpl.schedule_type);
    setEditScheduleDay(tpl.schedule_day);
    setEditScheduleWeekday(tpl.schedule_weekday ?? 1);
    setEditClientName(tpl.client_name);
    setEditClientEmail(tpl.client_email || "");
    setEditClientAddress(tpl.client_address || "");
    setEditClientTaxId(tpl.client_tax_id || "");
    setEditSellerName(tpl.seller_name || "");
    setEditSellerAddress(tpl.seller_address || "");
    setEditSellerTaxId(tpl.seller_tax_id || "");
    setEditSellerEmail(tpl.seller_email || "");
    setEditInvoiceType(tpl.invoice_type);
    setEditCurrency(tpl.currency);
    setEditTaxPercent(String(tpl.tax_percent));
    setEditPaymentMethod(tpl.payment_method || "");
    setEditBankAccount(tpl.bank_account || "");
    setEditReverseCharge(tpl.reverse_charge);
    setEditNotes(tpl.notes || "");
    setEditSendOnGenerate(tpl.send_on_generate);
    if (Array.isArray(tpl.items) && tpl.items.length > 0) {
      setEditItems(tpl.items.map((it: any) => ({
        description: it.description || "",
        quantity: it.quantity || 1,
        unit: it.unit || "pcs",
        price: it.price || it.unit_price || 0,
        taxRate: it.tax_rate ?? null,
      })));
    } else {
      setEditItems([{ description: "", quantity: 1, unit: "pcs", price: 0, taxRate: null }]);
    }
    setEditDialogOpen(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    if (!editTemplateName.trim()) { toast.error("Template name is required"); return; }
    if (!editClientName.trim()) { toast.error("Client name is required"); return; }
    setUpdatingTemplate(true);
    try {
      const interval = editScheduleType === "quarterly" ? 3 : editScheduleType === "semiannual" ? 6 : editScheduleType === "yearly" ? 12 : 1;
      const { error } = await supabase.from("recurring_invoice_templates").update({
        template_name: editTemplateName,
        schedule_type: editScheduleType,
        schedule_day: editScheduleDay,
        schedule_weekday: (editScheduleType === "weekly" || editScheduleType === "biweekly") ? editScheduleWeekday : null,
        schedule_months_interval: interval,
        next_generate_at: computeNextGenerateAt(editScheduleType, editScheduleDay, editScheduleWeekday),
        invoice_type: editInvoiceType,
        currency: editCurrency,
        tax_percent: parseFloat(editTaxPercent) || 0,
        reverse_charge: editReverseCharge,
        payment_method: editPaymentMethod || null,
        bank_account: editBankAccount || null,
        notes: editNotes || null,
        seller_name: editSellerName || null,
        seller_address: editSellerAddress || null,
        seller_tax_id: editSellerTaxId || null,
        seller_email: editSellerEmail || null,
        client_name: editClientName,
        client_email: editClientEmail || null,
        client_address: editClientAddress || null,
        client_tax_id: editClientTaxId || null,
        items: editItems.map(i => ({ description: i.description, quantity: i.quantity, unit: i.unit, price: i.price, tax_rate: i.taxRate })),
        send_on_generate: editSendOnGenerate,
      } as any).eq("id", editingTemplate.id);
      if (error) throw error;
      toast.success("Template updated!");
      setEditDialogOpen(false);
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.message || "Failed to update template");
    } finally {
      setUpdatingTemplate(false);
    }
  };

  const addEditItem = () => setEditItems([...editItems, { description: "", quantity: 1, unit: "pcs", price: 0, taxRate: null }]);
  const removeEditItem = (i: number) => setEditItems(editItems.filter((_, idx) => idx !== i));
  const updateEditItem = (i: number, field: keyof LineItem, value: string | number | null) => {
    const updated = [...editItems];
    (updated[i] as any)[field] = value;
    setEditItems(updated);
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("recurring_invoice_templates").delete().eq("id", id);
    toast.success("Template deleted");
    fetchTemplates();
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 px-6 max-w-xl mx-auto text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold font-display mb-3">{t("invoices.noAccess")}</h1>
          <p className="text-muted-foreground mb-6">
            {t("invoices.noAccessDesc")}
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate("/#pricing")}>{t("invoices.viewPlans")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 px-4 md:px-8 max-w-5xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> {t("invoices.back")}
        </Button>

        <h1 className="text-3xl font-bold font-display mb-1">{t("invoices.title")}</h1>
        <p className="text-muted-foreground mb-6">{t("invoices.subtitle")}</p>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="create">{t("invoices.createTab")}</TabsTrigger>
            <TabsTrigger value="registry">{t("invoices.registryTab")} ({invoices.length})</TabsTrigger>
            <TabsTrigger value="templates">{t("invoices.recurringTab")} ({templates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            {/* Upload section */}
            <div className="mb-6">
              <InvoiceUpload onExtracted={handleExtracted} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Invoice type & meta */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">{t("invoices.invoiceDetails")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>{t("invoices.invoiceType")}</Label>
                        <Select value={invoiceType} onValueChange={setInvoiceType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {INVOICE_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t("invoices.invoiceNumber")}</Label>
                        <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder={t("invoices.autoGenerated")} />
                      </div>
                      <div>
                        <Label>{t("invoices.currency")}</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="PLN">PLN (zł)</SelectItem>
                            <SelectItem value="CZK">CZK (Kč)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t("invoices.issueDate")}</Label>
                        <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                      </div>
                      <div>
                        <Label>{t("invoices.dueDate")}</Label>
                        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                      </div>
                    </div>
                    {showCreditFields && (
                      <div>
                        <Label>{t("invoices.originalRef")}</Label>
                        <Input value={originalInvoiceRef} onChange={e => setOriginalInvoiceRef(e.target.value)} placeholder="INV-20260401-ABC123" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Seller / Buyer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">{t("invoices.sellerFrom")}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div><Label>{t("invoices.name")}</Label><Input value={sellerName} onChange={e => setSellerName(e.target.value)} /></div>
                      <div><Label>{t("invoices.taxId")}</Label><Input value={sellerTaxId} onChange={e => setSellerTaxId(e.target.value)} /></div>
                      <div><Label>{t("invoices.email")}</Label><Input value={sellerEmail} onChange={e => setSellerEmail(e.target.value)} /></div>
                      <div><Label>{t("invoices.address")}</Label><Textarea value={sellerAddress} onChange={e => setSellerAddress(e.target.value)} rows={2} /></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-lg">{t("invoices.buyerTo")} *</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div><Label>{t("invoices.name")} *</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} /></div>
                      <div><Label>{t("invoices.taxId")}</Label><Input value={clientTaxId} onChange={e => setClientTaxId(e.target.value)} /></div>
                      <div><Label>{t("invoices.email")}</Label><Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} /></div>
                      <div><Label>{t("invoices.address")}</Label><Textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} rows={2} /></div>
                    </CardContent>
                  </Card>
                </div>

                {/* Line Items */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{t("invoices.lineItems")}</CardTitle>
                      <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> {t("invoices.addItem")}</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.map((item, i) => (
                      <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                        {/* Description — full width */}
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">{t("invoices.description")}</Label>
                          <Input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Item description" />
                        </div>
                        {/* Qty + Unit + Price */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">{t("invoices.qty")}</Label>
                            <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 1)} />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">{t("invoices.unit")}</Label>
                            <Input value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">{t("invoices.price")}</Label>
                            <Input type="number" min={0} step={0.01} value={item.price} onChange={e => updateItem(i, "price", parseFloat(e.target.value) || 0)} />
                          </div>
                        </div>
                        {/* Tax % + Delete */}
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">{t("invoices.taxRate")} %</Label>
                            <Input type="number" min={0} max={100} step={0.5} value={item.taxRate ?? ""} onChange={e => updateItem(i, "taxRate", e.target.value ? parseFloat(e.target.value) : null)} placeholder="—" />
                          </div>
                          {items.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="mb-0.5 flex-shrink-0">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Payment & extras */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">{t("invoices.paymentAdditional")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>{t("invoices.taxRate")}</Label>
                        <Input type="number" min={0} max={100} step={0.5} value={taxPercent} onChange={e => setTaxPercent(e.target.value)} />
                      </div>
                      <div>
                        <Label>{t("invoices.paymentMethod")}</Label>
                        <Input value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} />
                      </div>
                      <div>
                        <Label>{t("invoices.bankAccount")}</Label>
                        <Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={reverseCharge} onCheckedChange={setReverseCharge} />
                      <Label>{t("invoices.reverseCharge")}</Label>
                    </div>
                    <div>
                      <Label>{t("invoices.notes")}</Label>
                      <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-border">
                      <Switch checked={sendToClientOnGenerate} onCheckedChange={setSendToClientOnGenerate} />
                      <div>
                        <Label className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {t("invoices.sendToClient")}</Label>
                        <p className="text-xs text-muted-foreground">{t("invoices.sendToClientDesc")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary sidebar */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader><CardTitle className="text-lg">{t("invoices.summary")}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t("invoices.type")}</span>
                      <Badge variant="secondary" className="text-[10px]">{INVOICE_TYPES.find(it => it.value === invoiceType)?.label}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("invoices.subtotal")}</span>
                      <span>{subtotal.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("invoices.tax")} ({taxPercent}%)</span>
                      <span>{tax.toFixed(2)} {currency}</span>
                    </div>
                    {reverseCharge && (
                      <div className="text-xs text-amber-600 font-medium">{t("invoices.reverseChargeApplied")}</div>
                    )}
                    <div className="border-t border-border pt-2 flex justify-between font-bold">
                      <span>{t("invoices.total")}</span>
                      <span>{total.toFixed(2)} {currency}</span>
                    </div>
                    <Button variant="hero" className="w-full mt-4" size="lg" onClick={handleGenerate} disabled={loading}>
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> {t("invoices.generating")}</> : <><FileText className="w-4 h-4 mr-1" /> {t("invoices.generate")}</>}
                    </Button>
                    <Button variant="outline" className="w-full mt-2" size="sm" onClick={() => setSaveTemplateDialogOpen(true)}>
                      <Save className="w-4 h-4 mr-1" /> {t("invoices.saveAsTemplate")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="registry" className="mt-6">
            {loadingList ? (
              <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t("invoices.noInvoices")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-3 px-3 font-medium">{t("invoices.colInvoice")}</th>
                      <th className="py-3 px-3 font-medium">{t("invoices.colClient")}</th>
                      <th className="py-3 px-3 font-medium">{t("invoices.colEmail")}</th>
                      <th className="py-3 px-3 font-medium text-right">{t("invoices.colSubtotal")}</th>
                      <th className="py-3 px-3 font-medium text-right">{t("invoices.colTax")}</th>
                      <th className="py-3 px-3 font-medium text-right">{t("invoices.colTotal")}</th>
                      <th className="py-3 px-3 font-medium">{t("invoices.colStatus")}</th>
                      <th className="py-3 px-3 font-medium">{t("invoices.colDate")}</th>
                      <th className="py-3 px-3 font-medium text-right">{t("invoices.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3 font-medium">{inv.invoice_number}</td>
                        <td className="py-3 px-3">
                          <div>{inv.client_name}</div>
                          {inv.client_address && <div className="text-xs text-muted-foreground truncate max-w-[150px]">{inv.client_address}</div>}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">{inv.client_email || "—"}</td>
                        <td className="py-3 px-3 text-right">{Number(inv.subtotal).toFixed(2)} {inv.currency}</td>
                        <td className="py-3 px-3 text-right text-muted-foreground">
                          {Number(inv.tax_amount).toFixed(2)} ({Number(inv.tax_percent)}%)
                        </td>
                        <td className="py-3 px-3 text-right font-bold">{Number(inv.total).toFixed(2)} {inv.currency}</td>
                        <td className="py-3 px-3">
                          <Badge variant={inv.status === "sent" ? "default" : "secondary"} className="text-[10px]">
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Send via email" onClick={() => openSendDialog(inv)}>
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Preview" onClick={() => handlePreview(inv)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Download" onClick={() => handleDownload(inv)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(inv.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            {loadingTemplates ? (
              <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t("invoices.noTemplates")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((tpl) => (
                  <Card key={tpl.id}>
                    <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{tpl.template_name}</h3>
                          <Badge variant={tpl.is_active ? "default" : "secondary"} className="text-[10px]">
                            {tpl.is_active ? t("invoices.active") : t("invoices.paused")}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <div>{tpl.client_name} {tpl.client_email && `· ${tpl.client_email}`}</div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            <span><Calendar className="w-3 h-3 inline mr-1" />{getScheduleLabel(tpl)}</span>
                            <span>{INVOICE_TYPES.find(it => it.value === tpl.invoice_type)?.label || tpl.invoice_type}</span>
                            <span>{(tpl.items as any[])?.reduce((s: number, i: any) => s + (i.quantity || 1) * (i.price || 0), 0).toFixed(2)} {tpl.currency}</span>
                            {tpl.send_on_generate && <span className="text-primary"><Mail className="w-3 h-3 inline mr-1" />{t("invoices.autoSend")}</span>}
                          </div>
                          <div className="text-xs">
                            {t("invoices.next")}: {new Date(tpl.next_generate_at).toLocaleDateString()}
                            {tpl.last_generated_at && ` · ${t("invoices.last")}: ${new Date(tpl.last_generated_at).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(tpl)}>
                          <Pencil className="w-4 h-4 mr-1" /> {t("invoices.edit")}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => loadTemplateToForm(tpl)}>
                          <FileText className="w-4 h-4 mr-1" /> {t("invoices.use")}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleTemplateActive(tpl)} title={tpl.is_active ? t("invoices.paused") : t("invoices.active")}>
                          {tpl.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTemplate(tpl.id)} title={t("invoices.delete")}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>{t("invoices.preview")}</DialogTitle></DialogHeader>
          {previewHtml && (
            <iframe srcDoc={previewHtml} className="w-full h-[600px] border border-border rounded" title="Invoice Preview" />
          )}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> {t("invoices.sendEmail")}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {sendingInvoice && (
              <div className="text-sm text-muted-foreground">
                {t("invoices.sending").replace("...", "")} <strong>{sendingInvoice.invoice_number}</strong> ({Number(sendingInvoice.total).toFixed(2)} {sendingInvoice.currency})
              </div>
            )}
            <div>
              <Label>{t("invoices.recipientEmail")}</Label>
              <Input
                type="email"
                value={sendEmailTo}
                onChange={e => setSendEmailTo(e.target.value)}
                placeholder="client@company.com"
              />
            </div>
            <Button variant="hero" className="w-full" onClick={handleSendEmail} disabled={!!sendingId}>
              {sendingId ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> {t("invoices.sending")}</> : <><Send className="w-4 h-4 mr-1" /> {t("invoices.sendInvoice")}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5" /> {t("invoices.saveAsTemplate")}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">{t("invoices.saveTemplateDesc")}</p>
            <div>
              <Label>{t("invoices.templateName")} *</Label>
              <Input value={saveTemplateName} onChange={e => setSaveTemplateName(e.target.value)} placeholder={t("invoices.templateNamePlaceholder")} />
            </div>
            <div>
              <Label>{t("invoices.frequency")}</Label>
              <Select value={saveScheduleType} onValueChange={setSaveScheduleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TYPES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(saveScheduleType === "weekly" || saveScheduleType === "biweekly") ? (
              <div>
                <Label>{t("invoices.dayOfWeek")}</Label>
                <Select value={String(saveScheduleWeekday)} onValueChange={v => setSaveScheduleWeekday(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map(w => (
                      <SelectItem key={w.value} value={String(w.value)}>{w.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>{t("invoices.dayOfMonth")}</Label>
                <Input type="number" min={1} max={28} value={saveTemplateDay} onChange={e => setSaveTemplateDay(parseInt(e.target.value) || 1)} />
              </div>
            )}
            <Button variant="hero" className="w-full" onClick={handleSaveTemplate} disabled={savingTemplate}>
              {savingTemplate ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> {t("invoices.saving")}</> : <><Save className="w-4 h-4 mr-1" /> {t("invoices.saveTemplate")}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="w-5 h-5" /> {t("invoices.editTemplate")}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>{t("invoices.templateName")} *</Label>
              <Input value={editTemplateName} onChange={e => setEditTemplateName(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t("invoices.frequency")}</Label>
                <Select value={editScheduleType} onValueChange={setEditScheduleType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TYPES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(editScheduleType === "weekly" || editScheduleType === "biweekly") ? (
                <div>
                  <Label>{t("invoices.dayOfWeek")}</Label>
                  <Select value={String(editScheduleWeekday)} onValueChange={v => setEditScheduleWeekday(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map(w => (
                        <SelectItem key={w.value} value={String(w.value)}>{w.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>{t("invoices.dayOfMonth")}</Label>
                  <Input type="number" min={1} max={28} value={editScheduleDay} onChange={e => setEditScheduleDay(parseInt(e.target.value) || 1)} />
                </div>
              )}
              <div>
                <Label>{t("invoices.invoiceType")}</Label>
                <Select value={editInvoiceType} onValueChange={setEditInvoiceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVOICE_TYPES.map(it => (
                      <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">{t("invoices.seller")}</h4>
                <div><Label>{t("invoices.name")}</Label><Input value={editSellerName} onChange={e => setEditSellerName(e.target.value)} /></div>
                <div><Label>{t("invoices.taxId")}</Label><Input value={editSellerTaxId} onChange={e => setEditSellerTaxId(e.target.value)} /></div>
                <div><Label>{t("invoices.email")}</Label><Input value={editSellerEmail} onChange={e => setEditSellerEmail(e.target.value)} /></div>
                <div><Label>{t("invoices.address")}</Label><Textarea value={editSellerAddress} onChange={e => setEditSellerAddress(e.target.value)} rows={2} /></div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm">{t("invoices.client")} *</h4>
                <div><Label>{t("invoices.name")} *</Label><Input value={editClientName} onChange={e => setEditClientName(e.target.value)} /></div>
                <div><Label>{t("invoices.taxId")}</Label><Input value={editClientTaxId} onChange={e => setEditClientTaxId(e.target.value)} /></div>
                <div><Label>{t("invoices.email")}</Label><Input value={editClientEmail} onChange={e => setEditClientEmail(e.target.value)} /></div>
                <div><Label>{t("invoices.address")}</Label><Textarea value={editClientAddress} onChange={e => setEditClientAddress(e.target.value)} rows={2} /></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{t("invoices.lineItems")}</h4>
                <Button variant="outline" size="sm" onClick={addEditItem}><Plus className="w-3 h-3 mr-1" /> {t("invoices.add")}</Button>
              </div>
              <div className="space-y-2">
                {editItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      {i === 0 && <Label className="text-xs text-muted-foreground">{t("invoices.description")}</Label>}
                      <Input value={item.description} onChange={e => updateEditItem(i, "description", e.target.value)} />
                    </div>
                    <div className="col-span-1">
                      {i === 0 && <Label className="text-xs text-muted-foreground">{t("invoices.qty")}</Label>}
                      <Input type="number" min={1} value={item.quantity} onChange={e => updateEditItem(i, "quantity", parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <Label className="text-xs text-muted-foreground">{t("invoices.unit")}</Label>}
                      <Input value={item.unit} onChange={e => updateEditItem(i, "unit", e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <Label className="text-xs text-muted-foreground">{t("invoices.price")}</Label>}
                      <Input type="number" min={0} step={0.01} value={item.price} onChange={e => updateEditItem(i, "price", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <Label className="text-xs text-muted-foreground">{t("invoices.taxRate")}</Label>}
                      <Input type="number" min={0} max={100} step={0.5} value={item.taxRate ?? ""} onChange={e => updateEditItem(i, "taxRate", e.target.value ? parseFloat(e.target.value) : null)} />
                    </div>
                    <div className="col-span-1">
                      {editItems.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeEditItem(i)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t("invoices.currency")}</Label>
                <Select value={editCurrency} onValueChange={setEditCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="PLN">PLN (zł)</SelectItem>
                    <SelectItem value="CZK">CZK (Kč)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("invoices.taxRate")}</Label>
                <Input type="number" min={0} max={100} value={editTaxPercent} onChange={e => setEditTaxPercent(e.target.value)} />
              </div>
              <div>
                <Label>{t("invoices.paymentMethod")}</Label>
                <Input value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>{t("invoices.bankAccount")}</Label>
              <Input value={editBankAccount} onChange={e => setEditBankAccount(e.target.value)} />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={editReverseCharge} onCheckedChange={setEditReverseCharge} />
              <Label>{t("invoices.reverseCharge")}</Label>
            </div>

            <div>
              <Label>{t("invoices.notes")}</Label>
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={editSendOnGenerate} onCheckedChange={setEditSendOnGenerate} />
              <Label className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {t("invoices.autoSend")}</Label>
            </div>

            <Button variant="hero" className="w-full" onClick={handleUpdateTemplate} disabled={updatingTemplate}>
              {updatingTemplate ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> {t("invoices.updating")}</> : <><Save className="w-4 h-4 mr-1" /> {t("invoices.updateTemplate")}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default InvoicesPage;
