"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Users, 
  Package, 
  Settings, 
  LayoutDashboard,
  LogOut,
  Euro,
  Clock,
  ChevronRight,
  FileSpreadsheet,
  Shield,
  Activity,
  TrendingUp,
  PieChart,
  BarChart3,
  Truck,
  Warehouse,
  AlertTriangle
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface Estatisticas {
  faturasHoje: number;
  totalFaturadoMes: number;
  variacaoMensal: string;
  clientesAtivos: number;
  documentosPendentes: number;
  documentosRecentes: Array<{
    id: string;
    cliente: string;
    valor: number;
    estado: string;
    data: string | null;
  }>;
  vendasMensais: Array<{
    mes: string;
    total: number;
  }>;
  vendasPorTipo: Array<{
    tipo: string;
    quantidade: number;
    total: number;
  }>;
  ivaResumo: Array<{
    taxa: string;
    base: number;
    iva: number;
  }>;
  stockBaixo: Array<{
    artigoId: string;
    artigoCodigo: string;
    artigoDescricao: string;
    armazemId: string;
    armazemNome: string;
    quantidadeAtual: number;
    stockMinimo: number;
  }>;
  fornecedoresAtivos: number;
  armazensAtivos: number;
}

const quickActions = [
  { title: "Nova Fatura", description: "Criar uma nova fatura", icon: FileText, href: "/documentos" },
  { title: "Novo Cliente", description: "Registar novo cliente", icon: Users, href: "/clientes" },
  { title: "Novo Artigo", description: "Adicionar artigo/serviço", icon: Package, href: "/artigos" },
  { title: "Exportar SAF-T", description: "Gerar ficheiro SAF-T", icon: FileSpreadsheet, href: "/saf-t" },
];

