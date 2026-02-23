"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, FileText, Download, Shield } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function PortalClientePage() {
  const [nif, setNif] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentos, setDocumentos] = useState<any[] | null>(null);

  const buscarDocumentos = async () => {
    if (!nif || nif.length < 9) return toast.error("Introduza um NIF válido");
    setLoading(true);
    try {
      const res = await fetch(`/api/portal?nif=${nif}`);
      if (res.ok) {
        setDocumentos(await res.json());
      } else {
        toast.error("Erro ao procurar documentos");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(valor);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
             <div className="bg-emerald-600 p-3 rounded-xl">
               <Shield className="h-8 w-8 text-white" />
             </div>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900">Portal do Cliente</h1>
          <p className="text-slate-500">Consulte o seu histórico de faturação de forma segura</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aceder aos meus documentos</CardTitle>
            <CardDescription>Introduza o seu NIF para listar as faturas emitidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="NIF (9 dígitos)"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                maxLength={9}
                className="text-lg py-6"
              />
              <Button onClick={buscarDocumentos} disabled={loading} size="lg" className="px-8 bg-emerald-600 hover:bg-emerald-700">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5 mr-2" />}
                Procurar
              </Button>
            </div>
          </CardContent>
        </Card>

        {documentos && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle>Histórico de Faturação</CardTitle>
              <CardDescription>Lista de documentos fiscais emitidos para o NIF {nif}</CardDescription>
            </CardHeader>
            <CardContent>
              {documentos.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Não foram encontrados documentos emitidos para este NIF.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentos.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-bold">{doc.numeroFormatado}</TableCell>
                        <TableCell>{new Date(doc.dataEmissao).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-medium">{formatarMoeda(doc.totalLiquido)}</TableCell>
                        <TableCell>
                          <Link href={`/documentos/${doc.id}`}>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Link href="/">
            <Button variant="link" className="text-slate-500">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
