"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Mail, 
  Lock, 
  Loader2,
  AlertCircle,
  Database,
  RefreshCw,
  UserPlus,
  Key
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dbStatus, setDbStatus] = useState<{ hasData: boolean; error?: string } | null>(null);

  useEffect(() => {
    verificarEstado();
  }, []);

  const verificarEstado = async () => {
    try {
      const res = await fetch("/api/seed");
      const data = await res.json();
      setDbStatus(data);
    } catch {
      setDbStatus({ hasData: false, error: "Servidor indisponível" });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("utilizador", JSON.stringify(data.utilizador));
        router.push("/");
      } else {
        setError(data.error || "Erro ao fazer login.");
      }
    } catch {
      setError("Erro de ligação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        window.location.reload();
      } else {
        setError(data.error || "Erro ao inicializar base de dados.");
      }
    } catch {
      setError("Erro ao contactar servidor de seed.");
    } finally {
      setLoading(false);
    }
  };

  const preencherDemo = () => {
    setEmail("admin@faturaat.pt");
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg shadow-emerald-200">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">FaturaAT</CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Gestão de Faturação Certificada (Portugal)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dbStatus?.error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                {dbStatus.error}
                <div className="mt-2 text-xs opacity-80">
                  {dbStatus.error.includes("Unable to open")
                    ? "SQLite indisponível (Serverless Read-only). Recomendado usar PostgreSQL (Neon/Supabase) nas variáveis de ambiente."
                    : "Verifique a variável DATABASE_URL nas configurações do seu projeto."}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {dbStatus && !dbStatus.hasData && !dbStatus.error && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-800 animate-pulse">
              <Database className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex flex-col gap-3">
                <span className="font-semibold text-sm">O sistema ainda não foi inicializado.</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-white border-amber-300 hover:bg-amber-100 text-amber-900 font-bold"
                  onClick={handleSeed}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  INICIALIZAR DADOS DE TESTE
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@faturaat.pt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-slate-300 focus-visible:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" name="password" className="text-slate-700 font-semibold">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 border-slate-300 focus-visible:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-100 transition-all hover:scale-[1.01] active:scale-[0.99]"
                disabled={loading || !!dbStatus?.error}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    A processar...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={preencherDemo}
                className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                disabled={loading}
              >
                <Key className="h-4 w-4 mr-2" />
                Usar Credenciais de Teste
              </Button>
            </div>
          </form>

          <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-2">Ainda não tem conta?</p>
              <Link
                href="/registo"
                className="inline-flex items-center text-emerald-600 font-bold hover:underline"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Nova Organização
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
