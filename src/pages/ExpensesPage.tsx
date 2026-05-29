import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Trash2, Upload, Loader2, Receipt, DollarSign, TrendingUp,
  PieChart, FileText, Download, Pencil, ArrowLeft, Camera
} from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = [
  "food", "transport", "office", "software", "travel", "entertainment",
  "utilities", "insurance", "medical", "education", "clothing", "rent", "subscriptions", "other",
] as const;

const CURRENCIES = ["EUR", "USD", "GBP", "PLN", "CZK"];

interface Expense {
  id: string;
  amount: number;
  currency: string;
  vendor_name: string | null;
  category: string;
  description: string | null;
  expense_date: string;
  receipt_file_path: string | null;
  receipt_file_name: string | null;
  linked_invoice_id: string | null;
  ai_extracted_data: any;
  created_at: string;
}

const ExpensesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState("add");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptFilePath, setReceiptFilePath] = useState<string | null>(null);
  const [aiData, setAiData] = useState<any>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");

  useEffect(() => {
    if (user) fetchExpenses();
  }, [user]);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });
    if (!error && data) setExpenses(data as unknown as Expense[]);
    setLoading(false);
  };

  const resetForm = () => {
    setAmount("");
    setCurrency("EUR");
    setVendorName("");
    setCategory("other");
    setDescription("");
    setExpenseDate(format(new Date(), "yyyy-MM-dd"));
    setReceiptFileName(null);
    setReceiptFilePath(null);
    setAiData(null);
    setEditId(null);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(t("expenses.invalidFile"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("expenses.fileTooLarge"));
      return;
    }

    setUploading(true);
    setReceiptFileName(file.name);

    try {
      // Upload to storage
      const filePath = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("receipt-uploads")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      setReceiptFilePath(filePath);

      // AI extraction
      const formData = new FormData();
      formData.append("file", file);

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-receipt`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.access_token}` },
          body: formData,
        }
      );

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      const extracted = result.extracted;
      setAiData(extracted);

      // Pre-fill form
      if (extracted.amount) setAmount(String(extracted.amount));
      if (extracted.currency) setCurrency(extracted.currency);
      if (extracted.vendor_name) setVendorName(extracted.vendor_name);
      if (extracted.category) setCategory(extracted.category);
      if (extracted.description) setDescription(extracted.description);
      if (extracted.expense_date) setExpenseDate(extracted.expense_date);

      toast.success(t("expenses.receiptExtracted"));
    } catch (err: any) {
      toast.error(err.message || t("expenses.receiptFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t("expenses.amountRequired"));
      return;
    }

    setSaving(true);
    try {
      const record = {
        user_id: user!.id,
        amount: parseFloat(amount),
        currency,
        vendor_name: vendorName || null,
        category,
        description: description || null,
        expense_date: expenseDate,
        receipt_file_path: receiptFilePath,
        receipt_file_name: receiptFileName,
        ai_extracted_data: aiData,
      };

      if (editId) {
        const { error } = await supabase
          .from("expenses")
          .update(record)
          .eq("id", editId);
        if (error) throw error;
        toast.success(t("expenses.updated"));
      } else {
        const { error } = await supabase
          .from("expenses")
          .insert(record);
        if (error) throw error;
        toast.success(t("expenses.saved"));
      }

      resetForm();
      fetchExpenses();
      setTab("list");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) {
      toast.success(t("expenses.deleted"));
      fetchExpenses();
    }
  };

  const handleEdit = (exp: Expense) => {
    setEditId(exp.id);
    setAmount(String(exp.amount));
    setCurrency(exp.currency);
    setVendorName(exp.vendor_name || "");
    setCategory(exp.category);
    setDescription(exp.description || "");
    setExpenseDate(exp.expense_date);
    setReceiptFileName(exp.receipt_file_name);
    setReceiptFilePath(exp.receipt_file_path);
    setAiData(exp.ai_extracted_data);
    setTab("add");
  };

  // Filtered expenses
  const filtered = expenses.filter((e) => {
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    if (filterMonth && !e.expense_date.startsWith(filterMonth)) return false;
    return true;
  });

  // Summary stats
  const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount), 0);
  const categoryTotals = filtered.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  const mainCurrency = filtered.length > 0
    ? filtered.reduce((acc, e) => {
        acc[e.currency] = (acc[e.currency] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};
  const displayCurrency = Object.keys(mainCurrency).sort((a, b) => mainCurrency[b] - mainCurrency[a])[0] || "EUR";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("expenses.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("expenses.subtitle")}</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("expenses.totalExpenses")}</p>
                <p className="text-lg font-bold">{displayCurrency} {totalAmount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("expenses.totalReceipts")}</p>
                <p className="text-lg font-bold">{filtered.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <PieChart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("expenses.topCategory")}</p>
                <p className="text-lg font-bold">
                  {Object.keys(categoryTotals).length > 0
                    ? t(`expenses.cat_${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]}`)
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="add">
              <Plus className="w-4 h-4 mr-1" />
              {editId ? t("expenses.editExpense") : t("expenses.addExpense")}
            </TabsTrigger>
            <TabsTrigger value="list">
              <FileText className="w-4 h-4 mr-1" />
              {t("expenses.listTab")}
            </TabsTrigger>
            <TabsTrigger value="report">
              <TrendingUp className="w-4 h-4 mr-1" />
              {t("expenses.reportTab")}
            </TabsTrigger>
          </TabsList>

          {/* ADD / EDIT TAB */}
          <TabsContent value="add">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Receipt upload */}
              <Card className="border-dashed border-2 border-primary/30 bg-primary/5 md:col-span-2">
                <CardContent className="py-6 text-center">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={handleReceiptUpload}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        {t("expenses.aiReading")} <strong>{receiptFileName}</strong>...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Camera className="w-6 h-6 text-primary" />
                        <Receipt className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t("expenses.uploadReceipt")}</p>
                        <p className="text-xs text-muted-foreground">{t("expenses.uploadReceiptDesc")}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-1" /> {t("expenses.chooseFile")}
                      </Button>
                      {receiptFileName && (
                        <Badge variant="secondary" className="mt-1">{receiptFileName}</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Form fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("expenses.amount")} *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>{t("expenses.currency")}</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>{t("expenses.vendor")}</Label>
                  <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder={t("expenses.vendorPlaceholder")} />
                </div>

                <div>
                  <Label>{t("expenses.category")}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{t(`expenses.cat_${c}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>{t("expenses.date")}</Label>
                  <Input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>{t("expenses.description")}</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("expenses.descriptionPlaceholder")}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                    {editId ? t("expenses.update") : t("expenses.save")}
                  </Button>
                  {editId && (
                    <Button variant="outline" onClick={() => { resetForm(); }}>
                      {t("expenses.cancel")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* LIST TAB */}
          <TabsContent value="list">
            <div className="flex flex-wrap gap-3 mb-4">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder={t("expenses.allCategories")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("expenses.allCategories")}</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{t(`expenses.cat_${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-[180px]"
              />
              {filterMonth && (
                <Button variant="ghost" size="sm" onClick={() => setFilterMonth("")}>
                  {t("expenses.clearFilter")}
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {t("expenses.noExpenses")}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filtered.map((exp) => (
                  <Card key={exp.id} className="hover:bg-accent/5 transition-colors">
                    <CardContent className="py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {exp.vendor_name || t("expenses.unknownVendor")}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {t(`expenses.cat_${exp.category}`)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {exp.description || "—"} · {format(new Date(exp.expense_date), "dd MMM yyyy")}
                        </p>
                      </div>
                      <span className="font-bold text-sm whitespace-nowrap">
                        {exp.currency} {Number(exp.amount).toFixed(2)}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(exp)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(exp.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REPORT TAB */}
          <TabsContent value="report">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("expenses.byCategory")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(categoryTotals).length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("expenses.noData")}</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(categoryTotals)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, total]) => {
                          const pct = totalAmount > 0 ? (total / totalAmount) * 100 : 0;
                          return (
                            <div key={cat}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{t(`expenses.cat_${cat}`)}</span>
                                <span className="font-medium">{displayCurrency} {total.toFixed(2)} ({pct.toFixed(0)}%)</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("expenses.summaryTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{t("expenses.totalExpenses")}</span>
                    <span className="font-bold">{displayCurrency} {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("expenses.totalReceipts")}</span>
                    <span className="font-bold">{filtered.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("expenses.categoriesUsed")}</span>
                    <span className="font-bold">{Object.keys(categoryTotals).length}</span>
                  </div>
                  {filtered.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{t("expenses.avgExpense")}</span>
                      <span className="font-bold">{displayCurrency} {(totalAmount / filtered.length).toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ExpensesPage;
