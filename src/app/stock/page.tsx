"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Package, 
  Plus, 
  Search, 
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Movimento {
  id: string;
  artigoId: string;
  armazemId: string;
  tipo: "ENTRADA" | "SAIDA" | "TRANSFERENCIA";
  origem: string;
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeFinal: number;
  precoUnitario: number | null;
  valorTotal: number | null;
  observacoes: string | null;
  createdAt: string;
  artigo: { codigo: string; descricao: string };
  armazem: { codigo: string; nome: string };
  armazemDestino: { codigo: string; nome: string } | null;
  utilizador: { nome: string };
}

interface Artigo {
  id: string;
  codigo: string;
  descricao: string;
  stockTotal: number;
}

interface Armazem {
  id: string;
  codigo: string;
  nome: string;
  principal: boolean;
}

export default function StockMovimentosPage() {
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState({
    artigoId: "",
    armazemId: "",
    armazemDestinoId: "",
    tipo: "ENTRADA",
    quantidade: "",
    observacoes: "",
  });

  useEffect(() => {
    fetchMovimentos();
    fetchArtigos();
    fetchArmazens();
  }, [filtroTipo, pagination.page]);

  const fetchMovimentos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (filtroTipo !== "todos") params.append("tipo", filtroTipo);

      const response = await fetch(`/api/stock/movimentos?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMovimentos(data.movimentos);
        setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
      }
    } catch (error) {
      console.error("Erro ao carregar movimentos:", error);
      toast.error("Erro ao carregar movimentos");
    } finally {
      setLoading(false);
    }
  };

  const fetchArtigos = async () => {
    try {
      const response = await fetch("/api/stock");
      const data = await response.json();
      if (response.ok) {
        setArtigos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar artigos:", error);
    }
  };

  const fetchArmazens = async () => {
    try {
      const response = await fetch("/api/armazens");
      const data = await response.json();
      if (response.ok) {
        setArmazens(data);
      }
    } catch (error) {
      console.error("Erro ao carregar armazéns:", error);
    }
  };

  const handleNovoMovimento = async () => {
    try {
      if (!formData.artigoId || !formData.armazemId || !formData.quantidade) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      if (formData.tipo === "TRANSFERENCIA") {
        if (!formData.armazemDestinoId) {
          toast.error("Selecione o armazém de destino");
          return;
        }
        if (formData.armazemId === formData.armazemDestinoId) {
          toast.error("O armazém de destino deve ser diferente do de origem");
          return;
        }
      }

      // Utilizador mockado (em produção, obter da sessão)
      const utilizadorId = "utilizador-admin";

      const response = await fetch("/api/stock/movimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantidade: parseFloat(formData.quantidade),
          origem: "AJUSTE_MANUAL",
          utilizadorId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Movimento registado com sucesso!");
        setDialogOpen(false);
        setFormData({ artigoId: "", armazemId: "", armazemDestinoId: "", tipo: "ENTRADA", quantidade: "", observacoes: "" });
        fetchMovimentos();
      } else {
        toast.error(data.error || "Erro ao registar movimento");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao registar movimento");
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "ENTRADA":
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case "SAIDA":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case "TRANSFERENCIA":
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const cores: Record<string, string> = {
      ENTRADA: "bg-green-100 text-green-700",
      SAIDA: "bg-red-100 text-red-700",
      TRANSFERENCIA: "bg-blue-100 text-blue-700",
    };
    const labels: Record<string, string> = {
      ENTRADA: "Entrada",
      SAIDA: "Saída",
      TRANSFERENCIA: "Transferência",
    };
    return (
      <Badge className={cores[tipo] || ""}>
        {getTipoIcon(tipo)}
        <span className="ml-1">{labels[tipo]}</span>
      </Badge>
    );
  };

  const getOrigemLabel = (origem: string) => {
    const labels: Record<string, string> = {
      FATURA: "Fatura",
      NOTA_CREDITO: "Nota de Crédito",
      ENCOMENDA_COMPRA: "Encomenda de Compra",
      AJUSTE_MANUAL: "Ajuste Manual",
      TRANSFERENCIA: "Transferência",
      INVENTARIO: "Inventário",
    };
    return labels[origem] || origem;
  };

  const filteredMovimentos = movimentos.filter(m => 
    m.artigo.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.artigo.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">FaturaAT</h1>
                <p className="text-xs text-slate-500">Sistema Certificado AT</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/armazens" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Armazéns
            </Link>
            <Link href="/stock" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-100 text-cyan-700 font-medium">
              <Package className="h-4 w-4" />
              Movimentos de Stock
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Movimentos de Stock</h2>
            <p className="text-slate-500">Histórico e gestão de movimentos de inventário</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Movimento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Novo Movimento de Stock</DialogTitle>
                <DialogDescription>
                  Registar movimento manual de stock
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de Movimento</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRADA">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Entrada
                        </div>
                      </SelectItem>
                      <SelectItem value="SAIDA">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          Saída
                        </div>
                      </SelectItem>
                      <SelectItem value="TRANSFERENCIA">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                          Transferência
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Artigo</Label>
                  <Select value={formData.artigoId} onValueChange={(v) => setFormData({ ...formData, artigoId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar artigo" />
                    </SelectTrigger>
                    <SelectContent>
                      {artigos.map((artigo) => (
                        <SelectItem key={artigo.id} value={artigo.id}>
                          {artigo.codigo} - {artigo.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{formData.tipo === "TRANSFERENCIA" ? "Armazém de Origem" : "Armazém"}</Label>
                  <Select value={formData.armazemId} onValueChange={(v) => setFormData({ ...formData, armazemId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar armazém" />
                    </SelectTrigger>
                    <SelectContent>
                      {armazens.map((armazem) => (
                        <SelectItem key={armazem.id} value={armazem.id}>
                          {armazem.codigo} - {armazem.nome}
                          {armazem.principal && " (Principal)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo === "TRANSFERENCIA" && (
                  <div className="space-y-2">
                    <Label>Armazém de Destino</Label>
                    <Select value={formData.armazemDestinoId} onValueChange={(v) => setFormData({ ...formData, armazemDestinoId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar armazém de destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {armazens.map((armazem) => (
                          <SelectItem key={armazem.id} value={armazem.id} disabled={armazem.id === formData.armazemId}>
                            {armazem.codigo} - {armazem.nome}
                            {armazem.principal && " (Principal)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Motivo do ajuste"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleNovoMovimento} className="bg-cyan-600 hover:bg-cyan-700">
                  Registar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Pesquisar movimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="ENTRADA">Entradas</SelectItem>
              <SelectItem value="SAIDA">Saídas</SelectItem>
              <SelectItem value="TRANSFERENCIA">Transferências</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="text-sm">
            {pagination.total} movimentos
          </Badge>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Artigo</TableHead>
                  <TableHead>Armazém</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Utilizador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      A carregar...
                    </TableCell>
                  </TableRow>
                ) : filteredMovimentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Nenhum movimento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovimentos.map((movimento) => (
                    <TableRow key={movimento.id}>
                      <TableCell className="text-sm">
                        {new Date(movimento.createdAt).toLocaleDateString("pt-PT")}{" "}
                        <span className="text-slate-400">
                          {new Date(movimento.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </TableCell>
                      <TableCell>{getTipoBadge(movimento.tipo)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{movimento.artigo.codigo}</p>
                          <p className="text-sm text-slate-500">{movimento.artigo.descricao}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{movimento.armazem.codigo}</p>
                          <p className="text-sm text-slate-500">{movimento.armazem.nome}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-medium ${
                            movimento.tipo === "ENTRADA" ? "text-green-600" : 
                            movimento.tipo === "SAIDA" ? "text-red-600" : "text-blue-600"
                          }`}>
                            {movimento.tipo === "SAIDA" ? "-" : "+"}{movimento.quantidade}
                          </span>
                          <span className="text-sm text-slate-400">
                            ({movimento.quantidadeAnterior} → {movimento.quantidadeFinal})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getOrigemLabel(movimento.origem)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{movimento.utilizador.nome}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Anterior
            </Button>
            <span className="text-sm text-slate-600">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Próxima
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-slate-500 text-center">
            © 2024 FaturaAT - Sistema de Faturação Certificado pela AT
          </p>
        </div>
      </footer>
    </div>
  );
}
