"use client";

import { useState } from "react";
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
  Settings, 
  Plus, 
  Search, 
  Edit,
  Shield,
  ArrowLeft,
  Lock,
  Hash,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface Serie {
  id: string;
  codigo: string;
  descricao: string;
  tipoDocumento: string;
  prefixo: string;
  numeroAtual: number;
  codigoValidacaoAT: string | null;
  ano: number;
  ativo: boolean;
  bloqueado: boolean;
}

const seriesMock: Serie[] = [
  { id: "1", codigo: "F2024", descricao: "Faturas 2024", tipoDocumento: "FATURA", prefixo: "F", numeroAtual: 123, codigoValidacaoAT: "ABC123", ano: 2024, ativo: true, bloqueado: false },
  { id: "2", codigo: "FR2024", descricao: "Faturas-Recibo 2024", tipoDocumento: "FATURA_RECIBO", prefixo: "FR", numeroAtual: 45, codigoValidacaoAT: "DEF456", ano: 2024, ativo: true, bloqueado: false },
  { id: "3", codigo: "NC2024", descricao: "Notas de Crédito 2024", tipoDocumento: "NOTA_CREDITO", prefixo: "NC", numeroAtual: 15, codigoValidacaoAT: "GHI789", ano: 2024, ativo: true, bloqueado: false },
  { id: "4", codigo: "ND2024", descricao: "Notas de Débito 2024", tipoDocumento: "NOTA_DEBITO", prefixo: "ND", numeroAtual: 5, codigoValidacaoAT: "JKL012", ano: 2024, ativo: true, bloqueado: false },
  { id: "5", codigo: "F2023", descricao: "Faturas 2023", tipoDocumento: "FATURA", prefixo: "F", numeroAtual: 500, codigoValidacaoAT: "MNO345", ano: 2023, ativo: false, bloqueado: true },
];

const tiposDocumento = [
  { valor: "FATURA", descricao: "Fatura" },
  { valor: "FATURA_RECIBO", descricao: "Fatura-Recibo" },
  { valor: "NOTA_CREDITO", descricao: "Nota de Crédito" },
  { valor: "NOTA_DEBITO", descricao: "Nota de Débito" },
  { valor: "RECIBO", descricao: "Recibo" },
  { valor: "ORCAMENTO", descricao: "Orçamento" },
  { valor: "FATURA_PROFORMA", descricao: "Fatura Pró-forma" },
];

