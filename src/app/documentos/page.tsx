"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  QrCode,
  Hash
} from "lucide-react";
import Link from "next/link";

interface LinhaDocumento {
  id: string;
  codigoArtigo: string;
  descricaoArtigo: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  taxaIVAPercentagem: number;
  base: number;
  valorIVA: number;
}

interface Documento {
  id: string;
  numero: number;
  numeroFormatado: string;
  tipo: string;
  clienteNome: string;
  clienteNif: string;
  totalLiquido: number;
  totalIVA: number;
  totalBase: number;
  estado: string;
  dataEmissao: string | null;
  hash: string | null;
  atcud: string | null;
}

const documentosMock: Documento[] = [
  { id: "1", numero: 123, numeroFormatado: "F 2024/00123", tipo: "FATURA", clienteNome: "Empresa ABC Lda", clienteNif: "509123456", totalLiquido: 1518.44, totalIVA: 283.94, totalBase: 1234.50, estado: "EMITIDO", dataEmissao: "2024-01-15", hash: "ABC123DEF456...", atcud: "ABC123-123" },
  { id: "2", numero: 122, numeroFormatado: "F 2024/00122", tipo: "FATURA", clienteNome: "Comercial XYZ SA", clienteNif: "508765432", totalLiquido: 4250.88, totalIVA: 795.12, totalBase: 3456.00, estado: "EMITIDO", dataEmissao: "2024-01-15", hash: "DEF456GHI789...", atcud: "ABC123-122" },
  { id: "3", numero: 15, numeroFormatado: "NC 2024/00015", tipo: "NOTA_CREDITO", clienteNome: "Empresa ABC Lda", clienteNif: "509123456", totalLiquido: -151.84, totalIVA: -28.39, totalBase: -123.45, estado: "EMITIDO", dataEmissao: "2024-01-14", hash: "GHI789JKL012...", atcud: "GHI789-15" },
  { id: "4", numero: 121, numeroFormatado: "F 2024/00121", tipo: "FATURA", clienteNome: "Serviços Premium", clienteNif: "507654321", totalLiquido: 1094.70, totalIVA: 204.70, totalBase: 890.00, estado: "RASCUNHO", dataEmissao: null, hash: null, atcud: null },
  { id: "5", numero: 120, numeroFormatado: "F 2024/00120", tipo: "FATURA", clienteNome: "Negócios Globais", clienteNif: "506543210", totalLiquido: 6984.95, totalIVA: 1306.05, totalBase: 5678.90, estado: "EMITIDO", dataEmissao: "2024-01-13", hash: "JKL012MNO345...", atcud: "ABC123-120" },
];

const clientesMock = [
  { id: "1", nome: "Empresa ABC Lda", nif: "509123456" },
  { id: "2", nome: "Comercial XYZ SA", nif: "508765432" },
  { id: "3", nome: "Serviços Premium", nif: "507654321" },
  { id: "4", nome: "Negócios Globais", nif: "506543210" },
];

