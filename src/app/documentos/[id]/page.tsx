"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  ArrowLeft,
  Printer,
  QrCode,
  Hash,
  FileText,
  Users,
  Package,
  Settings,
  FileSpreadsheet,
  Download,
  Loader2
} from "lucide-react";
import { gerarDadosQRCode, gerarQRCodeDataURL } from "@/lib/qrcode";
import { gerarPDFDocumento } from "@/lib/pdf";
import { toast } from "sonner";

interface Documento {
  id: string;
  numero: number;
  numeroFormatado: string;
  tipo: string;
  dataEmissao: string | null;
  clienteNome: string;
  clienteNif: string;
  clienteMorada: string | null;
  clienteCodigoPostal: string | null;
  clienteLocalidade: string | null;
  empresaNome: string;
  empresaNif: string;
  empresaMorada: string;
  empresaCodigoPostal: string;
  empresaLocalidade: string;
  totalBase: number;
  totalIVA: number;
  totalLiquido: number;
  hash: string | null;
  atcud: string | null;
  estado: string;
  observacoes: string | null;
  linhas: Array<{
    id: string;
    codigoArtigo: string;
    descricaoArtigo: string;
    quantidade: number;
    precoUnitario: number;
    taxaIVAPercentagem: number;
    base: number;
    valorIVA: number;
  }>;
}

