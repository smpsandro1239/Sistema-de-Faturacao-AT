"use client";

/**
 * Página de Gestão de Encomendas de Compra
 * Sistema de Faturação Certificado pela AT
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";

// Interfaces
interface Fornecedor {
  id: string;
  codigo: string;
  nome: string;
  nif: string;
}

interface Armazem {
  id: string;
  codigo: string;
  nome: string;
  principal: boolean;
}

interface Artigo {
  id: string;
  codigo: string;
  descricao: string;
  precoUnitario: number;
  unidade: string;
  taxaIVA: { id: string; taxa: number };
}

interface LinhaEncomenda {
  id?: string;
  artigoId?: string;
  codigoArtigo: string;
  descricaoArtigo: string;
  quantidade: number;
  quantidadeRecebida?: number;
  precoUnitario: number;
  desconto: number;
  taxaIVAPercentagem: number;
  base: number;
  valorIVA: number;
}

interface EncomendaCompra {
  id: string;
  numero: number;
  numeroFormatado: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorNif: string;
  dataEncomenda: string;
  dataEntregaPrevista?: string;
  dataRececao?: string;
  totalBase: number;
  totalIVA: number;
  totalLiquido: number;
  estado: string;
  observacoes?: string;
  armazemDestino?: Armazem;
  linhas: (LinhaEncomenda & { artigo?: Artigo })[];
}

const estadosConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RASCUNHO: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: <FileText className="h-3 w-3" /> },
  ENVIADA: { label: "Enviada", color: "bg-blue-100 text-blue-800", icon: <Truck className="h-3 w-3" /> },
  CONFIRMADA: { label: "Confirmada", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  PARCIALMENTE_RECEBIDA: { label: "Parcial", color: "bg-orange-100 text-orange-800", icon: <Package className="h-3 w-3" /> },
  RECEBIDA: { label: "Recebida", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

export default function PaginaEncomendasCompra() {
  const router = useRouter();
  
  // Estados
  const [encomendas, setEncomendas] = useState<EncomendaCompra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Dialogs
  const [dialogCriar, setDialogCriar] = useState(false);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [dialogRececao, setDialogRececao] = useState(false);
  const [encomendaSelecionada, setEncomendaSelecionada] = useState<EncomendaCompra | null>(null);
  const [saving, setSaving] = useState(false);

  // Formulário nova encomenda
  const [formFornecedorId, setFormFornecedorId] = useState("");
  const [formArmazemId, setFormArmazemId] = useState("");
  const [formDataEntrega, setFormDataEntrega] = useState("");
  const [formObservacoes, setFormObservacoes] = useState("");
  const [formLinhas, setFormLinhas] = useState<LinhaEncomenda[]>([]);

  // Formulário receção
  const [rececaoArmazemId, setRececaoArmazemId] = useState("");
  const [rececaoLinhas, setRececaoLinhas] = useState<{ linhaId: string; quantidade: number }[]>([]);

  // Carregar dados
  const carregarEncomendas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filtroEstado) params.append("estado", filtroEstado);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/compras/encomendas?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setEncomendas(data.encomendas);
        setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
      }
    } catch (error) {
      console.error("Erro ao carregar encomendas:", error);
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  }, [search, filtroEstado, pagination.page, pagination.limit]);

  const carregarFornecedores = async () => {
    try {
      const response = await fetch("/api/fornecedores?limit=100");
      const data = await response.json();
      if (response.ok) {
        setFornecedores(data.fornecedores || []);
      }
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  };

  const carregarArmazens = async () => {
    try {
      const response = await fetch("/api/armazens?limit=100");
      const data = await response.json();
      if (response.ok) {
        setArmazens(data.armazens || []);
        // Definir armazém principal como padrão
        const principal = data.armazens?.find((a: Armazem) => a.principal);
        if (principal) {
          setFormArmazemId(principal.id);
          setRececaoArmazemId(principal.id);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar armazéns:", error);
    }
  };

  const carregarArtigos = async () => {
    try {
      const response = await fetch("/api/artigos?limit=100");
      const data = await response.json();
      if (response.ok) {
        setArtigos(data.artigos || []);
      }
    } catch (error) {
      console.error("Erro ao carregar artigos:", error);
    }
  };

  useEffect(() => {
    carregarEncomendas();
  }, [carregarEncomendas]);

  useEffect(() => {
    carregarFornecedores();
    carregarArmazens();
    carregarArtigos();
  }, []);

  // Funções de manipulação
  const adicionarLinha = () => {
    const novaLinha: LinhaEncomenda = {
      codigoArtigo: "",
      descricaoArtigo: "",
      quantidade: 1,
      precoUnitario: 0,
      desconto: 0,
      taxaIVAPercentagem: 23,
      base: 0,
      valorIVA: 0,
    };
    setFormLinhas([...formLinhas, novaLinha]);
  };

  const removerLinha = (index: number) => {
    setFormLinhas(formLinhas.filter((_, i) => i !== index));
  };

  const atualizarLinha = (index: number, campo: string, valor: string | number) => {
    const novasLinhas = [...formLinhas];
    (novasLinhas[index] as Record<string, unknown>)[campo] = valor;

    // Se selecionou artigo, preencher dados
    if (campo === "artigoId") {
      const artigo = artigos.find(a => a.id === valor);
      if (artigo) {
        novasLinhas[index].codigoArtigo = artigo.codigo;
        novasLinhas[index].descricaoArtigo = artigo.descricao;
        novasLinhas[index].precoUnitario = artigo.precoUnitario;
        novasLinhas[index].taxaIVAPercentagem = artigo.taxaIVA.taxa;
      }
    }

    // Recalcular totais da linha
    const linha = novasLinhas[index];
    linha.base = linha.quantidade * linha.precoUnitario - linha.desconto;
    linha.valorIVA = linha.base * (linha.taxaIVAPercentagem / 100);

    setFormLinhas(novasLinhas);
  };

  const calcularTotais = () => {
    const totalBase = formLinhas.reduce((sum, l) => sum + l.base, 0);
    const totalIVA = formLinhas.reduce((sum, l) => sum + l.valorIVA, 0);
    return { totalBase, totalIVA, totalLiquido: totalBase + totalIVA };
  };

  const criarEncomenda = async () => {
    if (!formFornecedorId) {
      toast.error("Selecione um fornecedor");
      return;
    }

    if (formLinhas.length === 0) {
      toast.error("Adicione pelo menos uma linha");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/compras/encomendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornecedorId: formFornecedorId,
          armazemDestinoId: formArmazemId || null,
          dataEntregaPrevista: formDataEntrega || null,
          observacoes: formObservacoes,
          linhas: formLinhas,
          utilizadorId: "system",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Encomenda criada com sucesso");
        setDialogCriar(false);
        limparFormulario();
        carregarEncomendas();
      } else {
        toast.error(data.error || "Erro ao criar encomenda");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao criar encomenda");
    } finally {
      setSaving(false);
    }
  };

  const limparFormulario = () => {
    setFormFornecedorId("");
    setFormArmazemId(armazens.find(a => a.principal)?.id || "");
    setFormDataEntrega("");
    setFormObservacoes("");
    setFormLinhas([]);
  };

  const verDetalhes = async (encomenda: EncomendaCompra) => {
    try {
      const response = await fetch(`/api/compras/encomendas/${encomenda.id}`);
      const data = await response.json();
      if (response.ok) {
        setEncomendaSelecionada(data);
        setDialogDetalhes(true);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      toast.error("Erro ao carregar detalhes");
    }
  };

  const abrirRececao = async (encomenda: EncomendaCompra) => {
    try {
      const response = await fetch(`/api/compras/encomendas/${encomenda.id}`);
      const data = await response.json();
      if (response.ok) {
        setEncomendaSelecionada(data);
        // Inicializar linhas de receção com quantidades pendentes
        const linhasIniciais = data.linhas
          .filter((l: LinhaEncomenda) => l.quantidade > (l.quantidadeRecebida || 0))
          .map((l: LinhaEncomenda) => ({
            linhaId: l.id!,
            quantidade: l.quantidade - (l.quantidadeRecebida || 0),
          }));
        setRececaoLinhas(linhasIniciais);
        setRececaoArmazemId(data.armazemDestino?.id || armazens.find(a => a.principal)?.id || "");
        setDialogRececao(true);
      }
    } catch (error) {
      console.error("Erro ao carregar encomenda:", error);
      toast.error("Erro ao carregar encomenda");
    }
  };

  const receberEncomenda = async () => {
    if (!encomendaSelecionada || !rececaoArmazemId) {
      toast.error("Selecione o armazém de destino");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/compras/encomendas/${encomendaSelecionada.id}/rececao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          armazemId: rececaoArmazemId,
          linhasRececao: rececaoLinhas,
          utilizadorId: "system",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Receção registada com sucesso");
        setDialogRececao(false);
        setEncomendaSelecionada(null);
        carregarEncomendas();
      } else {
        toast.error(data.error || "Erro ao registar receção");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao registar receção");
    } finally {
      setSaving(false);
    }
  };

  const cancelarEncomenda = async (encomenda: EncomendaCompra) => {
    if (!confirm(`Tem a certeza que deseja cancelar a encomenda ${encomenda.numeroFormatado}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/compras/encomendas/${encomenda.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Encomenda cancelada");
        carregarEncomendas();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao cancelar encomenda");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao cancelar encomenda");
    }
  };

  const alterarEstado = async (encomenda: EncomendaCompra, novoEstado: string) => {
    try {
      const response = await fetch(`/api/compras/encomendas/${encomenda.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: novoEstado, utilizadorId: "system" }),
      });

      if (response.ok) {
        toast.success("Estado atualizado");
        carregarEncomendas();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao atualizar estado");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar estado");
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-PT");
  };

  const totais = calcularTotais();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Encomendas de Compra</h1>
          <p className="text-muted-foreground">
            Gestão de encomendas a fornecedores
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/compras/faturas">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Ver Faturas
            </Button>
          </Link>
          <Button onClick={() => setDialogCriar(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Encomenda
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por número ou fornecedor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os estados</SelectItem>
                {Object.entries(estadosConfig).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : encomendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Package className="h-12 w-12 mb-4" />
              <p>Nenhuma encomenda encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {encomendas.map((encomenda) => {
                    const estado = estadosConfig[encomenda.estado] || estadosConfig.RASCUNHO;
                    return (
                      <TableRow key={encomenda.id}>
                        <TableCell className="font-medium">
                          {encomenda.numeroFormatado}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{encomenda.fornecedorNome}</div>
                            <div className="text-sm text-muted-foreground">
                              NIF: {encomenda.fornecedorNif}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatarData(encomenda.dataEncomenda)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={estado.color}>
                            {estado.icon}
                            <span className="ml-1">{estado.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatarMoeda(encomenda.totalLiquido)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => verDetalhes(encomenda)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              {encomenda.estado === "RASCUNHO" && (
                                <DropdownMenuItem onClick={() => alterarEstado(encomenda, "ENVIADA")}>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Marcar como Enviada
                                </DropdownMenuItem>
                              )}
                              {encomenda.estado === "ENVIADA" && (
                                <DropdownMenuItem onClick={() => alterarEstado(encomenda, "CONFIRMADA")}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como Confirmada
                                </DropdownMenuItem>
                              )}
                              {(encomenda.estado === "CONFIRMADA" || 
                                encomenda.estado === "PARCIALMENTE_RECEBIDA") && (
                                <DropdownMenuItem onClick={() => abrirRececao(encomenda)}>
                                  <Package className="h-4 w-4 mr-2" />
                                  Registar Receção
                                </DropdownMenuItem>
                              )}
                              {(encomenda.estado === "RASCUNHO" || 
                                encomenda.estado === "ENVIADA" || 
                                encomenda.estado === "CONFIRMADA") && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => cancelarEncomenda(encomenda)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Encomenda */}
      <Dialog open={dialogCriar} onOpenChange={setDialogCriar}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Encomenda de Compra</DialogTitle>
            <DialogDescription>
              Crie uma nova encomenda para um fornecedor
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Dados gerais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fornecedor *</Label>
                <Select value={formFornecedorId} onValueChange={setFormFornecedorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome} ({f.nif})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Armazém de Destino</Label>
                <Select value={formArmazemId} onValueChange={setFormArmazemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um armazém" />
                  </SelectTrigger>
                  <SelectContent>
                    {armazens.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nome} {a.principal ? "(Principal)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Entrega Prevista</Label>
                <Input
                  type="date"
                  value={formDataEntrega}
                  onChange={(e) => setFormDataEntrega(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                placeholder="Observações para o fornecedor..."
                rows={2}
              />
            </div>

            {/* Linhas */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Linhas da Encomenda</Label>
                <Button type="button" variant="outline" size="sm" onClick={adicionarLinha}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Linha
                </Button>
              </div>

              {formLinhas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm">Adicione linhas à encomenda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formLinhas.map((linha, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                      <div className="col-span-3">
                        <Select
                          value={linha.artigoId || ""}
                          onValueChange={(v) => atualizarLinha(index, "artigoId", v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Artigo" />
                          </SelectTrigger>
                          <SelectContent>
                            {artigos.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.codigo} - {a.descricao.substring(0, 30)}...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Descrição"
                          value={linha.descricaoArtigo}
                          onChange={(e) => atualizarLinha(index, "descricaoArtigo", e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qtd"
                          value={linha.quantidade}
                          onChange={(e) => atualizarLinha(index, "quantidade", parseFloat(e.target.value) || 0)}
                          className="h-9"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Preço"
                          value={linha.precoUnitario}
                          onChange={(e) => atualizarLinha(index, "precoUnitario", parseFloat(e.target.value) || 0)}
                          className="h-9"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {formatarMoeda(linha.base + linha.valorIVA)}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-500"
                          onClick={() => removerLinha(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totais */}
              {formLinhas.length > 0 && (
                <div className="flex justify-end">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-1 min-w-[200px]">
                    <div className="flex justify-between text-sm">
                      <span>Base:</span>
                      <span>{formatarMoeda(totais.totalBase)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>IVA:</span>
                      <span>{formatarMoeda(totais.totalIVA)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-1 border-t">
                      <span>Total:</span>
                      <span>{formatarMoeda(totais.totalLiquido)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCriar(false)}>
              Cancelar
            </Button>
            <Button onClick={criarEncomenda} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Encomenda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={dialogDetalhes} onOpenChange={setDialogDetalhes}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {encomendaSelecionada?.numeroFormatado}
            </DialogTitle>
            <DialogDescription>
              Detalhes da encomenda de compra
            </DialogDescription>
          </DialogHeader>

          {encomendaSelecionada && (
            <div className="space-y-6">
              {/* Info geral */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{encomendaSelecionada.fornecedorNome}</p>
                  <p className="text-sm">NIF: {encomendaSelecionada.fornecedorNif}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge 
                    variant="outline" 
                    className={estadosConfig[encomendaSelecionada.estado]?.color}
                  >
                    {estadosConfig[encomendaSelecionada.estado]?.icon}
                    <span className="ml-1">{estadosConfig[encomendaSelecionada.estado]?.label}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data da Encomenda</p>
                  <p className="font-medium">{formatarData(encomendaSelecionada.dataEncomenda)}</p>
                </div>
                {encomendaSelecionada.dataEntregaPrevista && (
                  <div>
                    <p className="text-sm text-muted-foreground">Entrega Prevista</p>
                    <p className="font-medium">{formatarData(encomendaSelecionada.dataEntregaPrevista)}</p>
                  </div>
                )}
                {encomendaSelecionada.armazemDestino && (
                  <div>
                    <p className="text-sm text-muted-foreground">Armazém de Destino</p>
                    <p className="font-medium">{encomendaSelecionada.armazemDestino.nome}</p>
                  </div>
                )}
              </div>

              {/* Linhas */}
              <div>
                <h4 className="font-semibold mb-3">Linhas da Encomenda</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-center">Recebida</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {encomendaSelecionada.linhas.map((linha, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">{linha.codigoArtigo}</TableCell>
                          <TableCell>{linha.descricaoArtigo}</TableCell>
                          <TableCell className="text-center">{linha.quantidade}</TableCell>
                          <TableCell className="text-center">
                            {linha.quantidadeRecebida || 0}
                            {(linha.quantidadeRecebida || 0) < linha.quantidade && (
                              <span className="text-orange-500 ml-1">
                                ({(linha.quantidade - (linha.quantidadeRecebida || 0)).toFixed(2)} pend.)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{formatarMoeda(linha.precoUnitario)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatarMoeda(linha.base + linha.valorIVA)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totais */}
              <div className="flex justify-end">
                <div className="bg-muted/50 rounded-lg p-4 space-y-1 min-w-[200px]">
                  <div className="flex justify-between text-sm">
                    <span>Base:</span>
                    <span>{formatarMoeda(encomendaSelecionada.totalBase)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA:</span>
                    <span>{formatarMoeda(encomendaSelecionada.totalIVA)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-1 border-t">
                    <span>Total:</span>
                    <span>{formatarMoeda(encomendaSelecionada.totalLiquido)}</span>
                  </div>
                </div>
              </div>

              {encomendaSelecionada.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {encomendaSelecionada.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDetalhes(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Receção */}
      <Dialog open={dialogRececao} onOpenChange={setDialogRececao}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registar Receção</DialogTitle>
            <DialogDescription>
              {encomendaSelecionada?.numeroFormatado} - {encomendaSelecionada?.fornecedorNome}
            </DialogDescription>
          </DialogHeader>

          {encomendaSelecionada && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Armazém de Receção *</Label>
                <Select value={rececaoArmazemId} onValueChange={setRececaoArmazemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o armazém" />
                  </SelectTrigger>
                  <SelectContent>
                    {armazens.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nome} {a.principal ? "(Principal)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Quantidades a Receber
                </Label>
                <div className="space-y-2">
                  {encomendaSelecionada.linhas
                    .filter(l => l.quantidade > (l.quantidadeRecebida || 0))
                    .map((linha) => {
                      const rececaoLinha = rececaoLinhas.find(r => r.linhaId === linha.id);
                      const pendente = linha.quantidade - (linha.quantidadeRecebida || 0);
                      
                      return (
                        <div key={linha.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{linha.descricaoArtigo}</p>
                            <p className="text-sm text-muted-foreground">
                              Pendente: {pendente.toFixed(2)} | Já recebido: {(linha.quantidadeRecebida || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Qtd:</Label>
                            <Input
                              type="number"
                              className="w-24 h-9"
                              value={rececaoLinha?.quantidade || 0}
                              min="0"
                              max={pendente}
                              step="0.01"
                              onChange={(e) => {
                                const qtd = Math.min(parseFloat(e.target.value) || 0, pendente);
                                setRececaoLinhas(prev => 
                                  prev.map(r => 
                                    r.linhaId === linha.id ? { ...r, quantidade: qtd } : r
                                  )
                                );
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogRececao(false)}>
              Cancelar
            </Button>
            <Button onClick={receberEncomenda} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              Confirmar Receção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
