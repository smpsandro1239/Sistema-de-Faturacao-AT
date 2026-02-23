"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Loader2, Repeat, Clock, CheckCircle, XCircle, Play, Pause } from "lucide-react";

const frequenciaConfig: Record<string, string> = {
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

const estadoConfig: Record<string, { label: string; color: string }> = {
  ATIVA: { label: "Ativa", color: "bg-green-100 text-green-800" },
  PAUSA: { label: "Pausada", color: "bg-yellow-100 text-yellow-800" },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-800" },
  CONCLUIDA: { label: "Concluída", color: "bg-gray-100 text-gray-800" },
};

export default function SubscricoesPage() {
  const [loading, setLoading] = useState(true);
  const [subscricoes, setSubscricoes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [dialogCriar, setDialogCriar] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    clienteId: "",
    descricao: "",
    frequencia: "MENSAL",
    serieId: "",
    dataInicio: new Date().toISOString().split("T")[0],
    linhas: [{ codigoArtigo: "SERV", descricaoArtigo: "Serviço Mensal", quantidade: 1, precoUnitario: 0, taxaIVAPercentagem: 23, taxaIVAId: "iva-normal" }],
  });

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [resS, resC, resSer] = await Promise.all([
        fetch("/api/subscricoes"),
        fetch("/api/clientes"),
        fetch("/api/series")
      ]);
      setSubscricoes(await resS.json());
      setClientes((await resC.json()).clientes || []);
      setSeries((await resSer.json()).filter((s: any) => s.tipoDocumento === "FATURA" || s.tipoDocumento === "FATURA_RECIBO"));
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const criarSubscricao = async () => {
    if (!form.clienteId || !form.serieId) return toast.error("Preencha os campos obrigatórios");
    setSaving(true);
    try {
      const res = await fetch("/api/subscricoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Subscrição criada");
        setDialogCriar(false);
        carregarDados();
      }
    } finally {
      setSaving(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(valor);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Faturação Recorrente (Avenças)</h1>
          <p className="text-muted-foreground">Gestão de subscrições e faturas automáticas</p>
        </div>
        <Button onClick={() => setDialogCriar(true)}><Plus className="h-4 w-4 mr-2" /> Nova Subscrição</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Próxima Emissão</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscricoes.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center">Sem subscrições registadas</TableCell></TableRow>
                ) : (
                  subscricoes.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.descricao}</TableCell>
                      <TableCell>{s.clienteNome}</TableCell>
                      <TableCell>{frequenciaConfig[s.frequencia]}</TableCell>
                      <TableCell>{new Date(s.proximaEmissao).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoConfig[s.estado]?.color}>
                          {estadoConfig[s.estado]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatarMoeda(s.totalLiquido)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          {s.estado === "ATIVA" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogCriar} onOpenChange={setDialogCriar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nova Subscrição / Avença</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label>Descrição da Avença</Label>
              <Input placeholder="Ex: Manutenção Mensal de TI" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select onValueChange={(v) => setForm({ ...form, clienteId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select defaultValue="MENSAL" onValueChange={(v) => setForm({ ...form, frequencia: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(frequenciaConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Série de Faturação</Label>
              <Select onValueChange={(v) => setForm({ ...form, serieId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a série" /></SelectTrigger>
                <SelectContent>
                  {series.map((s) => <SelectItem key={s.id} value={s.id}>{s.codigo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Valor Mensal (S/ IVA)</Label>
              <Input type="number" placeholder="0.00" onChange={(e) => {
                const valor = parseFloat(e.target.value) || 0;
                setForm({ ...form, linhas: [{ ...form.linhas[0], precoUnitario: valor }] });
              }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCriar(false)}>Cancelar</Button>
            <Button onClick={criarSubscricao} disabled={saving}>Criar Subscrição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
