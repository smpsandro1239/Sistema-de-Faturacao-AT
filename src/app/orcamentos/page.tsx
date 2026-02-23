"use client";

/**
 * Página de Gestão de Orçamentos / Propostas
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
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";

// Interfaces
interface Cliente {
  id: string;
  codigo: string;
  nome: string;
  nif: string;
  email?: string;
}

interface Artigo {
  id: string;
  codigo: string;
  descricao: string;
  precoUnitario: number;
  unidade: string;
  taxaIVA: { id: string; taxa: number };
}

interface LinhaOrcamento {
  id?: string;
  artigoId?: string;
  codigoArtigo: string;
  descricaoArtigo: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  taxaIVAPercentagem: number;
  base: number;
  valorIVA: number;
}

interface Orcamento {
  id: string;
  numero: number;
  numeroFormatado: string;
  clienteId: string;
  clienteNome: string;
  clienteNif: string;
  dataOrcamento: string;
  dataValidade?: string;
  totalBase: number;
  totalIVA: number;
  totalLiquido: number;
  estado: string;
  documentoConvertidoId?: string;
  linhas: (LinhaOrcamento & { artigo?: Artigo })[];
}

interface Serie {
  id: string;
  codigo: string;
  descricao: string;
  prefixo: string;
  tipoDocumento: string;
}

const estadosConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RASCUNHO: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: <FileText className="h-3 w-3" /> },
  ENVIADO: { label: "Enviado", color: "bg-blue-100 text-blue-800", icon: <Send className="h-3 w-3" /> },
  ACEITE: { label: "Aceite", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  REJEITADO: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
  EXPIRADO: { label: "Expirado", color: "bg-orange-100 text-orange-800", icon: <Clock className="h-3 w-3" /> },
  CONVERTIDO: { label: "Convertido", color: "bg-emerald-100 text-emerald-800", icon: <RefreshCw className="h-3 w-3" /> },
};

export default function PaginaOrcamentos() {
  const router = useRouter();

  // Estados
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Dialogs
  const [dialogCriar, setDialogCriar] = useState(false);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [dialogConverter, setDialogConverter] = useState(false);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);
  const [saving, setSaving] = useState(false);

  // Formulário novo orçamento
  const [formClienteId, setFormClienteId] = useState("");
  const [formDataValidade, setFormDataValidade] = useState("");
  const [formObservacoes, setFormObservacoes] = useState("");
  const [formTermos, setFormTermos] = useState("");
  const [formLinhas, setFormLinhas] = useState<LinhaOrcamento[]>([]);

  // Formulário conversão
  const [conversaoSerieId, setConversaoSerieId] = useState("");

  // Carregar dados
  const carregarOrcamentos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filtroEstado) params.append("estado", filtroEstado);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/orcamentos?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setOrcamentos(data.orcamentos || []);
        setPagination(prev => ({ ...prev, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 0 }));
      }
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
      toast.error("Erro ao carregar orçamentos");
    } finally {
      setLoading(false);
    }
  }, [search, filtroEstado, pagination.page, pagination.limit]);

  const carregarClientes = async () => {
    try {
      const response = await fetch("/api/clientes?limit=100");
      const data = await response.json();
      if (response.ok) {
        setClientes(data.clientes || []);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
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

  const carregarSeries = async () => {
    try {
      const response = await fetch("/api/series?limit=100");
      const data = await response.json();
      if (response.ok) {
        setSeries(data.series?.filter((s: Serie) => 
          s.tipoDocumento === "FATURA" || s.tipoDocumento === "FATURA_RECIBO"
        ) || []);
      }
    } catch (error) {
      console.error("Erro ao carregar séries:", error);
    }
  };

  useEffect(() => {
    carregarOrcamentos();
  }, [carregarOrcamentos]);

  useEffect(() => {
    carregarClientes();
    carregarArtigos();
    carregarSeries();
  }, []);

  // Funções de manipulação
  const adicionarLinha = () => {
    const novaLinha: LinhaOrcamento = {
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

  const criarOrcamento = async () => {
    if (!formClienteId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (formLinhas.length === 0) {
      toast.error("Adicione pelo menos uma linha");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: formClienteId,
          dataValidade: formDataValidade || null,
          observacoes: formObservacoes,
          termosCondicoes: formTermos,
          linhas: formLinhas,
          utilizadorId: "system",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Orçamento criado com sucesso");
        setDialogCriar(false);
        limparFormulario();
        carregarOrcamentos();
      } else {
        toast.error(data.error || "Erro ao criar orçamento");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao criar orçamento");
    } finally {
      setSaving(false);
    }
  };

  const limparFormulario = () => {
    setFormClienteId("");
    setFormDataValidade("");
    setFormObservacoes("");
    setFormTermos("");
    setFormLinhas([]);
  };

  const verDetalhes = async (orcamento: Orcamento) => {
    try {
      const response = await fetch(`/api/orcamentos/${orcamento.id}`);
      const data = await response.json();
      if (response.ok) {
        setOrcamentoSelecionado(data);
        setDialogDetalhes(true);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      toast.error("Erro ao carregar detalhes");
    }
  };

  const abrirConversao = (orcamento: Orcamento) => {
    setOrcamentoSelecionado(orcamento);
    setConversaoSerieId(series[0]?.id || "");
    setDialogConverter(true);
  };

  const converterParaFatura = async () => {
    if (!orcamentoSelecionado) return;

    if (!conversaoSerieId) {
      toast.error("Selecione uma série para a fatura");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/orcamentos/${orcamentoSelecionado.id}/converter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serieId: conversaoSerieId,
          utilizadorId: "system",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Orçamento convertido para fatura ${data.documento.numeroFormatado}`);
        setDialogConverter(false);
        setOrcamentoSelecionado(null);
        carregarOrcamentos();
      } else {
        toast.error(data.error || "Erro ao converter orçamento");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao converter orçamento");
    } finally {
      setSaving(false);
    }
  };

  const alterarEstado = async (orcamento: Orcamento, novoEstado: string) => {
    try {
      const response = await fetch(`/api/orcamentos/${orcamento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: novoEstado, utilizadorId: "system" }),
      });

      if (response.ok) {
        toast.success("Estado atualizado");
        carregarOrcamentos();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao atualizar estado");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar estado");
    }
  };

  const eliminarOrcamento = async (orcamento: Orcamento) => {
    if (!confirm(`Tem a certeza que deseja eliminar o orçamento ${orcamento.numeroFormatado}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/orcamentos/${orcamento.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Orçamento eliminado");
        carregarOrcamentos();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao eliminar orçamento");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao eliminar orçamento");
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
          <h1 className="text-2xl font-bold">Orçamentos / Propostas</h1>
          <p className="text-muted-foreground">
            Gestão de propostas comerciais
          </p>
        </div>
        <Button onClick={() => setDialogCriar(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por número ou cliente..."
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
          ) : orcamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <p>Nenhum orçamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamentos.map((orcamento) => {
                    const estado = estadosConfig[orcamento.estado] || estadosConfig.RASCUNHO;
                    const expirado = orcamento.dataValidade && new Date(orcamento.dataValidade) < new Date();
                    
                    return (
                      <TableRow key={orcamento.id}>
                        <TableCell className="font-medium">
                          {orcamento.numeroFormatado}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{orcamento.clienteNome}</div>
                            <div className="text-sm text-muted-foreground">
                              NIF: {orcamento.clienteNif}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatarData(orcamento.dataOrcamento)}</TableCell>
                        <TableCell>
                          {orcamento.dataValidade ? (
                            <div className={expirado ? "text-orange-600" : ""}>
                              {formatarData(orcamento.dataValidade)}
                              {expirado && <span className="text-xs ml-1">(expirado)</span>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={estado.color}>
                            {estado.icon}
                            <span className="ml-1">{estado.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatarMoeda(orcamento.totalLiquido)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => verDetalhes(orcamento)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              {orcamento.estado === "RASCUNHO" && (
                                <DropdownMenuItem onClick={() => alterarEstado(orcamento, "ENVIADO")}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Marcar como Enviado
                                </DropdownMenuItem>
                              )}
                              {orcamento.estado === "ENVIADO" && (
                                <>
                                  <DropdownMenuItem onClick={() => alterarEstado(orcamento, "ACEITE")}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marcar como Aceite
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => alterarEstado(orcamento, "REJEITADO")}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Marcar como Rejeitado
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(orcamento.estado === "RASCUNHO" || orcamento.estado === "ENVIADO" || orcamento.estado === "ACEITE") && (
                                <DropdownMenuItem onClick={() => abrirConversao(orcamento)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Converter para Fatura
                                </DropdownMenuItem>
                              )}
                              {orcamento.estado !== "CONVERTIDO" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => eliminarOrcamento(orcamento)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
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

      {/* Dialog Novo Orçamento */}
      <Dialog open={dialogCriar} onOpenChange={setDialogCriar}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
            <DialogDescription>
              Crie uma nova proposta comercial
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Dados gerais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={formClienteId} onValueChange={setFormClienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} ({c.nif})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Validade</Label>
                <Input
                  type="date"
                  value={formDataValidade}
                  onChange={(e) => setFormDataValidade(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                placeholder="Observações visíveis no documento..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Termos e Condições</Label>
              <Textarea
                value={formTermos}
                onChange={(e) => setFormTermos(e.target.value)}
                placeholder="Termos e condições de pagamento, entrega, etc..."
                rows={2}
              />
            </div>

            {/* Linhas */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Linhas do Orçamento</Label>
                <Button type="button" variant="outline" size="sm" onClick={adicionarLinha}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Linha
                </Button>
              </div>

              {formLinhas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm">Adicione linhas ao orçamento</p>
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
            <Button onClick={criarOrcamento} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={dialogDetalhes} onOpenChange={setDialogDetalhes}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {orcamentoSelecionado?.numeroFormatado}
            </DialogTitle>
            <DialogDescription>
              Detalhes do orçamento
            </DialogDescription>
          </DialogHeader>

          {orcamentoSelecionado && (
            <div className="space-y-6">
              {/* Info geral */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{orcamentoSelecionado.clienteNome}</p>
                  <p className="text-sm">NIF: {orcamentoSelecionado.clienteNif}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge 
                    variant="outline" 
                    className={estadosConfig[orcamentoSelecionado.estado]?.color}
                  >
                    {estadosConfig[orcamentoSelecionado.estado]?.icon}
                    <span className="ml-1">{estadosConfig[orcamentoSelecionado.estado]?.label}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data do Orçamento</p>
                  <p className="font-medium">{formatarData(orcamentoSelecionado.dataOrcamento)}</p>
                </div>
                {orcamentoSelecionado.dataValidade && (
                  <div>
                    <p className="text-sm text-muted-foreground">Validade</p>
                    <p className="font-medium">{formatarData(orcamentoSelecionado.dataValidade)}</p>
                  </div>
                )}
              </div>

              {/* Linhas */}
              <div>
                <h4 className="font-semibold mb-3">Linhas do Orçamento</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orcamentoSelecionado.linhas.map((linha, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">{linha.codigoArtigo}</TableCell>
                          <TableCell>{linha.descricaoArtigo}</TableCell>
                          <TableCell className="text-center">{linha.quantidade}</TableCell>
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
                    <span>{formatarMoeda(orcamentoSelecionado.totalBase)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA:</span>
                    <span>{formatarMoeda(orcamentoSelecionado.totalIVA)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-1 border-t">
                    <span>Total:</span>
                    <span>{formatarMoeda(orcamentoSelecionado.totalLiquido)}</span>
                  </div>
                </div>
              </div>

              {orcamentoSelecionado.documentoConvertidoId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Este orçamento foi convertido em fatura.
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

      {/* Dialog Conversão */}
      <Dialog open={dialogConverter} onOpenChange={setDialogConverter}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Converter em Fatura</DialogTitle>
            <DialogDescription>
              {orcamentoSelecionado?.numeroFormatado} - {orcamentoSelecionado?.clienteNome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Série de Faturação</Label>
              <Select value={conversaoSerieId} onValueChange={setConversaoSerieId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a série" />
                </SelectTrigger>
                <SelectContent>
                  {series.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.descricao} ({s.prefixo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {series.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Não há séries de faturação configuradas. Crie uma série para faturas primeiro.
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Total do Orçamento:</p>
              <p className="text-2xl font-bold">{formatarMoeda(orcamentoSelecionado?.totalLiquido || 0)}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogConverter(false)}>
              Cancelar
            </Button>
            <Button onClick={converterParaFatura} disabled={saving || series.length === 0}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Converter para Fatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
