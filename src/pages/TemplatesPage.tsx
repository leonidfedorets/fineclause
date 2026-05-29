import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, FileText, Download, Eye, Lock, X, Pencil, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import TemplateUnifiedView from "@/components/TemplateUnifiedView";
import { useTranslation } from "react-i18next";

export interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  file_path: string;
  file_name: string;
  tags: string[];
  created_at: string;
}

interface UserTemplate {
  id: string;
  template_id: string;
  custom_content: string;
  title: string | null;
  updated_at: string;
  template?: ContractTemplate;
}

const TemplatesPage = () => {
  const { t } = useTranslation();
  const { user, currentTierKey } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openTemplate, setOpenTemplate] = useState<ContractTemplate | null>(null);
  const [activeTab, setActiveTab] = useState("library");

  const canDownload = currentTierKey !== "free";

  const refreshPublicTemplates = useCallback(async () => {
    const { data } = await supabase
      .from("contract_templates" as any)
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("name");
    if (data) setTemplates(data as unknown as ContractTemplate[]);
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      await refreshPublicTemplates();
      setLoading(false);
    };
    fetchTemplates();
  }, [refreshPublicTemplates]);

  useEffect(() => {
    if (!user) return;
    const fetchUserTemplates = async () => {
      const { data } = await supabase
        .from("user_templates" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (data) {
        setUserTemplates(data as unknown as UserTemplate[]);
      }
    };
    fetchUserTemplates();
  }, [user]);

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return ["All", ...Array.from(cats).sort()];
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [templates, activeCategory, search]);

  const userTemplatesWithMeta = useMemo(() => {
    return userTemplates.map((ut) => ({
      ...ut,
      template: templates.find((t) => t.id === ut.template_id),
    }));
  }, [userTemplates, templates]);

  const handleDownload = (template: ContractTemplate) => {
    if (!canDownload) {
      toast({ title: t("templates.upgradeRequired"), description: t("templates.upgradeRequiredDesc"), variant: "destructive" });
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/contract-templates/${template.file_path}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = template.file_name;
    a.click();
  };

  const handleSaveUserTemplate = async (templateId: string, content: string, title?: string) => {
    if (!user) return;
    const existing = userTemplates.find((ut) => ut.template_id === templateId);
    if (existing) {
      const { error } = await supabase
        .from("user_templates" as any)
        .update({ custom_content: content, title: title || existing.title } as any)
        .eq("id", existing.id);
      if (error) {
        toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("user_templates" as any)
        .insert({ user_id: user.id, template_id: templateId, custom_content: content, title } as any);
      if (error) {
        toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" });
        return;
      }
    }
    toast({ title: t("templates.saved"), description: t("templates.savedDesc") });
    const { data } = await supabase.from("user_templates" as any).select("*").order("updated_at", { ascending: false });
    if (data) setUserTemplates(data as unknown as UserTemplate[]);
  };

  const handleDeleteUserTemplate = async (id: string) => {
    await supabase.from("user_templates" as any).delete().eq("id", id);
    setUserTemplates((prev) => prev.filter((ut) => ut.id !== id));
    toast({ title: t("templates.deleted"), description: t("templates.deletedDesc") });
  };

  const downloadUserTemplate = (ut: UserTemplate) => {
    const blob = new Blob([ut.custom_content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ut.title || ut.template?.name || "template"}_customized.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="font-[var(--font-display)] text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t("templates.title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {t("templates.subtitle", { count: templates.length })}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="library">
                <FileText className="w-4 h-4 mr-1.5" /> {t("templates.library")}
              </TabsTrigger>
              <TabsTrigger value="my-templates">
                <FolderOpen className="w-4 h-4 mr-1.5" /> {t("templates.myTemplates")}
                {userTemplates.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">{userTemplates.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("templates.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Select value={activeCategory} onValueChange={setActiveCategory}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder={t("templates.allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === "All" ? t("templates.allCategories") : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {activeCategory !== "All"
                    ? t("templates.templatesInCategory", { count: filtered.length, category: activeCategory })
                    : t("templates.templatesCount", { count: filtered.length })}
                </p>
              </div>

              {!canDownload && (
                <div className="mb-6 p-4 rounded-md bg-muted border border-border flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {t("templates.upgradeNotice")}
                  </p>
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader><div className="h-5 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-full mt-2" /></CardHeader>
                      <CardContent><div className="h-8 bg-muted rounded w-1/2" /></CardContent>
                    </Card>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("templates.noMatch")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((template) => (
                    <Card key={template.id} className="group hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5 transition-all duration-300 border-border/60">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="p-2.5 rounded-lg bg-accent/10 group-hover:bg-accent/15 transition-colors">
                            <FileText className="w-5 h-5 text-accent" />
                          </div>
                          <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider shrink-0 px-2.5">{template.category}</Badge>
                        </div>
                        <CardTitle className="text-lg mt-3 leading-snug font-[var(--font-display)]">{template.name}</CardTitle>
                        <CardDescription className="line-clamp-3 text-[13px] leading-relaxed">{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {template.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] font-mono cursor-pointer hover:bg-secondary transition-colors" onClick={() => setSearch(tag)}>
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 4 && (
                            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                              +{template.tags.length - 4}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setOpenTemplate(template)}>
                            <Eye className="w-3.5 h-3.5 mr-1" /> {t("templates.preview")}
                          </Button>
                          {canDownload ? (
                            <Button variant="default" size="sm" onClick={() => setOpenTemplate(template)}>
                              <Pencil className="w-3.5 h-3.5 mr-1" /> {t("templates.edit")}
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" className="flex-1" disabled>
                              <Lock className="w-3.5 h-3.5 mr-1" /> {t("templates.upgradeToUse")}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-templates">
              {userTemplatesWithMeta.length === 0 ? (
                <div className="text-center py-16">
                  <FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">{t("templates.noCustomYet")}</p>
                  <p className="text-sm text-muted-foreground">{t("templates.noCustomHint")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userTemplatesWithMeta.map((ut) => (
                    <Card key={ut.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="p-2 rounded-md bg-accent/10">
                            <FileText className="w-5 h-5 text-accent" />
                          </div>
                          <Badge variant="secondary" className="text-xs">{ut.template?.category || "Custom"}</Badge>
                        </div>
                        <CardTitle className="text-lg mt-3 leading-snug">{ut.title || ut.template?.name || "Untitled"}</CardTitle>
                        <CardDescription className="text-xs">
                          {t("templates.lastEdited", { date: new Date(ut.updated_at).toLocaleDateString() })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-3 mb-4 font-mono">{ut.custom_content.slice(0, 200)}...</p>
                        <div className="flex gap-2 items-center">
                          <Button variant="outline" size="sm" onClick={() => {
                            if (ut.template) setOpenTemplate(ut.template);
                          }}>
                            <Pencil className="w-3.5 h-3.5 mr-1" /> {t("templates.edit")}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => downloadUserTemplate(ut)}>
                            <Download className="w-3.5 h-3.5 mr-1" /> {t("templates.download")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteUserTemplate(ut.id)}
                          >
                            <X className="w-3.5 h-3.5" />
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
      </main>

      <Footer />

      <Dialog open={!!openTemplate} onOpenChange={(o) => !o && setOpenTemplate(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
            <DialogTitle className="font-[var(--font-display)]">{openTemplate?.name}</DialogTitle>
            <DialogDescription className="text-xs">{openTemplate?.description}</DialogDescription>
          </DialogHeader>
          {openTemplate && (
            <TemplateUnifiedView
              template={openTemplate}
              canEdit={canDownload}
              existingContent={userTemplates.find((ut) => ut.template_id === openTemplate.id)?.custom_content}
              onDownload={() => handleDownload(openTemplate)}
              onSave={(content) => handleSaveUserTemplate(openTemplate.id, content, openTemplate.name)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesPage;
