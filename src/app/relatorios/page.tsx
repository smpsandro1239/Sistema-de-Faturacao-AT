"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, Table as TableIcon, Calendar, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(false);
  const [datas, setDatas] = useState({
    inicio: "",
    fim: "",
  });

  const handleExport = async (tipo: "vendas" | "stock", formato: "xlsx" | "csv" = "xlsx") => {
    setLoading(true);
    try {
      let fetchUrl = "";
      let filename = "";

      if (tipo === "vendas") {
        const params = new URLSearchParams({
          inicio: datas.inicio,
          fim: datas.fim,
          formato: formato,
        });
        fetchUrl = `/api/relatorios/exportar?${params.toString()}`;
        filename = `relatorio-vendas.${formato}`;
      } else if (tipo === "stock") {
        fetchUrl = `/api/relatorios/stock`;
        filename = `mapa-de-stocks.xlsx`;
      }

      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Erro ao gerar ficheiro");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Relatório ${formato.toUpperCase()} gerado!`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Relatórios e Exportação</h1>
        <p className="text-slate-500">Extração de dados para contabilidade e gestão</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-emerald-600" />
              Listagem de Vendas
            </CardTitle>
            <CardDescription>Exportar todos os documentos emitidos num período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={datas.inicio}
                  onChange={(e) => setDatas({ ...datas, inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Fim</Label>
                <Input
                  type="date"
                  value={datas.fim}
                  onChange={(e) => setDatas({ ...datas, fim: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => handleExport("vendas", "xlsx")}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                Exportar Excel
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => handleExport("vendas", "csv")}
                disabled={loading}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Inventário e Stocks
            </CardTitle>
            <CardDescription>Exportar mapa de stock atual por armazém</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">
              Este relatório gera um ficheiro Excel com todos os artigos que possuem controlo de stock,
              listando a quantidade atual, reservada e disponível em cada armazém.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleExport("stock")}
              disabled={loading}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar Mapa de Stocks (Excel)
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-dashed border-2">
          <CardHeader>
            <CardTitle className="text-slate-400">Outros Relatórios (Em Breve)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Resumo de IVA trimestral
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Rentabilidade por Artigo
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
