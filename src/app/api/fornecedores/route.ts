import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

// GET - Listar fornecedores
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.user?.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const ativo = searchParams.get("ativo");

    const skip = (page - 1) * limit;

    const where = {
      empresaId: auth.user.empresaId,
      ...(search && {
        OR: [
          { nome: { contains: search } },
          { nif: { contains: search } },
          { codigo: { contains: search } },
        ],
      }),
      ...(ativo !== null && { ativo: ativo === "true" }),
    };

    const [fornecedores, total] = await Promise.all([
      db.fornecedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: "asc" },
      }),
      db.fornecedor.count({ where }),
    ]);

    return NextResponse.json({
      fornecedores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar fornecedores:", error);
    return NextResponse.json(
      { error: "Erro ao listar fornecedores" },
      { status: 500 }
    );
  }
}

// POST - Criar fornecedor
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.user?.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Validar NIF (9 dígitos)
    if (data.nif && !/^\d{9}$/.test(data.nif)) {
      return NextResponse.json(
        { error: "NIF inválido. Deve conter 9 dígitos." },
        { status: 400 }
      );
    }

    // Verificar se já existe NIF ou código na mesma empresa
    const existente = await db.fornecedor.findFirst({
      where: {
        empresaId: auth.user.empresaId,
        OR: [{ nif: data.nif }, { codigo: data.codigo }],
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Já existe um fornecedor com este NIF ou código." },
        { status: 400 }
      );
    }

    const fornecedor = await db.fornecedor.create({
      data: {
        empresaId: auth.user.empresaId,
        codigo: data.codigo,
        nome: data.nome,
        nif: data.nif,
        morada: data.morada || null,
        codigoPostal: data.codigoPostal || null,
        localidade: data.localidade || null,
        pais: data.pais || "PT",
        telefone: data.telefone || null,
        email: data.email || null,
        website: data.website || null,
        iban: data.iban || null,
        contactoNome: data.contactoNome || null,
        observacoes: data.observacoes || null,
      },
    });

    return NextResponse.json(fornecedor, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    return NextResponse.json(
      { error: "Erro ao criar fornecedor" },
      { status: 500 }
    );
  }
}
