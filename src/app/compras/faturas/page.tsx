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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Plus,
  FileText,
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

interface Fornecedor {
  id: string;
  nome: string;
  nif: string;
}

interface Fatura {
  id: string;
  numeroFatura: string;
  fornecedorNome: string;
  fornecedorNif: string;
  dataFatura: string;
  dataVencimento: string | null;
  totalLiquido: number;
  estado: string;
}

const estadosConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDENTE: { label: "Pendente", color: "bg-orange-100 text-orange-800", icon: <Clock className="h-3 w-3" /> },
  PAGA: { label: "Paga", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  PAGA_PARCIAL: { label: "Paga Parcial", color: "bg-blue-100 text-blue-800", icon: <Euro className="h-3 w-3" /> },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

export default function FaturasFornecedoresPage() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogCriar, setDialogCriar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    numeroFatura: "",
    fornecedorId: "",
    dataFatura: new Date().toISOString().split('T')[0],
    dataVencimento: "",
    observacoes: "",
    linhas: [] as any[],
  });

  const fetchFaturas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const response = await fetch(`/api/compras/faturas?${params}`);
      const data = await response.json();
      if (response.ok) setFaturas(data.faturas);
    } catch (error) {
      toast.error("Erro ao carregar faturas");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchFaturas();
    fetch("/api/fornecedores?limit=100")
      .then(res => res.json())
      .then(data => setFornecedores(data.fornecedores || []));
  }, [fetchFaturas]);

  const handleSalvar = async () => {
    if (!form.numeroFatura || !form.fornecedorId || form.linhas.length === 0) {
      toast.error("Preencha os campos obrigatórios e adicione linhas");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/compras/faturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        toast.success("Fatura registada!");
        setDialogCriar(false);
        fetchFaturas();
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
          <Link href="/compras">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="text-xl font-bold">Faturas de Fornecedores</h1>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Pesquisar faturas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setDialogCriar(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Registar Fatura
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">A carregar...</TableCell></TableRow>
                ) : faturas.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Nenhuma fatura registada</TableCell></TableRow>
                ) : (
                  faturas.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.numeroFatura}</TableCell>
                      <TableCell>{f.fornecedorNome}</TableCell>
                      <TableCell>{new Date(f.dataFatura).toLocaleDateString()}</TableCell>
                      <TableCell>{f.dataVencimento ? new Date(f.dataVencimento).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadosConfig[f.estado]?.color}>
                          {f.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(f.totalLiquido)}</TableCell>
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
            <DialogTitle>Registar Fatura de Fornecedor</DialogTitle>
            <DialogDescription>Introduza os dados da fatura recebida</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nº da Fatura *</Label>
                <Input value={form.numeroFatura} onChange={e => setForm({...form, numeroFatura: e.target.value})} placeholder="Ex: FR 12345" />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor *</Label>
                <Select value={form.fornecedorId} onValueChange={v => setForm({...form, fornecedorId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger>
                  <SelectContent>
                    {fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da Fatura *</Label>
                <Input type="date" value={form.dataFatura} onChange={e => setForm({...form, dataFatura: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Input type="date" value={form.dataVencimento} onChange={e => setForm({...form, dataVencimento: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Linhas (Simulação)</Label>
              <Button variant="outline" size="sm" onClick={() => setForm({...form, linhas: [...form.linhas, { descricaoArtigo: "Artigo Genérico", quantidade: 1, precoUnitario: 0, taxaIVAPercentagem: 23 }]})}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar Linha
              </Button>
              {form.linhas.map((l, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="Descrição" value={l.descricaoArtigo} onChange={e => {
                    const nl = [...form.linhas];
                    nl[i].descricaoArtigo = e.target.value;
                    setForm({...form, linhas: nl});
                  }} />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCriar(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gravar Fatura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
