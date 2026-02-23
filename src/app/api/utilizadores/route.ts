import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, authenticateRequest, temPermissao } from "@/lib/auth";

// GET - Listar utilizadores
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const utilizadores = await db.utilizador.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        ultimoAcesso: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(utilizadores);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar utilizadores" }, { status: 500 });
  }
}

// POST - Criar utilizador
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !temPermissao(auth.user!.perfil, "config")) {
      return NextResponse.json({ error: "Permissões insuficientes" }, { status: 403 });
    }

    const body = await request.json();
    const { nome, email, password, perfil } = body;

    if (!nome || !email || !password) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const utilizador = await db.utilizador.create({
      data: {
        nome,
        email,
        passwordHash,
        perfil: perfil || "OPERADOR",
      }
    });

    return NextResponse.json({ id: utilizador.id, email: utilizador.email }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Este email já está registado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
