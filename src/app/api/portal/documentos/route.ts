import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nif = searchParams.get("nif");
    const key = searchParams.get("key");

    if (!nif || !key) {
      return NextResponse.json({ error: "NIF e Chave de Acesso são obrigatórios" }, { status: 400 });
    }

    // Validar se existe algum documento com este NIF e Chave de Acesso
    const docValidacao = await db.documento.findFirst({
      where: {
        clienteNif: nif,
        accessKey: key
      }
    });

    if (!docValidacao) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Se válido, retornar todos os documentos deste cliente
    const documentos = await db.documento.findMany({
      where: { clienteNif: nif },
      orderBy: { dataEmissao: 'desc' },
      select: {
        id: true,
        numeroFormatado: true,
        tipo: true,
        dataEmissao: true,
        totalLiquido: true,
        estado: true,
        estadoPagamento: true,
        accessKey: true
      }
    });

    return NextResponse.json(documentos);
  } catch (error) {
    console.error("Erro no portal do cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
