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
import { Plus, Loader2, CreditCard, Search } from "lucide-react";

const estadosPagamentoConfig: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: "Pendente", color: "bg-red-100 text-red-800" },
  PARCIAL: { label: "Parcial", color: "bg-yellow-100 text-yellow-800" },
  PAGO: { label: "Pago", color: "bg-green-100 text-green-800" },
};

export default function FaturasCompraPage() {
  const [loading, setLoading] = useState(true);
  const [faturas, setFaturas] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [dialogCriar, setDialogCriar] = useState(false);
  const [dialogPagamento, setDialogPagamento] = useState(false);
  const [selecionada, setSelecionada] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    numero: "",
    fornecedorId: "",
    dataEmissao: new Date().toISOString().split("T")[0],
    linhas: [{ descricao: "Compra Geral", quantidade: 1, precoUnitario: 0, taxaIVAPercentagem: 23, taxaIVAId: "iva-normal" }],
  });

  const [pagamentoForm, setPagamentoForm] = useState({
    valor: 0,
    metodo: "TRANSFERENCIA",
  });

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [resF, resP] = await Promise.all([
        fetch("/api/compras/faturas"),
        fetch("/api/fornecedores")
      ]);
      setFaturas(await resF.json());
      setFornecedores((await resP.json()).fornecedores || []);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const criarFatura = async () => {
    if (!form.fornecedorId || !form.numero) return toast.error("Preencha os campos obrigatórios");
    setSaving(true);
    try {
      const res = await fetch("/api/compras/faturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Fatura registada");
        setDialogCriar(false);
        carregarDados();
      }
    } finally {
      setSaving(false);
    }
  };

  const registarPagamento = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/compras/faturas/${selecionada.id}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pagamentoForm),
      });
      if (res.ok) {
        toast.success("Pagamento registado");
        setDialogPagamento(false);
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
          <h1 className="text-3xl font-bold">Faturas de Fornecedor</h1>
          <p className="text-muted-foreground">Registo de faturas de compra e despesas</p>
        </div>
        <Button onClick={() => setDialogCriar(true)}><Plus className="h-4 w-4 mr-2" /> Registar Fatura</Button>
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
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faturas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.numero}</TableCell>
                    <TableCell>{f.fornecedorNome}</TableCell>
                    <TableCell>{new Date(f.dataEmissao).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={estadosPagamentoConfig[f.estadoPagamento]?.color}>
                        {estadosPagamentoConfig[f.estadoPagamento]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatarMoeda(f.totalLiquido)}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{formatarMoeda(f.valorPago)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setSelecionada(f); setPagamentoForm({ ...pagamentoForm, valor: f.totalLiquido - f.valorPago }); setDialogPagamento(true); }} disabled={f.estadoPagamento === "PAGO"}>
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar */}
      <Dialog open={dialogCriar} onOpenChange={setDialogCriar}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registar Fatura de Fornecedor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Número da Fatura</Label>
              <Input placeholder="Ex: FT 2024/123" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select onValueChange={(v) => setForm({ ...form, fornecedorId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um fornecedor" /></SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taxa de IVA</Label>
              <Select defaultValue="23" onValueChange={(v) => {
                const taxa = parseFloat(v);
                const currentTotal = form.linhas[0].precoUnitario * (1 + form.linhas[0].taxaIVAPercentagem / 100);
                const newBase = currentTotal / (1 + taxa / 100);
                setForm({
                  ...form,
                  linhas: [{
                    ...form.linhas[0],
                    taxaIVAPercentagem: taxa,
                    taxaIVAId: taxa === 23 ? "iva-normal" : taxa === 13 ? "iva-intermedia" : "iva-reduzida",
                    precoUnitario: newBase
                  }]
                });
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="23">Normal (23%)</SelectItem>
                  <SelectItem value="13">Intermédia (13%)</SelectItem>
                  <SelectItem value="6">Reduzida (6%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Total (Líquido)</Label>
              <Input type="number" placeholder="0.00" onChange={(e) => {
                const total = parseFloat(e.target.value) || 0;
                const base = total / (1 + form.linhas[0].taxaIVAPercentagem / 100);
                setForm({ ...form, linhas: [{ ...form.linhas[0], precoUnitario: base }] });
              }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCriar(false)}>Cancelar</Button>
            <Button onClick={criarFatura} disabled={saving}>Registar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Pagamento */}
      <Dialog open={dialogPagamento} onOpenChange={setDialogPagamento}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registar Pagamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p>Registar pagamento para a fatura <strong>{selecionada?.numero}</strong></p>
            <div className="space-y-2">
              <Label>Valor a Pagar</Label>
              <Input type="number" value={pagamentoForm.valor} onChange={(e) => setPagamentoForm({ ...pagamentoForm, valor: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select value={pagamentoForm.metodo} onValueChange={(v) => setPagamentoForm({ ...pagamentoForm, metodo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRANSFERENCIA">Transferência Bancária</SelectItem>
                  <SelectItem value="NUMERARIO">Numerário</SelectItem>
                  <SelectItem value="CARTAO_DEBITO">Cartão Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPagamento(false)}>Cancelar</Button>
            <Button onClick={registarPagamento} disabled={saving}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
