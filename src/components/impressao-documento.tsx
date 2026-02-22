"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Printer, 
  Download, 
  Shield,
  QrCode,
  Hash,
  Building2,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { gerarDadosQRCode, gerarQRCodeDataURL } from "@/lib/qrcode";

interface DocumentoImpressao {
  numeroFormatado: string;
  tipo: string;
  dataEmissao: string | null;
  
  // Dados da empresa
  empresaNome: string;
  empresaNif: string;
  empresaMorada: string;
  empresaCodigoPostal: string;
  empresaLocalidade: string;
  
  // Dados do cliente
  clienteNome: string;
  clienteNif: string;
  clienteMorada: string | null;
  clienteCodigoPostal: string | null;
  clienteLocalidade: string | null;
  
  // Totais
  totalBase: number;
  totalIVA: number;
  totalLiquido: number;
  
  // Fiscal
  hash: string | null;
  atcud: string | null;
  
  // Linhas
  linhas: Array<{
    codigoArtigo: string;
    descricaoArtigo: string;
    quantidade: number;
    precoUnitario: number;
    taxaIVAPercentagem: number;
    base: number;
    valorIVA: number;
  }>;
  
  observacoes?: string | null;
}

interface ImpressaoDocumentoProps {
  documento: DocumentoImpressao;
  onClose?: () => void;
}

export function ImpressaoDocumento({ documento, onClose }: ImpressaoDocumentoProps) {
  const [qrCodeURL, setQRCodeURL] = useState<string>("");
  const [loadingQR, setLoadingQR] = useState(true);

  useEffect(() => {
    async function gerarQR() {
      if (documento.hash && documento.atcud) {
        try {
          const dadosQR = gerarDadosQRCode({
            nifEmissor: documento.empresaNif,
            nifCliente: documento.clienteNif,
            paisEmissor: "PT",
            tipoDocumento: documento.tipo,
            dataEmissao: documento.dataEmissao || "",
            numeroDocumento: documento.numeroFormatado,
            atcud: documento.atcud,
            totalBase: documento.totalBase,
            totalIVA: documento.totalIVA,
            hash: documento.hash,
          });
          const qrURL = await gerarQRCodeDataURL(dadosQR);
          setQRCodeURL(qrURL);
        } catch (error) {
          console.error("Erro ao gerar QR Code:", error);
        }
      }
      setLoadingQR(false);
    }
    gerarQR();
  }, [documento]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getTipoDocumentoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      FATURA: "Fatura",
      FATURA_RECIBO: "Fatura-Recibo",
      NOTA_CREDITO: "Nota de Crédito",
      NOTA_DEBITO: "Nota de Débito",
      RECIBO: "Recibo",
      ORCAMENTO: "Orçamento",
    };
    return tipos[tipo] || tipo;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Botões de ação (não imprimem) */}
      <div className="flex items-center justify-end gap-2 mb-4 print:hidden">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
        <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Documento */}
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
              {documento.linhas.map((linha, index) => (
                <tr key={index} className="border-t">
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
    </div>
  );
}
