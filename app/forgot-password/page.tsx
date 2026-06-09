"use client";

import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, implement actual password reset email
    toast.success("If that email exists, a reset link has been sent.");
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-7">
          <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>

          <h2 className="text-xl font-bold text-white mb-1">{t("resetPassword")}</h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter your email and we&apos;ll send you reset instructions.
          </p>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-white font-medium">Check your email</p>
              <p className="text-slate-400 text-sm mt-1">Reset instructions sent</p>
              <Link href="/login">
                <Button className="mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 border-0">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">{t("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-slate-500 rounded-xl"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl h-11 bg-gradient-to-r from-indigo-500 to-purple-600 border-0 font-semibold">
                Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