const COLORS = ['#059669', '#0d9488', '#0891b2', '#0284c7', '#0369a1'];

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState<{ nome: string; email: string } | null>(null);

  useEffect(() => {
    // Verificar se há utilizador logado
    const utilizadorStr = localStorage.getItem("utilizador");
    if (utilizadorStr) {
      setUtilizador(JSON.parse(utilizadorStr));
    }

    // Carregar estatísticas
    fetchEstatisticas();
  }, []);

  const fetchEstatisticas = async () => {
    try {
      const response = await fetch("/api/estatisticas");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("utilizador");
    router.push("/login");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatChartCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k€`;
    }
    return `${value.toFixed(0)}€`;
  };

  const statsCards = stats ? [
    { 
      title: "Faturas Hoje", 
      value: stats.faturasHoje.toString(), 
      change: stats.faturasHoje > 0 ? `+${stats.faturasHoje}` : "0", 
      icon: FileText, 
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    { 
      title: "Total Faturado (Mês)", 
      value: formatCurrency(stats.totalFaturadoMes), 
      change: `${stats.variacaoMensal}%`, 
      icon: Euro, 
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    { 
      title: "Clientes Ativos", 
      value: stats.clientesAtivos.toString(), 
      change: "", 
      icon: Users, 
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    { 
      title: "Documentos Pendentes", 
      value: stats.documentosPendentes.toString(), 
      change: "", 
      icon: Clock, 
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
  ] : [];

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
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Certificado</span>
              </div>
              {utilizador && (
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="text-slate-600">{utilizador.nome}</span>
                </div>
              )}
              <ThemeToggle />
              <Link href="/auditoria">
                <Button variant="ghost" size="icon">
                  <Activity className="h-4 w-4" />
                </Button>
              </Link>
              {utilizador ? (
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
              <LayoutDashboard className="h-4 w-4" />
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
            <Link href="/orcamentos" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <FileText className="h-4 w-4" />
              Orçamentos
            </Link>
            <Link href="/compras" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Truck className="h-4 w-4" />
              Compras
            </Link>
            <Link href="/fornecedores" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Truck className="h-4 w-4" />
              Fornecedores
            </Link>
            <Link href="/armazens" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Warehouse className="h-4 w-4" />
              Armazéns
            </Link>
            <Link href="/stock" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Package className="h-4 w-4" />
              Stock
            </Link>
            <Link href="/encomendas" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <FileText className="h-4 w-4" />
              Encomendas
            </Link>
            <Link href="/contas-correntes" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Euro className="h-4 w-4" />
              Contas Correntes
            </Link>
            <Link href="/series" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Settings className="h-4 w-4" />
              Séries
            </Link>
            <Link href="/saf-t" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <FileSpreadsheet className="h-4 w-4" />
              SAF-T
            </Link>
            <Link href="/auditoria" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Activity className="h-4 w-4" />
              Auditoria
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            statsCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                      {stat.change && (
                        <p className={`text-sm mt-1 ${stat.change.startsWith('+') || parseFloat(stat.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change} vs. período anterior
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-lg">Vendas Mensais</CardTitle>
              </div>
              <CardDescription>Faturação dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : stats?.vendasMensais ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={stats.vendasMensais}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={formatChartCurrency}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Total']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#059669" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </CardContent>
          </Card>

          {/* Document Types Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-teal-600" />
                <CardTitle className="text-lg">Documentos por Tipo</CardTitle>
              </div>
              <CardDescription>Distribuição por tipo de documento</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : stats?.vendasPorTipo && stats.vendasPorTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={stats.vendasPorTipo}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="quantidade"
                      nameKey="tipo"
                      label={({ tipo, percent }) => `${tipo} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {stats.vendasPorTipo.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-500">
                  Sem dados suficientes
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* IVA Summary Chart */}
        {stats?.ivaResumo && stats.ivaResumo.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-600" />
                <CardTitle className="text-lg">Resumo de IVA (Mês Atual)</CardTitle>
              </div>
              <CardDescription>Base tributável e IVA por taxa</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.ivaResumo} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      type="number"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={formatChartCurrency}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="taxa" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      width={50}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="base" name="Base Tributável" fill="#059669" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="iva" name="IVA" fill="#0d9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Documents */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documentos Recentes</CardTitle>
                <CardDescription>Últimos documentos emitidos</CardDescription>
              </div>
              <Link href="/documentos">
                <Button variant="outline" size="sm">
                  Ver todos
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : stats?.documentosRecentes && stats.documentosRecentes.length > 0 ? (
                <div className="space-y-4">
                  {stats.documentosRecentes.map((doc, index) => (
                    <Link key={index} href={`/documentos/${doc.id}`}>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-2 rounded-lg border">
                            <FileText className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{doc.id}</p>
                            <p className="text-sm text-slate-500">{doc.cliente}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">{formatCurrency(doc.valor)}</p>
                          <p className="text-sm text-slate-500">{doc.data || "Rascunho"}</p>
                        </div>
                        <Badge className={doc.estado === "EMITIDO" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                          {doc.estado === "EMITIDO" ? "Emitido" : "Rascunho"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Não há documentos recentes</p>
                  <Link href="/documentos">
                    <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                      Criar primeiro documento
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Aceda rapidamente às funcionalidades principais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all cursor-pointer">
                      <div className="bg-white p-2 rounded-lg border">
                        <action.icon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{action.title}</p>
                        <p className="text-sm text-slate-500">{action.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Alerts */}
        {stats?.stockBaixo && stats.stockBaixo.length > 0 && (
          <Card className="mt-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-amber-900">
                      Alerta de Stock Baixo ({stats.stockBaixo.length} artigos)
                    </h3>
                    <Link href="/stock">
                      <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                        Ver Movimentos
                      </Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.stockBaixo.slice(0, 6).map((item, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-amber-200">
                        <p className="font-medium text-slate-900 truncate">{item.artigoCodigo}</p>
                        <p className="text-sm text-slate-600 truncate">{item.artigoDescricao}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">{item.armazemNome}</span>
                          <Badge variant="destructive" className="bg-red-100 text-red-700">
                            {item.quantidadeAtual} / {item.stockMinimo}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  {stats.stockBaixo.length > 6 && (
                    <p className="text-sm text-amber-700 mt-3">
                      +{stats.stockBaixo.length - 6} artigos adicionais com stock baixo
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AT Compliance Banner */}
        <Card className="mt-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-full">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900">Software Certificado pela AT</h3>
                <p className="text-sm text-emerald-700">
                  Este software cumpre todos os requisitos da Portaria 363/2010, incluindo hash encadeado, ATCUD, QR Code e geração de SAF-T.
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="text-xs text-emerald-600">Certificado Nº</span>
                <span className="font-mono font-bold text-emerald-800">AT/DEMO/2024</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-slate-500">
              © 2024 FaturaAT - Sistema de Faturação Certificado pela AT
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Portaria 363/2010</span>
              <span>•</span>
              <span>SAF-T (PT)</span>
              <span>•</span>
              <span>ATCUD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
