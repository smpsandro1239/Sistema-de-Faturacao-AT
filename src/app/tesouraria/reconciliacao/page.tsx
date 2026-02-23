"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle2, Link as LinkIcon, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ReconciliacaoPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ movimentos: [], faturasPendentes: [] });
  const [selectedMovimento, setSelectedMovimento] = useState<any>(null);
  const [selectedFatura, setSelectedFatura] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tesouraria/reconciliacao");
      if (res.ok) setData(await res.json());
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleReconcile = async () => {
    if (!selectedMovimento || !selectedFatura) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/tesouraria/reconciliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movimentoId: selectedMovimento.id,
          documentoId: selectedFatura.id,
        })
      });

      if (res.ok) {
        toast.success("Reconciliação efetuada com sucesso!");
        setSelectedMovimento(null);
        setSelectedFatura(null);
        carregarDados();
      } else {
        toast.error("Erro ao reconciliar");
      }
    } catch (error) {
      toast.error("Erro de ligação");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reconciliação Bancária</h1>
          <p className="text-slate-500">Associe movimentos do extrato bancário a faturas emitidas.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Movimentos Bancários */}
        <Card className={selectedMovimento ? "ring-2 ring-emerald-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Extrato Bancário</CardTitle>
              <CardDescription>Movimentos pendentes de conciliação</CardDescription>
            </div>
            <Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-2" /> Importar CSV</Button>
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.movimentos.map((m: any) => (
                    <TableRow
                      key={m.id}
                      className={`cursor-pointer transition-colors ${selectedMovimento?.id === m.id ? "bg-emerald-50" : "hover:bg-slate-50"}`}
                      onClick={() => setSelectedMovimento(m)}
                    >
                      <TableCell>{new Date(m.data).toLocaleDateString("pt-PT")}</TableCell>
                      <TableCell className="font-medium">{m.descricao}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-700">{formatCurrency(m.valor)}</TableCell>
                    </TableRow>
                  ))}
                  {data.movimentos.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8">Sem movimentos pendentes</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Lado Direito: Faturas Pendentes */}
        <Card className={selectedFatura ? "ring-2 ring-blue-500" : ""}>
          <CardHeader>
            <CardTitle>Faturas Pendentes</CardTitle>
            <CardDescription>Documentos emitidos a aguardar pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Em Aberto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.faturasPendentes.map((f: any) => {
                    const totalPago = f.pagamentos.reduce((sum, p) => sum + p.valor, 0);
                    const emAberto = f.totalLiquido - totalPago;
                    return (
                      <TableRow
                        key={f.id}
                        className={`cursor-pointer transition-colors ${selectedFatura?.id === f.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                        onClick={() => setSelectedFatura(f)}
                      >
                        <TableCell className="font-medium">{f.numeroFormatado}</TableCell>
                        <TableCell>{f.clienteNome}</TableCell>
                        <TableCell className="text-right font-mono text-red-600">{formatCurrency(emAberto)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ação Flutuante */}
      {selectedMovimento && selectedFatura && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border shadow-2xl rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-2 rounded-lg"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Associar movimento a fatura</p>
              <p className="font-bold">{selectedMovimento.descricao} <LinkIcon className="inline w-4 h-4 mx-1" /> {selectedFatura.numeroFormatado}</p>
            </div>
          </div>
          <Button onClick={handleReconcile} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8">
            {processing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
            Confirmar Reconciliação
          </Button>
        </div>
      )}
    </div>
  );
}
