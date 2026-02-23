import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, getApiKeyFromRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const apiKey = getApiKeyFromRequest(request);
  const auth = await validateApiKey(apiKey);

  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const clientes = await db.cliente.findMany({
      where: { ativo: true },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const apiKey = getApiKeyFromRequest(request);
  const auth = await validateApiKey(apiKey);

  if (!auth.valid || auth.apiKey.permissao !== "READ_WRITE") {
    return NextResponse.json({ error: "Não autorizado para escrita" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nome, nif, email } = body;

    if (!nome || !nif) {
      return NextResponse.json({ error: "Nome e NIF são obrigatórios" }, { status: 400 });
    }

    // Gerar código automático se não fornecido
    const ultimoCliente = await db.cliente.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const numeroSequencial = ultimoCliente
      ? parseInt(ultimoCliente.codigo.replace("C", "")) + 1
      : 1;
    const codigo = `C${String(numeroSequencial).padStart(3, "0")}`;

    const cliente = await db.cliente.create({
      data: {
        codigo,
        nome,
        nif,
        email,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
