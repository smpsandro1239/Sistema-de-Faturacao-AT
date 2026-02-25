"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Euro, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ContasCorrentesFornecedoresPage() {
  const [loading, setLoading] = useState(true);
  const [contas, setContas] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchContas();
  }, []);

  const fetchContas = async () => {
    try {
      const res = await fetch("/api/fornecedores/contas-correntes");
      if (res.ok) {
        setContas(await res.json());
      }
    } catch (error) {
      toast.error("Erro ao carregar contas correntes");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
  };

  const filteredContas = contas.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.nif.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas Correntes de Fornecedores</h1>
          <p className="text-muted-foreground">Resumo de saldos e dívidas a fornecedores</p>
        </div>
        <Link href="/compras/faturas">
          <Button variant="outline">Ver Faturas</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total em Dívida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(contas.reduce((sum, c) => sum + c.saldo, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(contas.reduce((sum, c) => sum + c.totalPago, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fornecedores com Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contas.filter(c => c.saldo > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar fornecedor ou NIF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Total Faturado</TableHead>
                  <TableHead className="text-right">Total Pago</TableHead>
                  <TableHead className="text-right">Saldo Devedor</TableHead>
                  <TableHead className="text-center">Faturas Pendentes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.nome}</div>
                      <div className="text-xs text-muted-foreground">NIF: {c.nif}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(c.totalFaturado)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(c.totalPago)}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(c.saldo)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={c.numeroPendentes > 0 ? "destructive" : "secondary"}>
                        {c.numeroPendentes}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/compras/faturas?fornecedorId=${c.id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredContas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum fornecedor encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
