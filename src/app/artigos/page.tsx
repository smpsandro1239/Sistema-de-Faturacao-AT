"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Edit,
  Shield,
  ArrowLeft,
  Tag
} from "lucide-react";
import Link from "next/link";

interface Artigo {
  id: string;
  codigo: string;
  descricao: string;
  tipo: "PRODUTO" | "SERVICO" | "OUTRO";
  precoUnitario: number;
  unidade: string;
  taxaIVA: string;
  taxaIVAPercentagem: number;
  ativo: boolean;
}

const artigosMock: Artigo[] = [
  { id: "1", codigo: "A001", descricao: "Consultoria Técnica", tipo: "SERVICO", precoUnitario: 75.00, unidade: "H", taxaIVA: "NOR", taxaIVAPercentagem: 23, ativo: true },
  { id: "2", codigo: "A002", descricao: "Desenvolvimento de Software", tipo: "SERVICO", precoUnitario: 85.00, unidade: "H", taxaIVA: "NOR", taxaIVAPercentagem: 23, ativo: true },
  { id: "3", codigo: "A003", descricao: "Licença de Software", tipo: "PRODUTO", precoUnitario: 299.00, unidade: "UN", taxaIVA: "NOR", taxaIVAPercentagem: 23, ativo: true },
  { id: "4", codigo: "A004", descricao: "Formação Profissional", tipo: "SERVICO", precoUnitario: 50.00, unidade: "H", taxaIVA: "RED", taxaIVAPercentagem: 6, ativo: true },
  { id: "5", codigo: "A005", descricao: "Suporte Técnico Mensal", tipo: "SERVICO", precoUnitario: 150.00, unidade: "MÊS", taxaIVA: "NOR", taxaIVAPercentagem: 23, ativo: true },
  { id: "6", codigo: "A006", descricao: "Equipamento Informático", tipo: "PRODUTO", precoUnitario: 450.00, unidade: "UN", taxaIVA: "NOR", taxaIVAPercentagem: 23, ativo: false },
];

const taxasIVA = [
  { codigo: "NOR", descricao: "Normal (23%)", taxa: 23 },
  { codigo: "INT", descricao: "Intermédia (13%)", taxa: 13 },
  { codigo: "RED", descricao: "Reduzida (6%)", taxa: 6 },
];

export default function ArtigosPage() {
  const [artigos, setArtigos] = useState<Artigo[]>(artigosMock);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArtigo, setEditingArtigo] = useState<Artigo | null>(null);
  const [formData, setFormData] = useState({
    descricao: "",
    tipo: "SERVICO" as "PRODUTO" | "SERVICO" | "OUTRO",
    precoUnitario: "",
    unidade: "UN",
    taxaIVA: "NOR",
  });

  const filteredArtigos = artigos.filter(
    artigo =>
      artigo.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artigo.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewArtigo = () => {
    setEditingArtigo(null);
    setFormData({
      descricao: "",
      tipo: "SERVICO",
      precoUnitario: "",
      unidade: "UN",
      taxaIVA: "NOR",
    });
    setDialogOpen(true);
  };

  const handleEditArtigo = (artigo: Artigo) => {
    setEditingArtigo(artigo);
    setFormData({
      descricao: artigo.descricao,
      tipo: artigo.tipo,
      precoUnitario: artigo.precoUnitario.toString(),
      unidade: artigo.unidade,
      taxaIVA: artigo.taxaIVA,
    });
    setDialogOpen(true);
  };

  const handleSaveArtigo = async () => {
    const codigo = editingArtigo?.codigo || `A${String(artigos.length + 1).padStart(3, "0")}`;
    const taxa = taxasIVA.find(t => t.codigo === formData.taxaIVA)!;
    
    if (editingArtigo) {
      setArtigos(artigos.map(a => 
        a.id === editingArtigo.id 
          ? { ...a, ...formData, precoUnitario: parseFloat(formData.precoUnitario), taxaIVAPercentagem: taxa.taxa }
          : a
      ));
    } else {
      const newArtigo: Artigo = {
        id: String(artigos.length + 1),
        codigo,
        descricao: formData.descricao,
        tipo: formData.tipo,
        precoUnitario: parseFloat(formData.precoUnitario),
        unidade: formData.unidade,
        taxaIVA: formData.taxaIVA,
        taxaIVAPercentagem: taxa.taxa,
        ativo: true,
      };
      setArtigos([...artigos, newArtigo]);
    }
    setDialogOpen(false);
  };

  const toggleArtigoStatus = (id: string) => {
    setArtigos(artigos.map(a => 
      a.id === id ? { ...a, ativo: !a.ativo } : a
    ));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
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
            <Link href="/artigos" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
              <Package className="h-4 w-4" />
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
            <h2 className="text-2xl font-bold text-slate-900">Gestão de Artigos</h2>
            <p className="text-slate-500">Gerir artigos e serviços para faturação</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewArtigo} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Artigo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingArtigo ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
                <DialogDescription>
                  {editingArtigo ? "Altere os dados do artigo abaixo." : "Preencha os dados do novo artigo."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descricao" className="text-right">Descrição*</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="col-span-3"
                    placeholder="Descrição do artigo/serviço"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipo" className="text-right">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value: "PRODUTO" | "SERVICO" | "OUTRO") => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICO">Serviço</SelectItem>
                      <SelectItem value="PRODUTO">Produto</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="preco" className="text-right">Preço*</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.precoUnitario}
                    onChange={(e) => setFormData({ ...formData, precoUnitario: e.target.value })}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unidade" className="text-right">Unidade</Label>
                  <Select value={formData.unidade} onValueChange={(value) => setFormData({ ...formData, unidade: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">Unidade (UN)</SelectItem>
                      <SelectItem value="H">Hora (H)</SelectItem>
                      <SelectItem value="DIA">Dia</SelectItem>
                      <SelectItem value="MÊS">Mês</SelectItem>
                      <SelectItem value="KG">Quilograma (KG)</SelectItem>
                      <SelectItem value="M">Metro (M)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="iva" className="text-right">Taxa IVA</Label>
                  <Select value={formData.taxaIVA} onValueChange={(value) => setFormData({ ...formData, taxaIVA: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a taxa" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxasIVA.map((taxa) => (
                        <SelectItem key={taxa.codigo} value={taxa.codigo}>
                          {taxa.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveArtigo} className="bg-emerald-600 hover:bg-emerald-700">
                  {editingArtigo ? "Guardar" : "Criar Artigo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Pesquisar por descrição ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredArtigos.length} artigos
          </Badge>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArtigos.map((artigo) => (
                  <TableRow key={artigo.id} className={!artigo.ativo ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{artigo.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-slate-400" />
                        {artigo.descricao}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {artigo.tipo === "SERVICO" ? "Serviço" : artigo.tipo === "PRODUTO" ? "Produto" : "Outro"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{formatCurrency(artigo.precoUnitario)}</TableCell>
                    <TableCell>{artigo.unidade}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {artigo.taxaIVAPercentagem}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={artigo.ativo ? "default" : "secondary"} className={artigo.ativo ? "bg-green-100 text-green-700" : ""}>
                        {artigo.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditArtigo(artigo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleArtigoStatus(artigo.id)}>
                          {artigo.ativo ? "Desativar" : "Ativar"}
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
