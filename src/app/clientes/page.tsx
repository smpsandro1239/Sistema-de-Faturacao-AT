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
  Users, 
  Plus, 
  Search, 
  Edit,
  Shield,
  ArrowLeft,
  Building2,
  X
} from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/pagination";

interface Cliente {
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
  ativo: boolean;
}

const clientesMock: Cliente[] = [
  { id: "1", codigo: "C001", nome: "Empresa ABC Lda", nif: "509123456", morada: "Rua das Flores, 123", codigoPostal: "1000-001", localidade: "Lisboa", pais: "PT", telefone: "211234567", email: "contabilidade@abc.pt", ativo: true },
  { id: "2", codigo: "C002", nome: "Comercial XYZ SA", nif: "508765432", morada: "Av. Principal, 45", codigoPostal: "4000-001", localidade: "Porto", pais: "PT", telefone: "229876543", email: "geral@xyz.pt", ativo: true },
  { id: "3", codigo: "C003", nome: "Serviços Premium Lda", nif: "507654321", morada: "Rua do Comércio, 78", codigoPostal: "3000-001", localidade: "Coimbra", pais: "PT", telefone: "239123456", email: "info@premium.pt", ativo: true },
  { id: "4", codigo: "C004", nome: "Negócios Globais SA", nif: "506543210", morada: "Parque Empresarial, Lote 5", codigoPostal: "2000-001", localidade: "Leiria", pais: "PT", telefone: "244123456", email: "admin@globais.pt", ativo: true },
  { id: "5", codigo: "C005", nome: "Tecnologias Futuro Lda", nif: "505432109", morada: "Centro de Inovação, Sala 10", codigoPostal: "4700-001", localidade: "Braga", pais: "PT", telefone: "253123456", email: "tech@futuro.pt", ativo: false },
  { id: "6", codigo: "C006", nome: "Inovação Digital Lda", nif: "504321098", morada: "Av. da República, 100", codigoPostal: "1050-001", localidade: "Lisboa", pais: "PT", telefone: "212345678", email: "info@inovacao.pt", ativo: true },
  { id: "7", codigo: "C007", nome: "Soluções Integradas SA", nif: "503210987", morada: "Rua Central, 50", codigoPostal: "4400-001", localidade: "Vila Nova de Gaia", pais: "PT", telefone: "223456789", email: "contato@solucoes.pt", ativo: true },
  { id: "8", codigo: "C008", nome: "Exportadora Norte Lda", nif: "502109876", morada: "Zona Industrial, Lote 3", codigoPostal: "4700-002", localidade: "Braga", pais: "PT", telefone: "253456789", email: "export@norte.pt", ativo: true },
];

const ITEMS_PER_PAGE = 5;

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(clientesMock);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    nif: "",
    morada: "",
    codigoPostal: "",
    localidade: "",
    pais: "PT",
    telefone: "",
    email: "",
  });

  const filteredClientes = clientes.filter(
    cliente =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.nif.includes(searchTerm) ||
      cliente.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação
  const totalPages = Math.ceil(filteredClientes.length / ITEMS_PER_PAGE);
  const paginatedClientes = filteredClientes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleNewCliente = () => {
    setEditingCliente(null);
    setFormData({
      nome: "",
      nif: "",
      morada: "",
      codigoPostal: "",
      localidade: "",
      pais: "PT",
      telefone: "",
      email: "",
    });
    setDialogOpen(true);
  };

  const handleEditCliente = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      nif: cliente.nif,
      morada: cliente.morada || "",
      codigoPostal: cliente.codigoPostal || "",
      localidade: cliente.localidade || "",
      pais: cliente.pais,
      telefone: cliente.telefone || "",
      email: cliente.email || "",
    });
    setDialogOpen(true);
  };

  const handleSaveCliente = async () => {
    const codigo = editingCliente?.codigo || `C${String(clientes.length + 1).padStart(3, "0")}`;
    
    if (editingCliente) {
      setClientes(clientes.map(c => 
        c.id === editingCliente.id 
          ? { ...c, ...formData }
          : c
      ));
    } else {
      const newCliente: Cliente = {
        id: String(clientes.length + 1),
        codigo,
        ...formData,
        ativo: true,
      };
      setClientes([...clientes, newCliente]);
    }
    setDialogOpen(false);
  };

  const toggleClienteStatus = (id: string) => {
    setClientes(clientes.map(c => 
      c.id === id ? { ...c, ativo: !c.ativo } : c
    ));
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
            <Link href="/clientes" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
              <Users className="h-4 w-4" />
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
            <h2 className="text-2xl font-bold text-slate-900">Gestão de Clientes</h2>
            <p className="text-slate-500">Gerir clientes para emissão de documentos fiscais</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewCliente} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
                <DialogDescription>
                  {editingCliente ? "Altere os dados do cliente abaixo." : "Preencha os dados do novo cliente."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">Nome*</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="col-span-3"
                    placeholder="Nome da empresa ou cliente"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nif" className="text-right">NIF*</Label>
                  <Input
                    id="nif"
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    className="col-span-3"
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="morada" className="text-right">Morada</Label>
                  <Input
                    id="morada"
                    value={formData.morada}
                    onChange={(e) => setFormData({ ...formData, morada: e.target.value })}
                    className="col-span-3"
                    placeholder="Rua, número, andar"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="codigoPostal" className="text-right">C. Postal</Label>
                  <Input
                    id="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                    className="col-span-3"
                    placeholder="1000-001"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="localidade" className="text-right">Localidade</Label>
                  <Input
                    id="localidade"
                    value={formData.localidade}
                    onChange={(e) => setFormData({ ...formData, localidade: e.target.value })}
                    className="col-span-3"
                    placeholder="Lisboa"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pais" className="text-right">País</Label>
                  <Select value={formData.pais} onValueChange={(value) => setFormData({ ...formData, pais: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PT">Portugal</SelectItem>
                      <SelectItem value="ES">Espanha</SelectItem>
                      <SelectItem value="FR">França</SelectItem>
                      <SelectItem value="DE">Alemanha</SelectItem>
                      <SelectItem value="UK">Reino Unido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="telefone" className="text-right">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="col-span-3"
                    placeholder="211234567"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="col-span-3"
                    placeholder="email@empresa.pt"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveCliente} className="bg-emerald-600 hover:bg-emerald-700">
                  {editingCliente ? "Guardar" : "Criar Cliente"}
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
              placeholder="Pesquisar por nome, NIF ou código..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredClientes.length} clientes
          </Badge>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>NIF</TableHead>
                  <TableHead>Localidade</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClientes.map((cliente) => (
                  <TableRow key={cliente.id} className={!cliente.ativo ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{cliente.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {cliente.nome}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{cliente.nif}</TableCell>
                    <TableCell>{cliente.localidade || "-"}</TableCell>
                    <TableCell>{cliente.telefone || "-"}</TableCell>
                    <TableCell>{cliente.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={cliente.ativo ? "default" : "secondary"} className={cliente.ativo ? "bg-green-100 text-green-700" : ""}>
                        {cliente.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCliente(cliente)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleClienteStatus(cliente.id)}>
                          {cliente.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredClientes.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
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