export default function SeriesPage() {
  const [series, setSeries] = useState<Serie[]>(seriesMock);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSerie, setEditingSerie] = useState<Serie | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    tipoDocumento: "FATURA",
    prefixo: "",
    codigoValidacaoAT: "",
    ano: new Date().getFullYear(),
  });

  const filteredSeries = series.filter(
    serie =>
      serie.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serie.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewSerie = () => {
    setEditingSerie(null);
    setFormData({
      codigo: "",
      descricao: "",
      tipoDocumento: "FATURA",
      prefixo: "",
      codigoValidacaoAT: "",
      ano: new Date().getFullYear(),
    });
    setDialogOpen(true);
  };

  const handleEditSerie = (serie: Serie) => {
    if (serie.bloqueado) {
      alert("Esta série está bloqueada e não pode ser editada.");
      return;
    }
    setEditingSerie(serie);
    setFormData({
      codigo: serie.codigo,
      descricao: serie.descricao,
      tipoDocumento: serie.tipoDocumento,
      prefixo: serie.prefixo,
      codigoValidacaoAT: serie.codigoValidacaoAT || "",
      ano: serie.ano,
    });
    setDialogOpen(true);
  };

  const handleSaveSerie = async () => {
    if (editingSerie) {
      setSeries(series.map(s => 
        s.id === editingSerie.id 
          ? { ...s, ...formData }
          : s
      ));
    } else {
      const newSerie: Serie = {
        id: String(series.length + 1),
        codigo: formData.codigo,
        descricao: formData.descricao,
        tipoDocumento: formData.tipoDocumento,
        prefixo: formData.prefixo,
        numeroAtual: 0,
        codigoValidacaoAT: formData.codigoValidacaoAT || null,
        ano: formData.ano,
        ativo: true,
        bloqueado: false,
      };
      setSeries([...series, newSerie]);
    }
    setDialogOpen(false);
  };

  const toggleSerieStatus = (id: string) => {
    const serie = series.find(s => s.id === id);
    if (serie?.bloqueado) {
      alert("Esta série está bloqueada e não pode ser desativada.");
      return;
    }
    setSeries(series.map(s => 
      s.id === id ? { ...s, ativo: !s.ativo } : s
    ));
  };

  const getTipoDocumentoLabel = (tipo: string) => {
    const found = tiposDocumento.find(t => t.valor === tipo);
    return found ? found.descricao : tipo;
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
            <Link href="/documentos" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Documentos
            </Link>
            <Link href="/clientes" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Clientes
            </Link>
            <Link href="/artigos" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Artigos
            </Link>
            <Link href="/series" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
              <Settings className="h-4 w-4" />
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
            <h2 className="text-2xl font-bold text-slate-900">Gestão de Séries</h2>
            <p className="text-slate-500">Configurar séries de documentos fiscais</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewSerie} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Série
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingSerie ? "Editar Série" : "Nova Série"}</DialogTitle>
                <DialogDescription>
                  {editingSerie ? "Altere os dados da série abaixo." : "Preencha os dados da nova série."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="codigo" className="text-right">Código*</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="col-span-3"
                    placeholder="Ex: F2024"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descricao" className="text-right">Descrição*</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="col-span-3"
                    placeholder="Ex: Faturas 2024"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipo" className="text-right">Tipo Doc.</Label>
                  <Select value={formData.tipoDocumento} onValueChange={(value) => setFormData({ ...formData, tipoDocumento: value })}>
                    <select className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      {tiposDocumento.map((tipo) => (
                        <option key={tipo.valor} value={tipo.valor}>
                          {tipo.descricao}
                        </option>
                      ))}
                    </select>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prefixo" className="text-right">Prefixo*</Label>
                  <Input
                    id="prefixo"
                    value={formData.prefixo}
                    onChange={(e) => setFormData({ ...formData, prefixo: e.target.value })}
                    className="col-span-3"
                    placeholder="Ex: F, NC, FR"
                    maxLength={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ano" className="text-right">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                    className="col-span-3"
                    placeholder="2024"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="atcud" className="text-right">Cód. ATCUD</Label>
                  <Input
                    id="atcud"
                    value={formData.codigoValidacaoAT}
                    onChange={(e) => setFormData({ ...formData, codigoValidacaoAT: e.target.value })}
                    className="col-span-3"
                    placeholder="Código de validação da AT"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveSerie} className="bg-emerald-600 hover:bg-emerald-700">
                  {editingSerie ? "Guardar" : "Criar Série"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Requisitos Fiscais</p>
                <p className="text-sm text-amber-700">
                  As séries devem ser configuradas com o código de validação ATCUD fornecido pela AT. 
                  Após emissão de documentos, as séries ficam bloqueadas e não podem ser alteradas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Pesquisar séries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredSeries.length} séries
          </Badge>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo Documento</TableHead>
                  <TableHead>Prefixo</TableHead>
                  <TableHead>Último Nº</TableHead>
                  <TableHead>ATCUD</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeries.map((serie) => (
                  <TableRow key={serie.id} className={!serie.ativo ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-slate-400" />
                        {serie.codigo}
                      </div>
                    </TableCell>
                    <TableCell>{serie.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTipoDocumentoLabel(serie.tipoDocumento)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{serie.prefixo}</TableCell>
                    <TableCell className="font-mono">{serie.numeroAtual}</TableCell>
                    <TableCell className="font-mono text-xs">{serie.codigoValidacaoAT || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {serie.ano}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {serie.bloqueado && (
                          <Badge variant="destructive" className="bg-red-100 text-red-700">
                            <Lock className="h-3 w-3 mr-1" />
                            Bloqueado
                          </Badge>
                        )}
                        <Badge variant={serie.ativo ? "default" : "secondary"} className={serie.ativo ? "bg-green-100 text-green-700" : ""}>
                          {serie.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditSerie(serie)}
                          disabled={serie.bloqueado}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleSerieStatus(serie.id)}
                          disabled={serie.bloqueado}
                        >
                          {serie.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
