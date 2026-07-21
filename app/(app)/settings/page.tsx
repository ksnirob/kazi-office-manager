"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { useTheme } from "@/contexts/theme-context";
import { useSession, signOut } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Moon,
  Sun,
  Languages,
  LogOut,
  Tag,
  Plus,
  ChevronRight,
  User,
  Shield,
  Smartphone,
  Code2,
  ExternalLink,
  Camera,
  Save,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { IncomeCategory, ExpenseCategory } from "@/types";

type CategoryType = "income" | "expense";
type CategoryEditState = {
  id: string;
  nameEn: string;
  nameBn: string;
};

const PROFILE_IMAGE_MAX_DATA_URL_LENGTH = 1_100_000;
const PROFILE_IMAGE_OUTPUT_SIZES = [512, 384, 256, 192];
const PROFILE_IMAGE_QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52, 0.42, 0.32];

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load image"));
    };
    image.src = url;
  });
}

async function compressProfileImage(file: File) {
  const image = await loadImage(file);
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, Math.round((image.naturalWidth - sourceSize) / 2));
  const sourceY = Math.max(0, Math.round((image.naturalHeight - sourceSize) / 2));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image compression is not supported in this browser");
  }

  for (const outputSize of PROFILE_IMAGE_OUTPUT_SIZES) {
    const size = Math.min(outputSize, sourceSize);
    canvas.width = size;
    canvas.height = size;
    context.clearRect(0, 0, size, size);
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

    for (const quality of PROFILE_IMAGE_QUALITY_STEPS) {
      const dataUrl = canvas.toDataURL("image/webp", quality);

      if (dataUrl.startsWith("data:image/webp;base64,") && dataUrl.length <= PROFILE_IMAGE_MAX_DATA_URL_LENGTH) {
        return dataUrl;
      }
    }

    for (const quality of PROFILE_IMAGE_QUALITY_STEPS) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);

      if (dataUrl.length <= PROFILE_IMAGE_MAX_DATA_URL_LENGTH) {
        return dataUrl;
      }
    }
  }

  throw new Error("Profile picture could not be compressed enough");
}

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { data: session, update } = useSession();
  const qc = useQueryClient();
  const [newIncomeCat, setNewIncomeCat] = useState({ nameEn: "", nameBn: "" });
  const [newExpenseCat, setNewExpenseCat] = useState({ nameEn: "", nameBn: "" });
  const [editingIncomeCat, setEditingIncomeCat] = useState<CategoryEditState | null>(null);
  const [editingExpenseCat, setEditingExpenseCat] = useState<CategoryEditState | null>(null);
  const [incomeCatOpen, setIncomeCatOpen] = useState(false);
  const [expenseCatOpen, setExpenseCatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isCompressingProfileImage, setIsCompressingProfileImage] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    image: "" as string | null,
    currentPassword: "",
    newPassword: "",
  });

  const { data: categories } = useQuery<{ income: IncomeCategory[]; expense: ExpenseCategory[] }>({
    queryKey: ["categories-all"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  });
  const { data: profile } = useQuery<{ name: string; email: string; image?: string | null; role?: string }>({
    queryKey: ["profile", session?.user?.id],
    queryFn: () => fetch("/api/profile").then((r) => r.json()),
    enabled: Boolean(session?.user),
  });

  const addIncomeCat = useMutation({
    mutationFn: (data: { nameEn: string; nameBn: string }) =>
      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "income" }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Income category added!");
      qc.invalidateQueries({ queryKey: ["income-categories"] });
      qc.invalidateQueries({ queryKey: ["categories-all"] });
      setNewIncomeCat({ nameEn: "", nameBn: "" });
      setIncomeCatOpen(false);
    },
    onError: () => toast.error("Failed to add category"),
  });

  const addExpenseCat = useMutation({
    mutationFn: (data: { nameEn: string; nameBn: string }) =>
      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "expense" }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Expense category added!");
      qc.invalidateQueries({ queryKey: ["expense-categories"] });
      qc.invalidateQueries({ queryKey: ["categories-all"] });
      setNewExpenseCat({ nameEn: "", nameBn: "" });
      setExpenseCatOpen(false);
    },
    onError: () => toast.error("Failed to add category"),
  });

  const updateCategory = useMutation({
    mutationFn: async (data: CategoryEditState & { type: CategoryType }) => {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Failed to update category");
      }

      return body as IncomeCategory | ExpenseCategory;
    },
    onSuccess: (_, variables) => {
      toast.success("Category updated!");
      qc.invalidateQueries({ queryKey: ["categories-all"] });
      qc.invalidateQueries({ queryKey: ["income-categories"] });
      qc.invalidateQueries({ queryKey: ["expense-categories"] });
      qc.invalidateQueries({ queryKey: ["income"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      if (variables.type === "income") {
        setEditingIncomeCat(null);
      } else {
        setEditingExpenseCat(null);
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update category"),
  });

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          image: profileForm.image,
          currentPassword: profileForm.currentPassword || undefined,
          newPassword: profileForm.newPassword || undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Failed to update profile");
      }

      return body as { name: string; email: string; image?: string | null; role?: string };
    },
    onSuccess: async (user) => {
      await update({
        user: {
          name: user.name,
          email: user.email,
        },
      });
      qc.setQueryData(["profile", session?.user?.id], user);
      qc.invalidateQueries({ queryKey: ["profile", session?.user?.id] });
      setProfileForm((form) => ({ ...form, currentPassword: "", newPassword: "" }));
      setProfileOpen(false);
      toast.success("Profile updated!");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update profile"),
  });

  const openProfileEditor = () => {
    setProfileForm({
      name: profile?.name ?? session?.user?.name ?? "",
      email: profile?.email ?? session?.user?.email ?? "",
      image: profile?.image ?? null,
      currentPassword: "",
      newPassword: "",
    });
    setProfileOpen(true);
  };

  const handleProfileImage = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Use a PNG, JPG, or WebP image");
      return;
    }

    setIsCompressingProfileImage(true);
    try {
      const compressedImage = await compressProfileImage(file);
      setProfileForm((form) => ({ ...form, image: compressedImage }));
      toast.success("Profile picture compressed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to compress profile picture");
    } finally {
      setIsCompressingProfileImage(false);
    }
  };

  const displayName = profile?.name ?? session?.user?.name;
  const displayEmail = profile?.email ?? session?.user?.email;
  const role = profile?.role ?? (session?.user as { role?: string })?.role;
  const initials = displayName
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col min-h-full">
      <Header title={t("settings")} />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Profile Card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 rounded-2xl">
              {profile?.image && (
                <AvatarImage src={profile.image} alt={displayName ?? "User"} />
              )}
              <AvatarFallback className="rounded-2xl bg-white/20 text-white font-bold">
                {initials ?? <User className="h-7 w-7 text-white" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">{displayName}</p>
              <p className="text-white/80 text-sm">{displayEmail}</p>
              <Badge className="mt-1 bg-white/20 text-white border-0 text-xs rounded-lg">
                <Shield className="h-3 w-3 mr-1" />
                {role ?? "Staff"}
              </Badge>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-xl bg-white/20 text-white hover:bg-white/30"
              onClick={openProfileEditor}
            >
              Edit
            </Button>
          </div>
        </div>

        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-20 w-20">
                  {profileForm.image && (
                    <AvatarImage src={profileForm.image} alt={profileForm.name || "Profile"} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                    {profileForm.name
                      ? profileForm.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <Label className="cursor-pointer rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted">
                  <Camera className="h-3.5 w-3.5" />
                  Upload picture
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => handleProfileImage(event.target.files?.[0])}
                  />
                </Label>
                {isCompressingProfileImage && (
                  <p className="text-xs text-muted-foreground">Compressing picture...</p>
                )}
                {profileForm.image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-xl text-xs"
                    onClick={() => setProfileForm((form) => ({ ...form, image: null }))}
                  >
                    Remove picture
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((form) => ({ ...form, name: event.target.value }))}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-2">
                <Label>Email or phone</Label>
                <Input
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((form) => ({ ...form, email: event.target.value }))}
                  className="rounded-xl h-10"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={profileForm.currentPassword}
                    onChange={(event) => setProfileForm((form) => ({ ...form, currentPassword: event.target.value }))}
                    className="rounded-xl h-10"
                    placeholder="Required to change password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={profileForm.newPassword}
                    onChange={(event) => setProfileForm((form) => ({ ...form, newPassword: event.target.value }))}
                    className="rounded-xl h-10"
                    placeholder="At least 8 characters"
                  />
                </div>
              </div>

              <Button
                type="button"
                className="w-full rounded-xl h-10"
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending || isCompressingProfileImage || !profileForm.name || !profileForm.email}
              >
                <Save className="h-4 w-4 mr-1.5" />
                {profileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Appearance */}
        <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Appearance</p>
          </div>

          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
                <span className="text-sm font-medium">
                  {theme === "dark" ? t("darkMode") : t("lightMode")}
                </span>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`relative w-11 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-indigo-500" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Languages className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{t("language")}</span>
              </div>
              <div className="flex rounded-xl overflow-hidden border border-border">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${language === "en" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("bn")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${language === "bn" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                >
                  বাং
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("categoryManagement")}
            </p>
          </div>

          <div className="divide-y divide-border/50">
            {/* Income Categories */}
            <Dialog open={incomeCatOpen} onOpenChange={setIncomeCatOpen}>
              <DialogTrigger
                className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
              >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-emerald-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Income Categories</p>
                      <p className="text-xs text-muted-foreground">{categories?.income?.length ?? 0} categories</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-sm">
                <DialogHeader>
                  <DialogTitle>Income Categories</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {categories?.income?.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-muted/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.nameEn}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.nameBn}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {c.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setEditingIncomeCat({ id: c.id, nameEn: c.nameEn, nameBn: c.nameBn })}
                            aria-label={`Edit ${c.nameEn}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  {editingIncomeCat ? (
                    <>
                      <p className="text-sm font-medium">Edit Category</p>
                      <Input
                        placeholder="English name"
                        value={editingIncomeCat.nameEn}
                        onChange={(e) => setEditingIncomeCat((p) => (p ? { ...p, nameEn: e.target.value } : p))}
                        className="rounded-xl"
                      />
                      <Input
                        placeholder="Bangla name"
                        value={editingIncomeCat.nameBn}
                        onChange={(e) => setEditingIncomeCat((p) => (p ? { ...p, nameBn: e.target.value } : p))}
                        className="rounded-xl"
                      />
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Button
                          type="button"
                          onClick={() => updateCategory.mutate({ ...editingIncomeCat, type: "income" })}
                          disabled={updateCategory.isPending || !editingIncomeCat.nameEn || !editingIncomeCat.nameBn}
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 border-0"
                        >
                          <Save className="h-4 w-4 mr-1.5" /> Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          onClick={() => setEditingIncomeCat(null)}
                          aria-label="Cancel edit"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                  <p className="text-sm font-medium">{t("addCustomCategory")}</p>
                  <Input
                    placeholder="English name"
                    value={newIncomeCat.nameEn}
                    onChange={(e) => setNewIncomeCat((p) => ({ ...p, nameEn: e.target.value }))}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="বাংলা নাম"
                    value={newIncomeCat.nameBn}
                    onChange={(e) => setNewIncomeCat((p) => ({ ...p, nameBn: e.target.value }))}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={() => addIncomeCat.mutate(newIncomeCat)}
                    disabled={!newIncomeCat.nameEn || !newIncomeCat.nameBn}
                    className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 border-0"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Category
                  </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Expense Categories */}
            <Dialog open={expenseCatOpen} onOpenChange={setExpenseCatOpen}>
              <DialogTrigger
                className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
              >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-red-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Expense Categories</p>
                      <p className="text-xs text-muted-foreground">{categories?.expense?.length ?? 0} categories</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-sm">
                <DialogHeader>
                  <DialogTitle>Expense Categories</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {categories?.expense?.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-muted/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.nameEn}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.nameBn}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {c.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setEditingExpenseCat({ id: c.id, nameEn: c.nameEn, nameBn: c.nameBn })}
                            aria-label={`Edit ${c.nameEn}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  {editingExpenseCat ? (
                    <>
                      <p className="text-sm font-medium">Edit Category</p>
                      <Input
                        placeholder="English name"
                        value={editingExpenseCat.nameEn}
                        onChange={(e) => setEditingExpenseCat((p) => (p ? { ...p, nameEn: e.target.value } : p))}
                        className="rounded-xl"
                      />
                      <Input
                        placeholder="Bangla name"
                        value={editingExpenseCat.nameBn}
                        onChange={(e) => setEditingExpenseCat((p) => (p ? { ...p, nameBn: e.target.value } : p))}
                        className="rounded-xl"
                      />
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Button
                          type="button"
                          onClick={() => updateCategory.mutate({ ...editingExpenseCat, type: "expense" })}
                          disabled={updateCategory.isPending || !editingExpenseCat.nameEn || !editingExpenseCat.nameBn}
                          className="rounded-xl bg-red-500 hover:bg-red-600 border-0"
                        >
                          <Save className="h-4 w-4 mr-1.5" /> Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          onClick={() => setEditingExpenseCat(null)}
                          aria-label="Cancel edit"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                  <p className="text-sm font-medium">{t("addCustomCategory")}</p>
                  <Input
                    placeholder="English name"
                    value={newExpenseCat.nameEn}
                    onChange={(e) => setNewExpenseCat((p) => ({ ...p, nameEn: e.target.value }))}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="বাংলা নাম"
                    value={newExpenseCat.nameBn}
                    onChange={(e) => setNewExpenseCat((p) => ({ ...p, nameBn: e.target.value }))}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={() => addExpenseCat.mutate(newExpenseCat)}
                    disabled={!newExpenseCat.nameEn || !newExpenseCat.nameBn}
                    className="w-full rounded-xl bg-red-500 hover:bg-red-600 border-0"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Category
                  </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <a
          href="https://ksnirob.com"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-card border border-border/50 shadow-sm px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Code2 className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Developer</p>
              <p className="text-xs text-muted-foreground">Khaled Saifullah</p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>

        {/* PWA Info */}
        <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">App Info</p>
          </div>
          <div className="px-4 py-3.5 flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-indigo-500" />
            <div>
              <p className="text-sm font-medium">Kazi Office PWA</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0 • Install for offline use</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full rounded-2xl h-12 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950"
          onClick={() => {
            qc.clear();
            signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("logout")}
        </Button>
      </div>
    </div>
  );
}
