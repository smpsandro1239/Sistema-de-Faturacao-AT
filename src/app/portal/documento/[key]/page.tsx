"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Printer,
  Building2,
  User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DocumentPortalPage() {
  const { key } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"CARD" | "MBWAY" | null>(null);

  useEffect(() => {
    fetch(`/api/portal/documento/${key}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) toast.error(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar documento");
        setLoading(false);
      });
  }, [key]);

  const handlePay = async () => {
    if (!selectedMethod) return toast.error("Selecione um método de pagamento");

    setPaying(true);
    try {
      const res = await fetch(`/api/portal/documento/${key}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo: selectedMethod })
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Pagamento processado com sucesso!");
        // Refresh data
        const newData = { ...data };
        newData.documento.estadoPagamento = "PAGO";
        setData(newData);
      } else {
        toast.error(result.error || "Erro no pagamento");
      }
    } catch (error) {
      toast.error("Erro ao processar pagamento");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!data?.documento) return <div className="flex items-center justify-center min-h-screen text-red-500">Documento não encontrado</div>;

  const { documento, empresa } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header com Estado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{documento.tipo} {documento.numeroFormatado}</h1>
            <p className="text-slate-500">Emitido em {format(new Date(documento.dataEmissao), "dd/MM/yyyy HH:mm")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={documento.estadoPagamento === "PAGO" ? "default" : "outline"} className={documento.estadoPagamento === "PAGO" ? "bg-emerald-500" : "text-amber-600 border-amber-600"}>
              {documento.estadoPagamento === "PAGO" ? "PAGO" : "PAGAMENTO PENDENTE"}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Detalhes do Documento */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Detalhes da Fatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <div className="flex items-center text-slate-400 text-sm mb-1">
                    <Building2 className="w-3 h-3 mr-1" /> EMISSOR
                  </div>
                  <p className="font-bold">{empresa.nome}</p>
                  <p className="text-sm text-slate-600">NIF: {empresa.nif}</p>
                  <p className="text-sm text-slate-600">{empresa.morada}</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center justify-end text-slate-400 text-sm mb-1">
                    <User className="w-3 h-3 mr-1" /> CLIENTE
                  </div>
                  <p className="font-bold">{documento.clienteNome}</p>
                  <p className="text-sm text-slate-600">NIF: {documento.clienteNif}</p>
                </div>
              </div>

              <Separator />

              <table className="w-100 w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="pb-2">Descrição</th>
                    <th className="pb-2 text-right">Qtd</th>
                    <th className="pb-2 text-right">Preço</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {documento.linhas.map((l: any) => (
                    <tr key={l.id}>
                      <td className="py-3">{l.descricaoArtigo}</td>
                      <td className="py-3 text-right">{l.quantidade}</td>
                      <td className="py-3 text-right">{l.precoUnitario.toFixed(2)}€</td>
                      <td className="py-3 text-right font-medium">{l.base.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-4">
                <div className="w-48 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Base</span>
                    <span>{documento.totalBase.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">IVA</span>
                    <span>{documento.totalIVA.toFixed(2)}€</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{documento.totalLiquido.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coluna Direita: Ações de Pagamento */}
          <div className="space-y-6">
            {documento.estadoPagamento !== "PAGO" && (
              <Card className="border-emerald-100 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-emerald-900">Pagar Agora</CardTitle>
                  <CardDescription>Escolha um método de pagamento seguro.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${selectedMethod === 'CARD' ? 'border-emerald-500 bg-emerald-50' : 'bg-white hover:border-emerald-200'}`}
                    onClick={() => setSelectedMethod('CARD')}
                  >
                    <div className="bg-slate-100 p-2 rounded">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Cartão de Crédito</p>
                      <p className="text-xs text-slate-500">Stripe Secure</p>
                    </div>
                    {selectedMethod === 'CARD' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${selectedMethod === 'MBWAY' ? 'border-emerald-500 bg-emerald-50' : 'bg-white hover:border-emerald-200'}`}
                    onClick={() => setSelectedMethod('MBWAY')}
                  >
                    <div className="bg-slate-100 p-2 rounded">
                      <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800">MBWAY</Badge>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">MB WAY</p>
                      <p className="text-xs text-slate-500">Pagamento instantâneo</p>
                    </div>
                    {selectedMethod === 'MBWAY' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handlePay} disabled={paying}>
                    {paying ? "Processando..." : `Pagar ${documento.totalLiquido.toFixed(2)}€`}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {documento.estadoPagamento === "PAGO" && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader className="text-center pb-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                  <CardTitle className="text-emerald-900">Documento Liquidado</CardTitle>
                  <CardDescription className="text-emerald-700">Agradecemos o seu pagamento.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-xs text-emerald-600">
                  Transação concluída via {documento.metodoPagamento || "sistema"}.
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Informações Fiscais</CardTitle>
              </CardHeader>
              <CardContent className="text-[10px] font-mono text-slate-400 space-y-2">
                <p>ATCUD: {documento.atcud || "N/A"}</p>
                <p className="break-all">HASH: {documento.hash || "N/A"}</p>
                <p>CERTIFICADO AT: 0000</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
