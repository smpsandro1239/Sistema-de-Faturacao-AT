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
  Truck, 
  Plus, 
  Search, 
  Edit,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Globe,
  CreditCard,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Fornecedor {
  id: string;
  codigo: string;
  nome: string;
  nif: string;
  morada: string | null;
  codigoPostal: string | null;
  localidade: string | null;
  pais: string;
  telefone: string | null;
  email: string | null;
  website: string | null;
  iban: string | null;
  contactoNome: string | null;
  observacoes: string | null;
  ativo: boolean;
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    nif: "",
    morada: "",
    codigoPostal: "",
    localidade: "",
    pais: "PT",
    telefone: "",
    email: "",
    website: "",
    iban: "",
    contactoNome: "",
    observacoes: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchFornecedores();
  }, [searchTerm, pagination.page]);

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/fornecedores?${params}`);
      const data = await response.json();

      if (response.ok) {
        setFornecedores(data.fornecedores);
        setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
      }
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  };

  const handleNewFornecedor = () => {
    setEditingFornecedor(null);
    setFormData({
      codigo: "",
      nome: "",
      nif: "",
      morada: "",
      codigoPostal: "",
      localidade: "",
      pais: "PT",
      telefone: "",
      email: "",
      website: "",
      iban: "",
      contactoNome: "",
      observacoes: "",
    });
    setDialogOpen(true);
  };

  const handleEditFornecedor = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({
      codigo: fornecedor.codigo,
      nome: fornecedor.nome,
      nif: fornecedor.nif,
      morada: fornecedor.morada || "",
      codigoPostal: fornecedor.codigoPostal || "",
      localidade: fornecedor.localidade || "",
      pais: fornecedor.pais || "PT",
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
      website: fornecedor.website || "",
      iban: fornecedor.iban || "",
      contactoNome: fornecedor.contactoNome || "",
      observacoes: fornecedor.observacoes || "",
    });
    setDialogOpen(true);
  };

  const handleSaveFornecedor = async () => {
    try {
      if (!formData.codigo || !formData.nome || !formData.nif) {
        toast.error("Preencha os campos obrigatórios: Código, Nome e NIF");
        return;
      }

      const url = editingFornecedor 
        ? `/api/fornecedores/${editingFornecedor.id}`
        : "/api/fornecedores";
      
      const method = editingFornecedor ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingFornecedor ? "Fornecedor atualizado!" : "Fornecedor criado!");
        setDialogOpen(false);
        fetchFornecedores();
      } else {
        toast.error(data.error || "Erro ao guardar fornecedor");
      }
    } catch (error) {
      console.error("Erro ao guardar:", error);
      toast.error("Erro ao guardar fornecedor");
    }
  };

  const toggleAtivo = async (fornecedor: Fornecedor) => {
    try {
      const response = await fetch(`/api/fornecedores/${fornecedor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fornecedor, ativo: !fornecedor.ativo }),
      });

      if (response.ok) {
        toast.success(fornecedor.ativo ? "Fornecedor desativado" : "Fornecedor ativado");
        fetchFornecedores();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao alterar estado");
      }
    } catch (error) {
      toast.error("Erro ao alterar estado");
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
                <Truck className="h-6 w-6 text-white" />
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
            <Link href="/fornecedores" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
              <Truck className="h-4 w-4" />
              Fornecedores
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestão de Fornecedores</h2>
            <p className="text-slate-500">Gerir fornecedores para compras e encomendas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewFornecedor} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingFornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
                <DialogDescription>
                  {editingFornecedor ? "Altere os dados do fornecedor abaixo." : "Preencha os dados do novo fornecedor."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="Ex: F001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nif">NIF *</Label>
                    <Input
                      id="nif"
                      value={formData.nif}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                      placeholder="123456789"
                      maxLength={9}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="morada">Morada</Label>
                  <Input
                    id="morada"
                    value={formData.morada}
                    onChange={(e) => setFormData({ ...formData, morada: e.target.value })}
                    placeholder="Rua, número, andar"
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="211234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="fornecedor@empresa.pt"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://empresa.pt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      placeholder="PT50..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactoNome">Nome do Contacto</Label>
                  <Input
                    id="contactoNome"
                    value={formData.contactoNome}
                    onChange={(e) => setFormData({ ...formData, contactoNome: e.target.value })}
                    placeholder="Nome do contacto principal"
                  />
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
                <Button onClick={handleSaveFornecedor} className="bg-emerald-600 hover:bg-emerald-700">
                  {editingFornecedor ? "Guardar" : "Criar Fornecedor"}
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
              placeholder="Pesquisar fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {pagination.total} fornecedores
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
                  <TableHead>NIF</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Localidade</TableHead>
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
                ) : fornecedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Nenhum fornecedor encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  fornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id} className={!fornecedor.ativo ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{fornecedor.codigo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          {fornecedor.nome}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{fornecedor.nif}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {fornecedor.telefone && (
                            <span className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {fornecedor.telefone}
                            </span>
                          )}
                          {fornecedor.email && (
                            <span className="text-sm flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {fornecedor.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{fornecedor.localidade || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={fornecedor.ativo ? "default" : "secondary"} className={fornecedor.ativo ? "bg-green-100 text-green-700" : ""}>
                          {fornecedor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditFornecedor(fornecedor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleAtivo(fornecedor)}
                          >
                            {fornecedor.ativo ? (
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
