"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, Download, LogOut, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function PortalDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ nif: "", key: "" });
  const [documentos, setDocumentos] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("portal_session");
    if (saved) {
      const { nif, key } = JSON.parse(saved);
      fetchDocumentos(nif, key);
    }
  }, []);

  const fetchDocumentos = async (nif: string, key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/documentos?nif=${nif}&key=${key}`);
      if (res.ok) {
        const data = await res.json();
        setDocumentos(data);
        setIsLoggedIn(true);
        localStorage.setItem("portal_session", JSON.stringify({ nif, key }));
      } else {
        toast.error("Credenciais inválidas");
        localStorage.removeItem("portal_session");
      }
    } catch (error) {
      toast.error("Erro ao conectar ao portal");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocumentos(credentials.nif, credentials.key);
  };

  const handleLogout = () => {
    localStorage.removeItem("portal_session");
    setIsLoggedIn(false);
    setDocumentos([]);
    setCredentials({ nif: "", key: "" });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-emerald-600 p-2 rounded-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Portal do Cliente</h1>
        </div>

        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle>Acesso Seguro</CardTitle>
            <CardDescription>
              Introduza o seu NIF e a Chave de Acesso de qualquer fatura recebida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nif">O seu NIF</Label>
                <Input
                  id="nif"
                  placeholder="123456789"
                  value={credentials.nif}
                  onChange={(e) => setCredentials({...credentials, nif: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">Chave de Acesso</Label>
                <Input
                  id="key"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  value={credentials.key}
                  onChange={(e) => setCredentials({...credentials, key: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Entrar no Portal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-slate-900">Portal do Cliente</span>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">O Seu Histórico de Faturação</h2>
          <p className="text-slate-500">Consulte e descarregue os seus documentos fiscais.</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      {doc.dataEmissao ? new Date(doc.dataEmissao).toLocaleDateString("pt-PT") : "Pendente"}
                    </TableCell>
                    <TableCell className="font-medium">{doc.numeroFormatado}</TableCell>
                    <TableCell>{doc.tipo}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(doc.totalLiquido)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={doc.estadoPagamento === "PAGO" ? "default" : "outline"}
                             className={doc.estadoPagamento === "PAGO" ? "bg-green-100 text-green-700" : ""}>
                        {doc.estadoPagamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/portal/documento/${doc.accessKey}`}>
                          <FileText className="h-4 w-4 mr-2" /> Detalhes
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
