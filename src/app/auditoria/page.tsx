"use client";

import { useState } from "react";
import Link from "next/link";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  User,
  Activity,
  FileText,
  Users,
  Package,
  Settings,
  FileSpreadsheet
} from "lucide-react";

interface LogAuditoria {
  id: string;
  utilizadorId: string;
  utilizadorNome: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  valorAntigo: string | null;
  valorNovo: string | null;
  ip: string | null;
  createdAt: string;
}

// Dados mock para demonstração
const logsMock: LogAuditoria[] = [
  { id: "1", utilizadorId: "1", utilizadorNome: "Admin", acao: "EMIT", entidade: "Documento", entidadeId: "123", valorAntigo: null, valorNovo: '{"estado": "EMITIDO"}', ip: "192.168.1.1", createdAt: "2024-01-15T14:30:00" },
  { id: "2", utilizadorId: "1", utilizadorNome: "Admin", acao: "CREATE", entidade: "Documento", entidadeId: "123", valorAntigo: null, valorNovo: '{"tipo": "FATURA", "total": 1518.44}', ip: "192.168.1.1", createdAt: "2024-01-15T14:25:00" },
  { id: "3", utilizadorId: "2", utilizadorNome: "Operador", acao: "CREATE", entidade: "Cliente", entidadeId: "C005", valorAntigo: null, valorNovo: '{"nome": "Novo Cliente"}', ip: "192.168.1.2", createdAt: "2024-01-15T12:00:00" },
  { id: "4", utilizadorId: "1", utilizadorNome: "Admin", acao: "UPDATE", entidade: "Artigo", entidadeId: "A001", valorAntigo: '{"preco": 70}', valorNovo: '{"preco": 75}', ip: "192.168.1.1", createdAt: "2024-01-15T10:30:00" },
  { id: "5", utilizadorId: "1", utilizadorNome: "Admin", acao: "EXPORT", entidade: "SAF-T", entidadeId: "2024-01", valorAntigo: null, valorNovo: '{"mes": 1, "ano": 2024}', ip: "192.168.1.1", createdAt: "2024-01-14T09:00:00" },
  { id: "6", utilizadorId: "1", utilizadorNome: "Admin", acao: "CONFIG", entidade: "Empresa", entidadeId: "1", valorAntigo: null, valorNovo: '{"certificadoAT": "AT/DEMO/2024"}', ip: "192.168.1.1", createdAt: "2024-01-01T00:00:00" },
];

const acoes = [
  { valor: "CREATE", descricao: "Criação" },
  { valor: "UPDATE", descricao: "Atualização" },
  { valor: "DELETE", descricao: "Eliminação" },
  { valor: "EMIT", descricao: "Emissão" },
  { valor: "ANNUL", descricao: "Anulação" },
  { valor: "EXPORT", descricao: "Exportação" },
  { valor: "CONFIG", descricao: "Configuração" },
];

const entidades = [
  { valor: "Documento", descricao: "Documentos" },
  { valor: "Cliente", descricao: "Clientes" },
  { valor: "Artigo", descricao: "Artigos" },
  { valor: "Serie", descricao: "Séries" },
  { valor: "SAF-T", descricao: "SAF-T" },
  { valor: "Empresa", descricao: "Empresa" },
];

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogAuditoria[]>(logsMock);
  const [filtroAcao, setFiltroAcao] = useState<string>("todas");
  const [filtroEntidade, setFiltroEntidade] = useState<string>("todas");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter(log => {
    const matchAcao = filtroAcao === "todas" || log.acao === filtroAcao;
    const matchEntidade = filtroEntidade === "todas" || log.entidade === filtroEntidade;
    const matchSearch = !searchTerm || 
      log.entidadeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.utilizadorNome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchAcao && matchEntidade && matchSearch;
  });

  const getAcaoBadge = (acao: string) => {
    const cores: Record<string, string> = {
      CREATE: "bg-green-100 text-green-700",
      UPDATE: "bg-blue-100 text-blue-700",
      DELETE: "bg-red-100 text-red-700",
      EMIT: "bg-purple-100 text-purple-700",
      ANNUL: "bg-orange-100 text-orange-700",
      EXPORT: "bg-cyan-100 text-cyan-700",
      CONFIG: "bg-yellow-100 text-yellow-700",
      LOGIN: "bg-slate-100 text-slate-700",
    };

    const descricoes: Record<string, string> = {
      CREATE: "Criação",
      UPDATE: "Atualização",
      DELETE: "Eliminação",
      EMIT: "Emissão",
      ANNUL: "Anulação",
      EXPORT: "Exportação",
      CONFIG: "Configuração",
      LOGIN: "Login",
    };

    return (
      <Badge className={cores[acao] || "bg-slate-100 text-slate-700"}>
        {descricoes[acao] || acao}
      </Badge>
    );
  };

  const getEntidadeIcon = (entidade: string) => {
    const icones: Record<string, typeof FileText> = {
      Documento: FileText,
      Cliente: Users,
      Artigo: Package,
      Serie: Settings,
      "SAF-T": FileSpreadsheet,
      Empresa: Activity,
    };
    const Icone = icones[entidade] || Activity;
    return <Icone className="h-4 w-4 text-slate-400" />;
  };

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr);
    return {
      data: data.toLocaleDateString('pt-PT'),
      hora: data.toLocaleTimeString('pt-PT'),
    };
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
              <FileText className="h-4 w-4" />
              Documentos
            </Link>
            <Link href="/clientes" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Users className="h-4 w-4" />
              Clientes
            </Link>
            <Link href="/artigos" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Package className="h-4 w-4" />
              Artigos
            </Link>
            <Link href="/series" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Settings className="h-4 w-4" />
              Séries
            </Link>
            <Link href="/saf-t" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <FileSpreadsheet className="h-4 w-4" />
              SAF-T
            </Link>
            <Link href="/auditoria" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
              <Activity className="h-4 w-4" />
              Auditoria
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Registo de Auditoria</h2>
          <p className="text-slate-500">Histórico de todas as ações realizadas no sistema</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Ações</p>
                  <p className="text-xl font-bold">{logs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Documentos</p>
                  <p className="text-xl font-bold">{logs.filter(l => l.entidade === "Documento").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Clientes</p>
                  <p className="text-xl font-bold">{logs.filter(l => l.entidade === "Cliente").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-100 p-2 rounded-full">
                  <FileSpreadsheet className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Exportações</p>
                  <p className="text-xl font-bold">{logs.filter(l => l.acao === "EXPORT").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs text-slate-500">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="ID da entidade ou utilizador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Label className="text-xs text-slate-500">Ação</Label>
                <Select value={filtroAcao} onValueChange={setFiltroAcao}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {acoes.map((acao) => (
                      <SelectItem key={acao.valor} value={acao.valor}>
                        {acao.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-xs text-slate-500">Entidade</Label>
                <Select value={filtroEntidade} onValueChange={setFiltroEntidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {entidades.map((entidade) => (
                      <SelectItem key={entidade.valor} value={entidade.valor}>
                        {entidade.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de logs */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Utilizador</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>ID Entidade</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const { data, hora } = formatarData(log.createdAt);
                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm">{data}</p>
                            <p className="text-xs text-slate-500">{hora}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          {log.utilizadorNome}
                        </div>
                      </TableCell>
                      <TableCell>{getAcaoBadge(log.acao)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEntidadeIcon(log.entidade)}
                          {log.entidade}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.entidadeId}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{log.ip || "-"}</TableCell>
                    </TableRow>
                  );
                })}
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
