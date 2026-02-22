"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Loader2,
  ArrowLeft,
  Calendar,
  Euro
} from "lucide-react";
import Link from "next/link";

interface Cliente {
  id: string;
  nome: string;
  nif: string;
}

interface Encomenda {
  id: string;
  numeroFormatado: string;
  clienteNome: string;
  clienteNif: string;
  dataEncomenda: string;
  dataEntregaPrevista: string | null;
  totalLiquido: number;
  estado: string;
}

const estadosConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RASCUNHO: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: <Clock className="h-3 w-3" /> },
  CONFIRMADA: { label: "Confirmada", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-3 w-3" /> },
  EM_PREPARACAO: { label: "Em Preparação", color: "bg-yellow-100 text-yellow-800", icon: <Package className="h-3 w-3" /> },
  FATURADA: { label: "Faturada", color: "bg-green-100 text-green-800", icon: <Euro className="h-3 w-3" /> },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

export default function EncomendasClientesPage() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogCriar, setDialogCriar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    clienteId: "",
    dataEntregaPrevista: "",
    observacoes: "",
    linhas: [] as any[],
  });

  const fetchEncomendas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const response = await fetch(`/api/vendas/encomendas?${params}`);
      const data = await response.json();
      if (response.ok) setEncomendas(data.encomendas);
    } catch (error) {
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchEncomendas();
    fetch("/api/clientes?limit=100")
      .then(res => res.json())
      .then(data => setClientes(data.clientes || []));
  }, [fetchEncomendas]);

  const handleSalvar = async () => {
    if (!form.clienteId || form.linhas.length === 0) {
      toast.error("Selecione um cliente e adicione produtos");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/vendas/encomendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        toast.success("Encomenda registada!");
        setDialogCriar(false);
        fetchEncomendas();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao salvar");
      }
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b h-16 flex items-center px-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="text-xl font-bold">Encomendas de Clientes</h1>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Pesquisar encomendas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setDialogCriar(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Encomenda
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Entrega Prevista</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">A carregar...</TableCell></TableRow>
                ) : encomendas.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Nenhuma encomenda encontrada</TableCell></TableRow>
                ) : (
                  encomendas.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.numeroFormatado}</TableCell>
                      <TableCell>{e.clienteNome}</TableCell>
                      <TableCell>{new Date(e.dataEncomenda).toLocaleDateString()}</TableCell>
                      <TableCell>{e.dataEntregaPrevista ? new Date(e.dataEntregaPrevista).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadosConfig[e.estado]?.color}>
                          {e.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(e.totalLiquido)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogCriar} onOpenChange={setDialogCriar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Encomenda de Cliente</DialogTitle>
            <DialogDescription>Crie uma ordem de venda para um cliente</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={form.clienteId} onValueChange={v => setForm({...form, clienteId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entrega Prevista</Label>
                <Input type="date" value={form.dataEntregaPrevista} onChange={e => setForm({...form, dataEntregaPrevista: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Artigos (Simulação)</Label>
              <Button variant="outline" size="sm" onClick={() => setForm({...form, linhas: [...form.linhas, { codigoArtigo: "ART001", descricaoArtigo: "Artigo Exemplo", quantidade: 1, precoUnitario: 100, taxaIVAPercentagem: 23 }]})}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar Artigo
              </Button>
              {form.linhas.map((l, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-sm flex-1">{l.descricaoArtigo}</span>
                  <Input type="number" className="w-20" placeholder="Qtd" value={l.quantidade} onChange={e => {
                    const nl = [...form.linhas];
                    nl[i].quantidade = parseFloat(e.target.value);
                    setForm({...form, linhas: nl});
                  }} />
                  <Input type="number" className="w-24" placeholder="Preço" value={l.precoUnitario} onChange={e => {
                    const nl = [...form.linhas];
                    nl[i].precoUnitario = parseFloat(e.target.value);
                    setForm({...form, linhas: nl});
                  }} />
                  <Button variant="ghost" size="icon" onClick={() => setForm({...form, linhas: form.linhas.filter((_, idx) => idx !== i)})}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCriar(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Encomenda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
