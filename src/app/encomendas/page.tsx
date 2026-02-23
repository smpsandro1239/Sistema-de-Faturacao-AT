"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Plus, MoreHorizontal, Package, CheckCircle, XCircle, Clock, Eye, FileText, Loader2, ArrowRight } from "lucide-react";

const estadosConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RASCUNHO: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: <FileText className="h-3 w-3" /> },
  CONFIRMADA: { label: "Confirmada", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-3 w-3" /> },
  EM_PREPARACAO: { label: "Em Preparação", color: "bg-yellow-100 text-yellow-800", icon: <Package className="h-3 w-3" /> },
  FATURADA: { label: "Faturada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

export default function EncomendasClientePage() {
  const [loading, setLoading] = useState(true);
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dialogCriar, setDialogCriar] = useState(false);
  const [dialogConverter, setDialogConverter] = useState(false);
  const [selecionada, setSelecionada] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    clienteId: "",
    linhas: [] as any[],
  });

  const [convertForm, setConvertForm] = useState({
    serieId: "",
  });

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [resE, resC, resS] = await Promise.all([
        fetch("/api/encomendas"),
        fetch("/api/clientes"),
        fetch("/api/series")
      ]);
      setEncomendas(await resE.json());
      setClientes((await resC.json()).clientes || []);
      setSeries((await resS.json()).filter((s: any) => s.tipoDocumento === "FATURA" || s.tipoDocumento === "FATURA_RECIBO"));
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const criarEncomenda = async () => {
    if (!form.clienteId) return toast.error("Selecione um cliente");
    setSaving(true);
    try {
      const res = await fetch("/api/encomendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, linhas: [{ codigoArtigo: "SERV", descricaoArtigo: "Serviço Geral", quantidade: 1, precoUnitario: 100, taxaIVAPercentagem: 23, taxaIVAId: "default" }] }),
      });
      if (res.ok) {
        toast.success("Encomenda criada");
        setDialogCriar(false);
        carregarDados();
      }
    } finally {
      setSaving(false);
    }
  };

  const converterParaFatura = async () => {
    if (!convertForm.serieId) return toast.error("Selecione uma série");
    setSaving(true);
    try {
      const res = await fetch(`/api/encomendas/${selecionada.id}/converter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(convertForm),
      });
      if (res.ok) {
        toast.success("Fatura gerada com sucesso");
        setDialogConverter(false);
        carregarDados();
      } else {
        const error = await res.json();
        toast.error(error.error);
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
          <h1 className="text-3xl font-bold">Encomendas de Clientes</h1>
          <p className="text-muted-foreground">Gestão de ordens de venda</p>
        </div>
        <Button onClick={() => setDialogCriar(true)}><Plus className="h-4 w-4 mr-2" /> Nova Encomenda</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encomendas.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-bold">{e.numeroFormatado}</TableCell>
                    <TableCell>{e.clienteNome}</TableCell>
                    <TableCell>{new Date(e.dataEncomenda).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={estadosConfig[e.estado]?.color}>
                        {estadosConfig[e.estado]?.icon} <span className="ml-1">{estadosConfig[e.estado]?.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatarMoeda(e.totalLiquido)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelecionada(e); setDialogConverter(true); }} disabled={e.estado === "FATURADA" || e.estado === "CANCELADA"}>
                            <ArrowRight className="h-4 w-4 mr-2" /> Converter em Fatura
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar (Simplificado para o demo) */}
      <Dialog open={dialogCriar} onOpenChange={setDialogCriar}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Encomenda</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select onValueChange={(v) => setForm({ ...form, clienteId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCriar(false)}>Cancelar</Button>
            <Button onClick={criarEncomenda} disabled={saving}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Converter */}
      <Dialog open={dialogConverter} onOpenChange={setDialogConverter}>
        <DialogContent>
          <DialogHeader><DialogTitle>Converter para Fatura</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p>Deseja converter a encomenda <strong>{selecionada?.numeroFormatado}</strong> em fatura?</p>
            <div className="space-y-2">
              <Label>Série de Faturação</Label>
              <Select onValueChange={(v) => setConvertForm({ serieId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a série" /></SelectTrigger>
                <SelectContent>
                  {series.map((s) => <SelectItem key={s.id} value={s.id}>{s.codigo} - {s.descricao}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogConverter(false)}>Cancelar</Button>
            <Button onClick={converterParaFatura} disabled={saving}>Confirmar Conversão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