const artigosMock = [
  { id: "1", codigo: "A001", descricao: "Consultoria Técnica", precoUnitario: 75.00, taxaIVA: 23 },
  { id: "2", codigo: "A002", descricao: "Desenvolvimento de Software", precoUnitario: 85.00, taxaIVA: 23 },
  { id: "3", codigo: "A003", descricao: "Licença de Software", precoUnitario: 299.00, taxaIVA: 23 },
  { id: "4", codigo: "A004", descricao: "Formação Profissional", precoUnitario: 50.00, taxaIVA: 6 },
];

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>(documentosMock);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);
  const [linhas, setLinhas] = useState<LinhaDocumento[]>([]);
  const [formData, setFormData] = useState({
    clienteId: "",
    tipoDocumento: "FATURA",
    observacoes: "",
  });

  const filteredDocumentos = documentos.filter(
    doc =>
      doc.numeroFormatado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.clienteNif.includes(searchTerm)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleNewDocumento = () => {
    setLinhas([]);
    setFormData({
      clienteId: "",
      tipoDocumento: "FATURA",
      observacoes: "",
    });
    setDialogOpen(true);
  };

  const handleViewDocumento = (doc: Documento) => {
    setSelectedDocumento(doc);
    setViewDialogOpen(true);
  };

  const handleEmitirDocumento = (id: string) => {
    const doc = documentos.find(d => d.id === id);
    if (doc?.estado === "RASCUNHO") {
      // Simular emissão com hash e ATCUD
      const hash = `HASH${Date.now().toString(36).toUpperCase()}...`;
      const atcud = `ATCUD-${doc.numero}`;
      
      setDocumentos(documentos.map(d => 
        d.id === id 
          ? { 
              ...d, 
              estado: "EMITIDO", 
              dataEmissao: new Date().toISOString().split('T')[0],
              hash,
              atcud
            }
          : d
      ));
    }
  };

  const handleDeleteDocumento = (id: string) => {
    const doc = documentos.find(d => d.id === id);
    if (doc?.estado === "RASCUNHO") {
      setDocumentos(documentos.filter(d => d.id !== id));
    }
  };

  const addLinha = () => {
    const newLinha: LinhaDocumento = {
      id: String(linhas.length + 1),
      codigoArtigo: "",
      descricaoArtigo: "",
      quantidade: 1,
      precoUnitario: 0,
      desconto: 0,
      taxaIVAPercentagem: 23,
      base: 0,
      valorIVA: 0,
    };
    setLinhas([...linhas, newLinha]);
  };

  const updateLinha = (id: string, field: string, value: string | number) => {
    setLinhas(linhas.map(linha => {
      if (linha.id === id) {
        const updated = { ...linha, [field]: value };
        
        // Se selecionou um artigo, preencher dados
        if (field === "codigoArtigo") {
          const artigo = artigosMock.find(a => a.codigo === value);
          if (artigo) {
            updated.descricaoArtigo = artigo.descricao;
            updated.precoUnitario = artigo.precoUnitario;
            updated.taxaIVAPercentagem = artigo.taxaIVA;
          }
        }
        
        // Recalcular totais
        updated.base = updated.quantidade * updated.precoUnitario - updated.desconto;
        updated.valorIVA = updated.base * (updated.taxaIVAPercentagem / 100);
        
        return updated;
      }
      return linha;
    }));
  };

  const removeLinha = (id: string) => {
    setLinhas(linhas.filter(l => l.id !== id));
  };

  const calcularTotais = () => {
    const totalBase = linhas.reduce((sum, l) => sum + l.base, 0);
    const totalIVA = linhas.reduce((sum, l) => sum + l.valorIVA, 0);
    const totalLiquido = totalBase + totalIVA;
    return { totalBase, totalIVA, totalLiquido };
  };

  const handleSaveDocumento = () => {
    const totais = calcularTotais();
    const cliente = clientesMock.find(c => c.id === formData.clienteId);
    
    if (!cliente || linhas.length === 0) {
      alert("Selecione um cliente e adicione pelo menos uma linha.");
      return;
    }

    const newDocumento: Documento = {
      id: String(documentos.length + 1),
      numero: documentos.length + 100,
      numeroFormatado: `F 2024/${String(documentos.length + 100).padStart(5, "0")}`,
      tipo: formData.tipoDocumento,
      clienteNome: cliente.nome,
      clienteNif: cliente.nif,
      totalLiquido: totais.totalLiquido,
      totalIVA: totais.totalIVA,
      totalBase: totais.totalBase,
      estado: "RASCUNHO",
      dataEmissao: null,
      hash: null,
      atcud: null,
    };

    setDocumentos([newDocumento, ...documentos]);
    setDialogOpen(false);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "EMITIDO":
        return <Badge className="bg-green-100 text-green-700">Emitido</Badge>;
      case "RASCUNHO":
        return <Badge className="bg-yellow-100 text-yellow-700">Rascunho</Badge>;
      case "ANULADO":
        return <Badge className="bg-red-100 text-red-700">Anulado</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">FaturaAT</h1>
                <p className="text-xs text-slate-500">Sistema Certificado AT</p>
              </div>
            </Link>
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Certificado</span>
            </div>
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
            <Link href="/documentos" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
              <FileText className="h-4 w-4" />
              Documentos
            </Link>
            <Link href="/clientes" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Clientes
            </Link>
            <Link href="/artigos" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Artigos
            </Link>
            <Link href="/series" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Séries
            </Link>
            <Link href="/saf-t" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              SAF-T
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Documentos Fiscais</h2>
            <p className="text-slate-500">Emitir e gerir documentos fiscais certificados</p>
          </div>
          <Button onClick={handleNewDocumento} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Documento
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Pesquisar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredDocumentos.length} documentos
          </Badge>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocumentos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.numeroFormatado}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {doc.tipo === "FATURA" ? "Fatura" : doc.tipo === "NOTA_CREDITO" ? "Nota de Crédito" : doc.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.clienteNome}</p>
                        <p className="text-sm text-slate-500">{doc.clienteNif}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-medium">{formatCurrency(doc.totalLiquido)}</TableCell>
                    <TableCell>{getEstadoBadge(doc.estado)}</TableCell>
                    <TableCell className="text-sm text-slate-500">{doc.dataEmissao || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDocumento(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {doc.estado === "RASCUNHO" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEmitirDocumento(doc.id)} className="text-green-600">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteDocumento(doc.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {doc.estado === "EMITIDO" && (
                          <Button variant="ghost" size="icon">
                            <Printer className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* New Document Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Documento</DialogTitle>
              <DialogDescription>
                Criar um novo documento fiscal
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Tipo e Cliente */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Documento</Label>
                  <Select value={formData.tipoDocumento} onValueChange={(value) => setFormData({ ...formData, tipoDocumento: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FATURA">Fatura</SelectItem>
                      <SelectItem value="FATURA_RECIBO">Fatura-Recibo</SelectItem>
                      <SelectItem value="NOTA_CREDITO">Nota de Crédito</SelectItem>
                      <SelectItem value="NOTA_DEBITO">Nota de Débito</SelectItem>
                      <SelectItem value="ORCAMENTO">Orçamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cliente*</Label>
                  <Select value={formData.clienteId} onValueChange={(value) => setFormData({ ...formData, clienteId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientesMock.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome} - {cliente.nif}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Linhas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Linhas do Documento</Label>
                  <Button variant="outline" size="sm" onClick={addLinha}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Linha
                  </Button>
                </div>
                
                {linhas.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="w-[120px]">Artigo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="w-[80px]">Qtd</TableHead>
                          <TableHead className="w-[100px]">Preço</TableHead>
                          <TableHead className="w-[80px]">IVA %</TableHead>
                          <TableHead className="w-[100px]">Base</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linhas.map((linha) => (
                          <TableRow key={linha.id}>
                            <TableCell>
                              <Select value={linha.codigoArtigo} onValueChange={(value) => updateLinha(linha.id, "codigoArtigo", value)}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Artigo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {artigosMock.map((artigo) => (
                                    <SelectItem key={artigo.id} value={artigo.codigo}>
                                      {artigo.codigo}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input 
                                value={linha.descricaoArtigo} 
                                onChange={(e) => updateLinha(linha.id, "descricaoArtigo", e.target.value)}
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={linha.quantidade} 
                                onChange={(e) => updateLinha(linha.id, "quantidade", parseFloat(e.target.value) || 0)}
                                className="h-8 w-16"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                step="0.01"
                                value={linha.precoUnitario} 
                                onChange={(e) => updateLinha(linha.id, "precoUnitario", parseFloat(e.target.value) || 0)}
                                className="h-8 w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">{linha.taxaIVAPercentagem}%</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono">{formatCurrency(linha.base)}</span>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeLinha(linha.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-slate-500">
                    Clique em "Adicionar Linha" para começar
                  </div>
                )}
              </div>

              {/* Totais */}
              {linhas.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <p className="text-sm text-slate-500">Base Tributável</p>
                      <p className="font-mono font-medium">{formatCurrency(calcularTotais().totalBase)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total IVA</p>
                      <p className="font-mono font-medium">{formatCurrency(calcularTotais().totalIVA)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Líquido</p>
                      <p className="font-mono font-bold text-lg">{formatCurrency(calcularTotais().totalLiquido)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Observações */}
              <div>
                <Label>Observações</Label>
                <Textarea 
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveDocumento} className="bg-emerald-600 hover:bg-emerald-700">
                Guardar Rascunho
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Documento</DialogTitle>
            </DialogHeader>
            
            {selectedDocumento && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Nº Documento</p>
                    <p className="font-bold text-lg">{selectedDocumento.numeroFormatado}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Estado</p>
                    {getEstadoBadge(selectedDocumento.estado)}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-slate-500 mb-1">Cliente</p>
                  <p className="font-medium">{selectedDocumento.clienteNome}</p>
                  <p className="text-sm text-slate-500">NIF: {selectedDocumento.clienteNif}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Base</p>
                    <p className="font-mono">{formatCurrency(selectedDocumento.totalBase)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">IVA</p>
                    <p className="font-mono">{formatCurrency(selectedDocumento.totalIVA)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="font-mono font-bold">{formatCurrency(selectedDocumento.totalLiquido)}</p>
                  </div>
                </div>

                {selectedDocumento.hash && (
                  <>
                    <Separator />
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        <p className="font-medium text-emerald-700">Documento Certificado</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-500">Hash:</span>
                          <span className="font-mono text-xs">{selectedDocumento.hash}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-500">ATCUD:</span>
                          <span className="font-mono">{selectedDocumento.atcud}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
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
