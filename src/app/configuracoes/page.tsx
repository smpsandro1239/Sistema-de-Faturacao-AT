"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  CheckCircle,
  FileText,
  Users,
  Package,
  Settings,
  FileSpreadsheet,
  Activity
} from "lucide-react";
import { toast } from "sonner";

interface Empresa {
  id: string;
  nome: string;
  nif: string;
  morada: string;
  codigoPostal: string;
  localidade: string;
  telefone: string | null;
  email: string | null;
  website: string | null;
  conservatoria: string | null;
  matricula: string | null;
  capitalSocial: number | null;
  certificadoAT: string | null;
  logo: string | null;
}

export default function ConfiguracoesPage() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    nif: "",
    morada: "",
    codigoPostal: "",
    localidade: "",
    telefone: "",
    email: "",
    website: "",
    conservatoria: "",
    matricula: "",
    capitalSocial: "",
    certificadoAT: "",
    logo: "",
  });

  useEffect(() => {
    fetchEmpresa();
  }, []);

  const fetchEmpresa = async () => {
    try {
      const response = await fetch("/api/empresa");
      if (response.ok) {
        const data = await response.json();
        setEmpresa(data);
        if (data) {
          setFormData({
            nome: data.nome || "",
            nif: data.nif || "",
            morada: data.morada || "",
            codigoPostal: data.codigoPostal || "",
            localidade: data.localidade || "",
            telefone: data.telefone || "",
            email: data.email || "",
            website: data.website || "",
            conservatoria: data.conservatoria || "",
            matricula: data.matricula || "",
            capitalSocial: data.capitalSocial?.toString() || "",
            certificadoAT: data.certificadoAT || "",
            logo: data.logo || "",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar empresa:", error);
      toast.error("Erro ao carregar dados da empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast.error("O logótipo deve ter menos de 500KB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capitalSocial: formData.capitalSocial ? parseFloat(formData.capitalSocial) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmpresa(data);
        toast.success("Dados da empresa guardados com sucesso!");
      } else {
        toast.error("Erro ao guardar dados da empresa");
      }
    } catch (error) {
      console.error("Erro ao guardar:", error);
      toast.error("Erro ao guardar dados da empresa");
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    try {
      const response = await fetch("/api/seed", { method: "POST" });
      if (response.ok) {
        toast.success("Dados de demonstração inicializados!");
        fetchEmpresa();
      } else {
        toast.error("Erro ao inicializar dados");
      }
    } catch {
      toast.error("Erro ao inicializar dados");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">FaturaAT</h1>
                <p className="text-xs text-slate-500">Sistema Certificado AT</p>
              </div>
            </Link>
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Certificado</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/documentos" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <FileText className="h-4 w-4" />
              Documentos
            </Link>
            <Link href="/clientes" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Users className="h-4 w-4" />
              Clientes
            </Link>
            <Link href="/artigos" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Package className="h-4 w-4" />
              Artigos
            </Link>
            <Link href="/series" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Settings className="h-4 w-4" />
              Séries
            </Link>
            <Link href="/saf-t" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <FileSpreadsheet className="h-4 w-4" />
              SAF-T
            </Link>
            <Link href="/auditoria" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Activity className="h-4 w-4" />
              Auditoria
            </Link>
            <Link href="/configuracoes" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
              <Building2 className="h-4 w-4" />
              Configurações
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Configurações da Empresa</h2>
          <p className="text-slate-500">Configure os dados da empresa para emissão de documentos</p>
        </div>

        {!empresa && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <CheckCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Ainda não existem dados da empresa configurados.{" "}
              <Button variant="link" className="p-0 h-auto text-amber-700 underline" onClick={handleSeed}>
                Inicializar dados de demonstração
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Estes dados serão incluídos em todos os documentos fiscais emitidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logótipo */}
            <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-slate-50">
              {formData.logo ? (
                <div className="relative group">
                  <img src={formData.logo} alt="Logo" className="max-h-32 rounded border shadow-sm" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                    <Button variant="secondary" size="sm" onClick={() => setFormData({ ...formData, logo: "" })}>
                      Remover
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Building2 className="h-12 w-12 mb-2" />
                  <p className="text-sm">Sem logótipo configurado</p>
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                <Button variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                  Selecionar Logótipo
                </Button>
                <p className="text-[10px] text-center mt-2 text-slate-500">PNG ou JPG até 500KB</p>
              </div>
            </div>

            {/* Dados básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nif">NIF *</Label>
                <Input
                  id="nif"
                  value={formData.nif}
                  onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                  placeholder="123456789"
                  maxLength={9}
                />
              </div>
            </div>

            {/* Morada */}
            <div className="space-y-2">
              <Label htmlFor="morada">Morada *</Label>
              <Input
                id="morada"
                value={formData.morada}
                onChange={(e) => setFormData({ ...formData, morada: e.target.value })}
                placeholder="Rua, número, andar"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigoPostal">Código Postal *</Label>
                <Input
                  id="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                  placeholder="1000-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localidade">Localidade *</Label>
                <Input
                  id="localidade"
                  value={formData.localidade}
                  onChange={(e) => setFormData({ ...formData, localidade: e.target.value })}
                  placeholder="Lisboa"
                />
              </div>
            </div>

            <Separator />

            {/* Contactos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="211234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="geral@empresa.pt"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.empresa.pt"
              />
            </div>

            <Separator />

            {/* Dados comerciais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conservatoria">Conservatória</Label>
                <Input
                  id="conservatoria"
                  value={formData.conservatoria}
                  onChange={(e) => setFormData({ ...formData, conservatoria: e.target.value })}
                  placeholder="Reg. Comercial de Lisboa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capitalSocial">Capital Social (€)</Label>
                <Input
                  id="capitalSocial"
                  type="number"
                  value={formData.capitalSocial}
                  onChange={(e) => setFormData({ ...formData, capitalSocial: e.target.value })}
                  placeholder="5000.00"
                />
              </div>
            </div>

            <Separator />

            {/* Certificação AT */}
            <div className="space-y-2">
              <Label htmlFor="certificadoAT">Número do Certificado AT</Label>
              <Input
                id="certificadoAT"
                value={formData.certificadoAT}
                onChange={(e) => setFormData({ ...formData, certificadoAT: e.target.value })}
                placeholder="AT/1234/2024"
              />
              <p className="text-xs text-slate-500">
                Número do certificado atribuído pela Autoridade Tributária
              </p>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={handleSeed}>
                Inicializar Dados Demo
              </Button>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    A guardar...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Alterações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações sobre certificação */}
        <Card className="mt-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 p-3 rounded-full">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900">Certificação AT</h3>
                <p className="text-sm text-emerald-700 mt-1">
                  Para obter a certificação oficial junto da Autoridade Tributária, o software deve cumprir 
                  todos os requisitos da Portaria 363/2010. Este sistema já inclui:
                </p>
                <ul className="text-sm text-emerald-700 mt-2 space-y-1">
                  <li>✓ Hash SHA-256 encadeado</li>
                  <li>✓ ATCUD (Código Único de Documento)</li>
                  <li>✓ QR Code com campos obrigatórios</li>
                  <li>✓ SAF-T (PT) XML</li>
                  <li>✓ Sistema de auditoria completo</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-slate-500 text-center">
            © 2024 FaturaAT - Sistema de Faturação Certificado pela AT
          </p>
        </div>
      </footer>
    </div>
  );
}
