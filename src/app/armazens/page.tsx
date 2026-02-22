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
  Warehouse, 
  Plus, 
  Search, 
  Edit,
  ArrowLeft,
  MapPin,
  Star,
  Package,
  Activity,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Armazem {
  id: string;
  codigo: string;
  nome: string;
  morada: string | null;
  codigoPostal: string | null;
  localidade: string | null;
  principal: boolean;
  ativo: boolean;
  observacoes: string | null;
  _count?: {
    stocks: number;
    movimentosOrigem: number;
  };
}

export default function ArmazensPage() {
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArmazem, setEditingArmazem] = useState<Armazem | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    morada: "",
    codigoPostal: "",
    localidade: "",
    principal: false,
    observacoes: "",
  });

  useEffect(() => {
    fetchArmazens();
  }, []);

  const fetchArmazens = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/armazens");
      const data = await response.json();

      if (response.ok) {
        setArmazens(data);
      }
    } catch (error) {
      console.error("Erro ao carregar armazéns:", error);
      toast.error("Erro ao carregar armazéns");
    } finally {
      setLoading(false);
    }
  };

  const handleNewArmazem = () => {
    setEditingArmazem(null);
    setFormData({
      codigo: "",
      nome: "",
      morada: "",
      codigoPostal: "",
      localidade: "",
      principal: false,
      observacoes: "",
    });
    setDialogOpen(true);
  };

  const handleEditArmazem = (armazem: Armazem) => {
    setEditingArmazem(armazem);
    setFormData({
      codigo: armazem.codigo,
      nome: armazem.nome,
      morada: armazem.morada || "",
      codigoPostal: armazem.codigoPostal || "",
      localidade: armazem.localidade || "",
      principal: armazem.principal,
      observacoes: armazem.observacoes || "",
    });
    setDialogOpen(true);
  };

  const handleSaveArmazem = async () => {
    try {
      if (!formData.codigo || !formData.nome) {
        toast.error("Preencha os campos obrigatórios: Código e Nome");
        return;
      }

      const url = editingArmazem 
        ? `/api/armazens/${editingArmazem.id}`
        : "/api/armazens";
      
      const method = editingArmazem ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingArmazem ? "Armazém atualizado!" : "Armazém criado!");
        setDialogOpen(false);
        fetchArmazens();
      } else {
        toast.error(data.error || "Erro ao guardar armazém");
      }
    } catch (error) {
      console.error("Erro ao guardar:", error);
      toast.error("Erro ao guardar armazém");
    }
  };

  const toggleAtivo = async (armazem: Armazem) => {
    try {
      const response = await fetch(`/api/armazens/${armazem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...armazem, ativo: !armazem.ativo }),
      });

      if (response.ok) {
        toast.success(armazem.ativo ? "Armazém desativado" : "Armazém ativado");
        fetchArmazens();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao alterar estado");
      }
    } catch (error) {
      toast.error("Erro ao alterar estado");
    }
  };

  const filteredArmazens = armazens.filter(a => 
    a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.localidade?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg">
                <Warehouse className="h-6 w-6 text-white" />
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
            <Link href="/armazens" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-700 font-medium">
              <Warehouse className="h-4 w-4" />
              Armazéns
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestão de Armazéns</h2>
            <p className="text-slate-500">Gerir armazéns para controlo de stock</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewArmazem} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Armazém
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingArmazem ? "Editar Armazém" : "Novo Armazém"}</DialogTitle>
                <DialogDescription>
                  {editingArmazem ? "Altere os dados do armazém abaixo." : "Preencha os dados do novo armazém."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="Ex: ARM001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="principal">Principal</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="principal"
                        checked={formData.principal}
                        onChange={(e) => setFormData({ ...formData, principal: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-600">Armazém principal</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Armazém Principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="morada">Morada</Label>
                  <Input
                    id="morada"
                    value={formData.morada}
                    onChange={(e) => setFormData({ ...formData, morada: e.target.value })}
                    placeholder="Rua, número, polígono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigoPostal">Código Postal</Label>
                    <Input
                      id="codigoPostal"
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                      placeholder="1000-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localidade">Localidade</Label>
                    <Input
                      id="localidade"
                      value={formData.localidade}
                      onChange={(e) => setFormData({ ...formData, localidade: e.target.value })}
                      placeholder="Lisboa"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Notas adicionais"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveArmazem} className="bg-amber-600 hover:bg-amber-700">
                  {editingArmazem ? "Guardar" : "Criar Armazém"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Warehouse className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Gestão de Stock</p>
                <p className="text-sm text-amber-700">
                  Os armazéns permitem controlar o stock por localização. O armazém principal é usado por defeito nas operações de stock.
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
              placeholder="Pesquisar armazéns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredArmazens.length} armazéns
          </Badge>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Artigos</TableHead>
                  <TableHead>Movimentos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      A carregar...
                    </TableCell>
                  </TableRow>
                ) : filteredArmazens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Nenhum armazém encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArmazens.map((armazem) => (
                    <TableRow key={armazem.id} className={!armazem.ativo ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {armazem.principal && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          )}
                          {armazem.codigo}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-slate-400" />
                          {armazem.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {armazem.localidade || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-slate-400" />
                          {armazem._count?.stocks || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4 text-slate-400" />
                          {armazem._count?.movimentosOrigem || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {armazem.principal && (
                            <Badge className="bg-amber-100 text-amber-700">
                              Principal
                            </Badge>
                          )}
                          <Badge variant={armazem.ativo ? "default" : "secondary"} className={armazem.ativo ? "bg-green-100 text-green-700" : ""}>
                            {armazem.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditArmazem(armazem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleAtivo(armazem)}
                            disabled={armazem.principal}
                          >
                            {armazem.ativo ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
