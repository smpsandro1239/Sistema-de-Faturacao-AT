"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileSpreadsheet, 
  Shield,
  ArrowLeft,
  Download,
  FileCheck,
  Calendar,
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileX,
  BarChart3,
  Hash,
  Users,
  Package,
  Receipt,
  ExternalLink,
  HelpCircle,
  Info
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ValidationDetail {
  code: string;
  message: string;
  location: string;
  severity?: string;
}

interface ValidationStats {
  headerTags: number;
  masterFilesTags: number;
  sourceDocsTags: number;
  invoices: number;
  customers: number;
  products: number;
  taxEntries: number;
}

interface ValidationResult {
  status: 'valid' | 'invalid' | 'warnings';
  summary: string;
  details: {
    isValid: boolean;
    errors: ValidationDetail[];
    warnings: ValidationDetail[];
    stats: ValidationStats;
  };
  recommendations: string[];
}

interface SafTReport {
  id: string;
  periodo: string;
  ano: number;
  mes: number;
  dataGeracao: string;
  totalDocumentos: number;
  totalFaturado: number;
  status: "validado" | "erro" | "pendente";
}

export default function SafTPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [reports, setReports] = useState<SafTReport[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showErrors, setShowErrors] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);
  const [formData, setFormData] = useState({
    mes: String(new Date().getMonth() + 1),
    ano: String(new Date().getFullYear()),
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/saf-t/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleGenerateSafT = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/saf-t?mes=${formData.mes}&ano=${formData.ano}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SAF-T_${formData.ano}_${formData.mes}.xml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Ficheiro SAF-T gerado com sucesso!');
        setDialogOpen(false);
        fetchReports();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao gerar SAF-T');
      }
    } catch (error) {
      toast.error('Erro ao gerar SAF-T');
    } finally {
      setGenerating(false);
    }
  };

  const handleValidateSafT = async () => {
    setValidating(true);
    try {
      const response = await fetch(`/api/saf-t?mes=${formData.mes}&ano=${formData.ano}&validate=true`);
      if (response.ok) {
        const data = await response.json();
        setValidationResult(data);
        setValidationOpen(true);
      } else {
        toast.error('Erro ao validar SAF-T');
      }
    } catch (error) {
      toast.error('Erro ao validar SAF-T');
    } finally {
      setValidating(false);
    }
  };

  const handleDownload = async (report: SafTReport) => {
    try {
      const response = await fetch(`/api/saf-t?mes=${report.mes}&ano=${report.ano}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SAF-T_${report.ano}_${report.mes}.xml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast.error('Erro ao descarregar ficheiro');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "validado":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Validado
          </Badge>
        );
      case "erro":
        return (
          <Badge className="bg-red-100 text-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            Pendente
          </Badge>
        );
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
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
              Documentos
            </Link>
            <Link href="/clientes" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Clientes
            </Link>
            <Link href="/artigos" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Artigos
            </Link>
            <Link href="/series" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Séries
            </Link>
            <Link href="/saf-t" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
              <FileSpreadsheet className="h-4 w-4" />
              SAF-T
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">SAF-T (PT)</h2>
            <p className="text-slate-500">Gerar e validar ficheiros SAF-T para comunicação à AT</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleValidateSafT} variant="outline" disabled={validating}>
              {validating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4 mr-2" />
              )}
              Validar
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Gerar SAF-T
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <FileCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ficheiros Gerados</p>
                  <p className="text-2xl font-bold">{reports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Validados</p>
                  <p className="text-2xl font-bold">{reports.filter(r => r.status === "validado").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Último Período</p>
                  <p className="text-lg font-bold">
                    {reports.length > 0 ? reports[0].periodo : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Receipt className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Documentos</p>
                  <p className="text-2xl font-bold">
                    {reports.reduce((sum, r) => sum + r.totalDocumentos, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Histórico de Ficheiros SAF-T</CardTitle>
            <CardDescription>Ficheiros SAF-T gerados anteriormente</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileX className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum ficheiro SAF-T gerado ainda</p>
                <p className="text-sm text-slate-400">Clique em "Gerar SAF-T" para criar o primeiro ficheiro</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-lg border">
                        <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{report.periodo}</p>
                        <p className="text-sm text-slate-500">
                          {report.totalDocumentos} documentos • {formatCurrency(report.totalFaturado)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(report.status)}
                      <span className="text-sm text-slate-500 hidden sm:block">{report.dataGeracao}</span>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                        <Download className="h-4 w-4 mr-1" />
                        Descarregar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Info */}
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 p-3 rounded-full">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900 mb-2">Conformidade SAF-T (PT) 1.04_01</h3>
                <p className="text-sm text-emerald-700 mb-4">
                  O ficheiro SAF-T é gerado conforme o schema oficial da AT (Portaria n.º 302/2016), 
                  incluindo todas as secções obrigatórias e validação completa:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-4">
                  <div className="bg-white/50 p-2 rounded border border-emerald-200">
                    <p className="font-medium">Header</p>
                    <p className="text-xs text-slate-500">Dados da empresa</p>
                  </div>
                  <div className="bg-white/50 p-2 rounded border border-emerald-200">
                    <p className="font-medium">MasterFiles</p>
                    <p className="text-xs text-slate-500">Clientes, Artigos, Taxas</p>
                  </div>
                  <div className="bg-white/50 p-2 rounded border border-emerald-200">
                    <p className="font-medium">SourceDocs</p>
                    <p className="text-xs text-slate-500">Faturas, Notas</p>
                  </div>
                  <div className="bg-white/50 p-2 rounded border border-emerald-200">
                    <p className="font-medium">Payments</p>
                    <p className="text-xs text-slate-500">Pagamentos</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white">
                    <Hash className="h-3 w-3 mr-1" />
                    Hash SHA-256
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    <FileCheck className="h-3 w-3 mr-1" />
                    ATCUD
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    <Shield className="h-3 w-3 mr-1" />
                    QR Code
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Help Card */}
        <Card className="mt-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <HelpCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Como Validar com a AT</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Para garantir total conformidade, pode validar o ficheiro SAF-T utilizando os recursos oficiais da AT:
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2 bg-white/50 p-3 rounded-lg border border-blue-200">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div>
                      <p className="font-medium text-blue-900">Validador Online da AT</p>
                      <p className="text-blue-700">Aceda ao portal e-fatura e utilize a ferramenta de validação de SAF-T disponível na área de serviços tributários.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/50 p-3 rounded-lg border border-blue-200">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <div>
                      <p className="font-medium text-blue-900">Validação Local com XSD</p>
                      <p className="text-blue-700">Descarregue o schema XSD oficial do site da AT e valide o ficheiro XML localmente com ferramentas como XMLSpy ou online em <code className="bg-blue-100 px-1 rounded">coretas.gov.pt</code>.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/50 p-3 rounded-lg border border-blue-200">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <div>
                      <p className="font-medium text-blue-900">Verificação de Hash</p>
                      <p className="text-blue-700">Certifique-se de que todos os documentos têm hash SHA-256 válido e encadeado corretamente.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                    <Info className="h-3 w-3 mr-1" />
                    Schema: SAF-T PT 1.04_01
                  </Badge>
                  <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Portaria 302/2016
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Generate Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Gerar Ficheiro SAF-T</DialogTitle>
            <DialogDescription>
              Selecione o período para gerar o ficheiro SAF-T
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label>Mês</Label>
              <Select value={formData.mes} onValueChange={(value) => setFormData({ ...formData, mes: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Janeiro</SelectItem>
                  <SelectItem value="2">Fevereiro</SelectItem>
                  <SelectItem value="3">Março</SelectItem>
                  <SelectItem value="4">Abril</SelectItem>
                  <SelectItem value="5">Maio</SelectItem>
                  <SelectItem value="6">Junho</SelectItem>
                  <SelectItem value="7">Julho</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ano</Label>
              <Input 
                type="number" 
                value={formData.ano} 
                onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleGenerateSafT} className="bg-emerald-600 hover:bg-emerald-700" disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A gerar...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Gerar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Result Dialog */}
      <Dialog open={validationOpen} onOpenChange={setValidationOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {validationResult?.status === 'valid' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  SAF-T Válido
                </>
              ) : validationResult?.status === 'invalid' ? (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  SAF-T Inválido
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  SAF-T com Avisos
                </>
              )}
            </DialogTitle>
            <DialogDescription>{validationResult?.summary}</DialogDescription>
          </DialogHeader>

          {validationResult && (
            <div className="space-y-4 py-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <Receipt className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold">{validationResult.details.stats.invoices}</p>
                  <p className="text-xs text-slate-500">Faturas</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold">{validationResult.details.stats.customers}</p>
                  <p className="text-xs text-slate-500">Clientes</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <Package className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-lg font-bold">{validationResult.details.stats.products}</p>
                  <p className="text-xs text-slate-500">Artigos</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <BarChart3 className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-lg font-bold">{validationResult.details.stats.taxEntries}</p>
                  <p className="text-xs text-slate-500">Taxas IVA</p>
                </div>
              </div>

              {/* Errors */}
              {validationResult.details.errors.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="flex items-center gap-2 w-full text-left font-medium text-red-700 mb-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {validationResult.details.errors.length} Erro(s)
                    {showErrors ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </button>
                  {showErrors && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {validationResult.details.errors.map((error, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                          {getSeverityIcon(error.severity)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">{error.message}</p>
                            <p className="text-xs text-red-600">{error.location}</p>
                            <Badge variant="outline" className="text-xs mt-1">{error.code}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Warnings */}
              {validationResult.details.warnings.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowWarnings(!showWarnings)}
                    className="flex items-center gap-2 w-full text-left font-medium text-yellow-700 mb-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {validationResult.details.warnings.length} Aviso(s)
                    {showWarnings ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </button>
                  {showWarnings && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {validationResult.details.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-800">{warning.message}</p>
                            <p className="text-xs text-yellow-600">{warning.location}</p>
                            <Badge variant="outline" className="text-xs mt-1">{warning.code}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {validationResult.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Recomendações</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                    {validationResult.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setValidationOpen(false)}>
              Fechar
            </Button>
            {validationResult?.status === 'valid' && (
              <Button onClick={handleGenerateSafT} className="bg-emerald-600 hover:bg-emerald-700">
                <Download className="h-4 w-4 mr-2" />
                Descarregar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
