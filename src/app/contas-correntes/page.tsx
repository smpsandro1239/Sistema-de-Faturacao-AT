"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, ShoppingCart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContasCorrentesPage() {
  const [loading, setLoading] = useState(true);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/contas-correntes");
      const data = await resp.json();

      setFornecedores(data.fornecedores || []);
      setClientes(data.clientes || []);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(valor);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas Correntes</h1>
          <p className="text-muted-foreground">Gestão de saldos de clientes e fornecedores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Total a Pagar (Fornecedores)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(fornecedores.reduce((sum, f) => sum + f.saldo, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Total a Receber (Clientes)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(clientes.reduce((sum, c) => sum + c.saldo, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fornecedores" className="w-full">
        <TabsList>
          <TabsTrigger value="fornecedores" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Fornecedores
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fornecedores">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>NIF</TableHead>
                      <TableHead className="text-center">Faturas Pendentes</TableHead>
                      <TableHead className="text-right font-bold text-red-600">Saldo Devedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedores.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center">Sem faturas pendentes</TableCell></TableRow>
                    ) : (
                      fornecedores.map((f, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{f.nome}</TableCell>
                          <TableCell>{f.nif}</TableCell>
                          <TableCell className="text-center">{f.contagem}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">{formatarMoeda(f.saldo)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>NIF</TableHead>
                      <TableHead className="text-center">Faturas Pendentes</TableHead>
                      <TableHead className="text-right font-bold text-green-600">Saldo a Receber</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center">Sem faturas pendentes</TableCell></TableRow>
                    ) : (
                      clientes.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell>{c.nif}</TableCell>
                          <TableCell className="text-center">{c.contagem}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">{formatarMoeda(c.saldo)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
