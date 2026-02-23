"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  X,
  CheckCircle2,
  AlertCircle,
  Package
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";

// Types
interface Artigo {
  id: string;
  codigo: string;
  descricao: string;
  precoUnitario: number;
  taxaIVAPercentagem: number;
}

interface ItemCarrinho extends Artigo {
  quantidade: number;
}

export default function POSPage() {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [filtro, setFiltro] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState(""); // Default/Consumidor Final
  const [metodoPagamento, setMetodoPagamento] = useState("NUMERARIO");

  // Fetch artigos e clientes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artigosRes, clientesRes, seriesRes] = await Promise.all([
          fetch("/api/artigos"),
          fetch("/api/clientes"),
          fetch("/api/series")
        ]);

        const artigosData = await artigosRes.json();
        const clientesData = await clientesRes.json();
        const seriesData = await seriesRes.json();

        setArtigos(artigosData.filter((a: any) => a.ativo));
        setClientes(clientesData);
        setSeries(seriesData);

        // Tentar encontrar cliente "Consumidor Final" por defeito
        const consumidorFinal = clientesData.find((c: any) => c.nif === "999999990" || c.nome.includes("Consumidor Final"));
        if (consumidorFinal) setClienteId(consumidorFinal.id);

        setLoading(false);
      } catch (error) {
        toast.error("Erro ao carregar dados do sistema");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const artigosFiltrados = artigos.filter(a =>
    a.descricao.toLowerCase().includes(filtro.toLowerCase()) ||
    a.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  const adicionarAoCarrinho = (artigo: Artigo) => {
    const existe = carrinho.find(item => item.id === artigo.id);
    if (existe) {
      setCarrinho(carrinho.map(item =>
        item.id === artigo.id ? { ...item, quantidade: item.quantidade + 1 } : item
      ));
    } else {
      setCarrinho([...carrinho, { ...artigo, quantidade: 1 }]);
    }
  };

  const removerDoCarrinho = (id: string) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
  };

  const atualizarQuantidade = (id: string, delta: number) => {
    setCarrinho(carrinho.map(item => {
      if (item.id === id) {
        const novaQtd = Math.max(1, item.quantidade + delta);
        return { ...item, quantidade: novaQtd };
      }
      return item;
    }));
  };

  const total = carrinho.reduce((acc, item) => acc + (item.precoUnitario * item.quantidade), 0);

  const finalizarVenda = async () => {
    if (carrinho.length === 0) return toast.error("Carrinho vazio");
    if (!clienteId) return toast.error("Selecione um cliente");

    // Encontrar série para Fatura-Recibo ou Fatura
    const seriePos = series.find(s => s.tipoDocumento === "FATURA_RECIBO" && s.ativo) ||
                   series.find(s => s.tipoDocumento === "FATURA" && s.ativo);

    if (!seriePos) return toast.error("Nenhuma série de faturação disponível");

    setProcessando(true);

    try {
      const payload = {
        serieId: seriePos.id,
        clienteId,
        tipo: seriePos.tipoDocumento,
        linhas: carrinho.map(item => ({
          artigoId: item.id,
          codigoArtigo: item.codigo,
          descricaoArtigo: item.descricao,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          desconto: 0,
          taxaIVAPercentagem: item.taxaIVAPercentagem,
        })),
        metodoPagamento
      };

      const res = await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao criar documento");

      const documento = await res.json();

      // Se for POS, emitimos logo o documento (calculando hash)
      const resEmitir = await fetch("/api/documentos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: documento.id }),
      });

      if (!resEmitir.ok) throw new Error("Erro ao emitir documento");

      toast.success("Venda concluída e faturada com sucesso!");
      setCarrinho([]);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar venda");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      {/* Esquerda: Grelha de Artigos */}
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">POS</h1>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Pesquisar por nome ou código..."
              className="pl-10 bg-white"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </header>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
              {artigosFiltrados.map(artigo => (
                <Card
                  key={artigo.id}
                  className="cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                  onClick={() => adicionarAoCarrinho(artigo)}
                >
                  <CardContent className="p-4 flex flex-col h-full justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-mono">{artigo.codigo}</p>
                      <h3 className="font-semibold text-slate-800 line-clamp-2 leading-tight mt-1">{artigo.descricao}</h3>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                      <span className="text-lg font-bold text-emerald-600">{artigo.precoUnitario.toFixed(2)}€</span>
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {artigosFiltrados.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-500">
                  <Package className="w-12 h-12 mx-auto opacity-20 mb-2" />
                  <p>Nenhum artigo encontrado.</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Direita: Carrinho e Pagamento */}
      <div className="w-full lg:w-[450px] bg-white border-t lg:border-t-0 lg:border-l shadow-2xl flex flex-col h-[40vh] lg:h-full">
        <div className="p-4 border-b bg-slate-900 text-white flex justify-between items-center sticky top-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="font-bold">Carrinho Atual</h2>
          </div>
          <Badge variant="secondary" className="bg-slate-700 text-white border-none">
            {carrinho.length} Itens
          </Badge>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {carrinho.map(item => (
              <div key={item.id} className="flex gap-3 items-start border-b pb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800 leading-tight">{item.descricao}</h4>
                  <p className="text-sm text-slate-500 mt-1">{item.precoUnitario.toFixed(2)}€ / un</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center border rounded-md h-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none"
                      onClick={() => atualizarQuantidade(item.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantidade}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none"
                      onClick={() => atualizarQuantidade(item.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700"
                    onClick={() => removerDoCarrinho(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {carrinho.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto opacity-10 mb-2" />
                <p>O carrinho está vazio.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 bg-slate-50 border-t space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{(total / 1.23).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA (23%)</span>
              <span>{(total - (total / 1.23)).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-slate-900 pt-2 border-t">
              <span>TOTAL</span>
              <span>{total.toFixed(2)}€</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant={metodoPagamento === "NUMERARIO" ? "default" : "outline"}
              className={metodoPagamento === "NUMERARIO" ? "bg-emerald-600" : ""}
              onClick={() => setMetodoPagamento("NUMERARIO")}
            >
              <Banknote className="w-4 h-4 mr-2" /> Numerário
            </Button>
            <Button
              variant={metodoPagamento === "CARTAO" ? "default" : "outline"}
              className={metodoPagamento === "CARTAO" ? "bg-emerald-600" : ""}
              onClick={() => setMetodoPagamento("CARTAO")}
            >
              <CreditCard className="w-4 h-4 mr-2" /> Cartão
            </Button>
          </div>

          <Button
            className="w-full h-16 text-lg font-bold bg-emerald-600 hover:bg-emerald-700"
            disabled={carrinho.length === 0 || processando}
            onClick={finalizarVenda}
          >
            {processando ? "Processando..." : `FINALIZAR PAGAMENTO (${total.toFixed(2)}€)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
