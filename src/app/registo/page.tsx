"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Building2,
  User,
  Mail,
  Lock,
  MapPin,
  Hash,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function RegisterOrgPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    empresa: {
      nome: "",
      nif: "",
      morada: "",
      codigoPostal: "",
      localidade: "",
    },
    admin: {
      nome: "",
      email: "",
      password: "",
    }
  });

  const handleChange = (section: 'empresa' | 'admin', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.error || "Erro ao criar organização.");
      }
    } catch {
      setError("Erro de ligação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 mb-2">Registo Concluído!</CardTitle>
          <CardDescription className="text-lg text-slate-600">
            A sua organização foi criada com sucesso. <br/>
            Irá ser redirecionado para o login em instantes...
          </CardDescription>
          <Button
            className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => router.push("/login")}
          >
            Ir para Login Agora
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-2xl shadow-xl border-slate-200">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-200">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Criar Nova Organização</CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Junte-se à FaturaAT e comece a faturar de forma simples e certificada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Secção Empresa */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Dados da Empresa</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-nome">Nome da Empresa</Label>
                  <Input
                    id="org-nome"
                    placeholder="Ex: Minha Empresa, Lda"
                    required
                    value={formData.empresa.nome}
                    onChange={e => handleChange('empresa', 'nome', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-nif">NIF</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="org-nif"
                      placeholder="9 dígitos"
                      maxLength={9}
                      className="pl-9"
                      required
                      value={formData.empresa.nif}
                      onChange={e => handleChange('empresa', 'nif', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-morada">Morada</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="org-morada"
                      placeholder="Rua, Número, Andar"
                      className="pl-9"
                      required
                      value={formData.empresa.morada}
                      onChange={e => handleChange('empresa', 'morada', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-cp">Cód. Postal</Label>
                    <Input
                      id="org-cp"
                      placeholder="0000-000"
                      required
                      value={formData.empresa.codigoPostal}
                      onChange={e => handleChange('empresa', 'codigoPostal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-local">Localidade</Label>
                    <Input
                      id="org-local"
                      placeholder="Cidade"
                      required
                      value={formData.empresa.localidade}
                      onChange={e => handleChange('empresa', 'localidade', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Secção Admin */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Dados do Administrador</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-nome">Nome Completo</Label>
                  <Input
                    id="admin-nome"
                    placeholder="Seu Nome"
                    required
                    value={formData.admin.nome}
                    onChange={e => handleChange('admin', 'nome', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email Profissional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="email@empresa.pt"
                      className="pl-9"
                      required
                      value={formData.admin.email}
                      onChange={e => handleChange('admin', 'email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-pass">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="admin-pass"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      className="pl-9"
                      required
                      value={formData.admin.password}
                      onChange={e => handleChange('admin', 'password', e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    <strong>Nota:</strong> Como administrador, terá acesso total às configurações, faturação e gestão de utilizadores da sua organização.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-100 transition-all hover:scale-[1.01]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    A criar conta...
                  </>
                ) : (
                  <>
                    Concluir Registo e Começar
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-slate-500 hover:text-emerald-600 font-medium">
                  Já tem conta? Voltar ao login
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