export default function DocumentoPage() {
  const params = useParams();
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [qrCodeURL, setQRCodeURL] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    const carregarDocumento = async () => {
      try {
        // Tentar carregar da API primeiro
        const response = await fetch(`/api/documentos?id=${params.id}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.documento) {
            setDocumento(data.documento);
            
            // Gerar QR Code
            if (data.documento.hash && data.documento.atcud) {
              const dadosQR = gerarDadosQRCode({
                nifEmissor: data.documento.empresaNif,
                nifCliente: data.documento.clienteNif,
                paisEmissor: "PT",
                tipoDocumento: data.documento.tipo,
                dataEmissao: data.documento.dataEmissao || "",
                numeroDocumento: data.documento.numeroFormatado,
                atcud: data.documento.atcud,
                totalBase: data.documento.totalBase,
                totalIVA: data.documento.totalIVA,
                hash: data.documento.hash,
              });
              
              const qrUrl = await gerarQRCodeDataURL(dadosQR);
              setQRCodeURL(qrUrl);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar documento:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDocumento();
  }, [params.id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getTipoDocumentoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      FATURA: "Fatura",
      FATURA_RECIBO: "Fatura-Recibo",
      NOTA_CREDITO: "Nota de Crédito",
      NOTA_DEBITO: "Nota de Débito",
    };
    return tipos[tipo] || tipo;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!documento) return;
    
    setExportingPDF(true);
    try {
      await gerarPDFDocumento({
        ...documento,
        qrCodeURL: qrCodeURL,
      });
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar PDF");
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>A carregar documento...</p>
        </div>
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
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
              <Button variant="outline" asChild>
                <Link href="/documentos">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Documento não encontrado</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
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
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/documentos">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
              <Button 
                onClick={handleExportPDF} 
                variant="outline"
                disabled={exportingPDF}
              >
                {exportingPDF ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
              <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/documentos" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
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
          </div>
        </div>
      </nav>

      {/* Document Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Card className="p-8 print:shadow-none print:border-none" id="documento-impressao">
          {/* Cabeçalho da empresa */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{documento.empresaNome}</h1>
              <div className="mt-2 text-sm text-slate-600 space-y-1">
                <p>NIF: {documento.empresaNif}</p>
                <p>{documento.empresaMorada}</p>
                <p>{documento.empresaCodigoPostal} {documento.empresaLocalidade}</p>
              </div>
            </div>
            
            <div className="text-right">
              <Badge className="text-lg px-4 py-2 bg-emerald-600">
                {getTipoDocumentoLabel(documento.tipo)}
              </Badge>
              <p className="mt-2 text-xl font-bold">{documento.numeroFormatado}</p>
              {documento.atcud && (
                <p className="text-xs text-slate-500 mt-1">ATCUD: {documento.atcud}</p>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Dados do cliente */}
          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <h2 className="font-semibold text-slate-700 mb-2">Destinatário</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">{documento.clienteNome}</p>
                <p className="text-slate-600">NIF: {documento.clienteNif}</p>
              </div>
              <div className="text-right text-slate-600">
                {documento.clienteMorada && <p>{documento.clienteMorada}</p>}
                {documento.clienteCodigoPostal && documento.clienteLocalidade && (
                  <p>{documento.clienteCodigoPostal} {documento.clienteLocalidade}</p>
                )}
              </div>
            </div>
          </div>

          {/* Data de emissão */}
          <div className="mb-6 text-sm text-slate-600">
            <strong>Data de Emissão:</strong>{" "}
            {documento.dataEmissao 
              ? new Date(documento.dataEmissao).toLocaleDateString('pt-PT')
              : "Rascunho"
            }
          </div>

          {/* Tabela de linhas */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-2 text-left">Código</th>
                  <th className="px-4 py-2 text-left">Descrição</th>
                  <th className="px-4 py-2 text-right">Qtd</th>
                  <th className="px-4 py-2 text-right">Preço</th>
                  <th className="px-4 py-2 text-right">IVA</th>
                  <th className="px-4 py-2 text-right">Base</th>
                </tr>
              </thead>
              <tbody>
                {documento.linhas.map((linha) => (
                  <tr key={linha.id} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{linha.codigoArtigo}</td>
                    <td className="px-4 py-2">{linha.descricaoArtigo}</td>
                    <td className="px-4 py-2 text-right">{linha.quantidade}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatCurrency(linha.precoUnitario)}</td>
                    <td className="px-4 py-2 text-right">{linha.taxaIVAPercentagem}%</td>
                    <td className="px-4 py-2 text-right font-mono">{formatCurrency(linha.base)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Base Tributável:</span>
                <span className="font-mono">{formatCurrency(documento.totalBase)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total IVA:</span>
                <span className="font-mono">{formatCurrency(documento.totalIVA)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="font-mono text-emerald-700">{formatCurrency(documento.totalLiquido)}</span>
              </div>
            </div>
          </div>

          {/* Observações */}
          {documento.observacoes && (
            <div className="bg-slate-50 p-4 rounded-lg mb-6 text-sm">
              <strong>Observações:</strong> {documento.observacoes}
            </div>
          )}

          <Separator className="my-4" />

          {/* Rodapé fiscal */}
          <div className="flex justify-between items-start mt-4">
            {/* QR Code */}
            <div className="flex items-center gap-2">
              {qrCodeURL && (
                <img src={qrCodeURL} alt="QR Code" className="w-24 h-24" />
              )}
              {!qrCodeURL && documento.hash && (
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center rounded">
                  <QrCode className="w-12 h-12 text-slate-400" />
                </div>
              )}
            </div>

            {/* Informações fiscais */}
            <div className="text-right text-xs text-slate-500">
              {documento.hash && (
                <div className="space-y-1">
                  <div className="flex items-center justify-end gap-1">
                    <Shield className="h-3 w-3 text-emerald-600" />
                    <span className="font-medium text-emerald-700">Documento Certificado AT</span>
                  </div>
                  <p>
                    <Hash className="h-3 w-3 inline mr-1" />
                    Hash: <span className="font-mono">{documento.hash.substring(0, 20)}...</span>
                  </p>
                  {documento.atcud && (
                    <p>ATCUD: {documento.atcud}</p>
                  )}
                  <p className="text-slate-400 mt-2">
                    Processado por programa certificado nº AT/DEMO/2024
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-slate-500 text-center">
            © 2024 FaturaAT - Sistema de Faturação Certificado pela AT
          </p>
        </div>
      </footer>
    </div>
  );
}
