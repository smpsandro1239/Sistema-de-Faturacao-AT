"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Plus, 
  Search, 
  Shield,
  ArrowLeft,
  Eye,
  Printer,
  CreditCard,
  Trash2,
  Download,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface LinhaDocumento {
  artigoId?: string;
  codigoArtigo: string;
  descricaoArtigo: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  taxaIVAId: string;
  taxaIVAPercentagem: number;
  base: number;
  valorIVA: number;
}

interface Documento {
  id: string;
  numeroFormatado: string;
  tipo: string;
  clienteNome: string;
  clienteNif: string;
  totalLiquido: number;
  estado: string;
  estadoPagamento: string;
  dataEmissao: string | null;
  createdAt: string;
}

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [artigos, setArtigos] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [taxasIVA, setTaxasIVA] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPagamento, setDialogPagamento] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [saving, setSaving] = useState(false);

  // Form novo documento
  const [formLinhas, setFormLinhas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clienteId: "",
    serieId: "",
    tipo: "FATURA",
    observacoes: "",
  });

  // Form pagamento
  const [pagamentoData, setPagamentoData] = useState({
    valor: 0,
    metodo: "TRANSFERENCIA",
    referencia: "",
    data: new Date().toISOString().split('T')[0]
  });

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [docRes, cliRes, artRes, serRes, taxRes] = await Promise.all([
        fetch("/api/documentos"),
        fetch("/api/clientes"),
        fetch("/api/artigos"),
        fetch("/api/series"),
        fetch("/api/taxas-iva")
      ]);

      if (docRes.ok) setDocumentos(await docRes.json());
      if (cliRes.ok) setClientes((await cliRes.json()).clientes || []);
      if (artRes.ok) setArtigos((await artRes.json()).artigos || []);
      if (serRes.ok) setSeries((await serRes.json()).series || []);

      // Fallback para taxas se API falhar
      try {
        if (taxRes.ok) setTaxasIVA(await taxRes.json());
        else throw new Error();
      } catch {
        setTaxasIVA([
          { id: "iva-normal", codigo: "NOR", taxa: 23 },
          { id: "iva-intermedia", codigo: "INT", taxa: 13 },
          { id: "iva-reduzida", codigo: "RED", taxa: 6 },
        ]);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleEmitir = async (id: string) => {
    try {
      const res = await fetch("/api/documentos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Documento emitido com sucesso");
        carregarDados();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao emitir");
      }
    } catch {
      toast.error("Erro de ligação");
    }
  };

  const handleSaveDocumento = async () => {
    if (!formData.clienteId || !formData.serieId || formLinhas.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          linhas: formLinhas
        }),
      });

      if (res.ok) {
        toast.success("Rascunho criado");
        setDialogOpen(false);
        carregarDados();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar");
      }
    } catch {
      toast.error("Erro de ligação");
    } finally {
      setSaving(false);
    }
  };

  const addLinha = () => {
    setFormLinhas([...formLinhas, {
      artigoId: "",
      codigoArtigo: "",
      descricaoArtigo: "",
      quantidade: 1,
      precoUnitario: 0,
      desconto: 0,
      taxaIVAPercentagem: 23,
      taxaIVAId: taxasIVA.find(t => t.codigo === "NOR")?.id || "",
      base: 0,
      valorIVA: 0
    }]);
  };

  const updateLinha = (index: number, field: string, value: any) => {
    const novas = [...formLinhas];
    novas[index][field] = value;

    if (field === "artigoId") {
      const art = artigos.find(a => a.id === value);
      if (art) {
        novas[index].codigoArtigo = art.codigo;
        novas[index].descricaoArtigo = art.descricao;
        novas[index].precoUnitario = art.precoUnitario;
        novas[index].taxaIVAPercentagem = art.taxaIVA?.taxa || 23;
        novas[index].taxaIVAId = art.taxaIVAId;
      }
    }

    const l = novas[index];
    l.base = l.quantidade * l.precoUnitario - l.desconto;
    l.valorIVA = l.base * (l.taxaIVAPercentagem / 100);

    setFormLinhas(novas);
  };

  const handleDownload = async (doc: Documento) => {
    try {
      toast.loading("A gerar PDF...");
      const res = await fetch(`/api/documentos/${doc.id}/download`);
      if (!res.ok) throw new Error("Erro ao descarregar");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.numeroFormatado.replace(/\//g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success("PDF descarregado com sucesso");
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao descarregar PDF");
    }
  };

  const handlePagamento = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documentos/${selectedDoc.id}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pagamentoData),
      });

      if (res.ok) {
        toast.success("Pagamento registado");
        setDialogPagamento(false);
        carregarDados();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao registar");
      }
    } catch {
      toast.error("Erro de ligação");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

  const filtered = documentos.filter(d =>
    d.numeroFormatado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.clienteNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documentos Fiscais</h1>
          <p className="text-muted-foreground">Emissão e gestão de faturas certificadas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Documento
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Pesquisar por número ou cliente..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.numeroFormatado}</TableCell>
                    <TableCell>{doc.clienteNome}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(doc.totalLiquido)}</TableCell>
                    <TableCell>
                      <Badge variant={doc.estado === "EMITIDO" ? "default" : "secondary"}>
                        {doc.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.estadoPagamento === "PAGO" ? "default" : "outline"} className={doc.estadoPagamento === "PAGO" ? "bg-green-100 text-green-700" : ""}>
                        {doc.estadoPagamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.dataEmissao ? new Date(doc.dataEmissao).toLocaleDateString("pt-PT") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/documentos/${doc.id}`}><Eye className="w-4 h-4 mr-2" /> Ver / Imprimir</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="w-4 h-4 mr-2" /> Descarregar PDF
                          </DropdownMenuItem>
                          {doc.estado === "RASCUNHO" && (
                            <DropdownMenuItem onClick={() => handleEmitir(doc.id)} className="text-emerald-600 font-bold">
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Emitir Documento
                            </DropdownMenuItem>
                          )}
                          {doc.estado === "EMITIDO" && doc.estadoPagamento !== "PAGO" && (
                            <DropdownMenuItem onClick={() => { setSelectedDoc(doc); setPagamentoData({...pagamentoData, valor: doc.totalLiquido}); setDialogPagamento(true); }}>
                              <CreditCard className="w-4 h-4 mr-2" /> Registar Pagamento
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {doc.estado === "RASCUNHO" && (
                             <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
                          )}
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

      {/* Dialog Novo Documento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Emitir Novo Documento</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Série*</Label>
                <Select value={formData.serieId} onValueChange={v => setFormData({...formData, serieId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione a série" /></SelectTrigger>
                  <SelectContent>
                    {series.map(s => <SelectItem key={s.id} value={s.id}>{s.descricao} ({s.prefixo})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cliente*</Label>
                <Select value={formData.clienteId} onValueChange={v => setFormData({...formData, clienteId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold">Linhas</Label>
                <Button variant="outline" size="sm" onClick={addLinha}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
              </div>
              {formLinhas.map((linha, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 border p-2 rounded items-center">
                  <div className="col-span-4">
                    <Select value={linha.artigoId} onValueChange={v => updateLinha(idx, "artigoId", v)}>
                      <SelectTrigger><SelectValue placeholder="Artigo" /></SelectTrigger>
                      <SelectContent>
                        {artigos.map(a => <SelectItem key={a.id} value={a.id}>{a.codigo} - {a.descricao}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" value={linha.quantidade} onChange={e => updateLinha(idx, "quantidade", parseFloat(e.target.value))} />
                  </div>
                  <div className="col-span-3">
                    <Input type="number" value={linha.precoUnitario} onChange={e => updateLinha(idx, "precoUnitario", parseFloat(e.target.value))} />
                  </div>
                  <div className="col-span-2 font-bold text-right">{formatCurrency(linha.base + linha.valorIVA)}</div>
                  <div className="col-span-1 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setFormLinhas(formLinhas.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDocumento} disabled={saving} className="bg-emerald-600">Guardar Rascunho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Pagamento */}
      <Dialog open={dialogPagamento} onOpenChange={setDialogPagamento}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registar Pagamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label>Valor (€)</Label>
                <Input type="number" value={pagamentoData.valor} onChange={e => setPagamentoData({...pagamentoData, valor: parseFloat(e.target.value)})} />
             </div>
             <div className="space-y-2">
                <Label>Método</Label>
                <Select value={pagamentoData.metodo} onValueChange={v => setPagamentoData({...pagamentoData, metodo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUMERARIO">Numerário</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferência Bancária</SelectItem>
                    <SelectItem value="CARTAO_DEBITO">Cartão Débito</SelectItem>
                    <SelectItem value="CARTAO_CREDITO">Cartão Crédito</SelectItem>
                    <SelectItem value="MBWAY">MB WAY</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Referência / Observações</Label>
                <Input value={pagamentoData.referencia} onChange={e => setPagamentoData({...pagamentoData, referencia: e.target.value})} placeholder="Nº transação..." />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPagamento(false)}>Cancelar</Button>
            <Button onClick={handlePagamento} disabled={saving} className="bg-emerald-600">Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
