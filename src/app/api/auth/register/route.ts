import { NextResponse } from "next/server";
import { criarUtilizador } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, password, perfil } = body;

    if (!nome || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e password são obrigatórios." },
        { status: 400 }
      );
    }

    const utilizador = await criarUtilizador({
      nome,
      email,
      password,
      perfil: perfil || "OPERADOR",
    });

    return NextResponse.json({
      success: true,
      utilizador,
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar utilizador:", error);
    
    if (error instanceof Error && error.message.includes("já existe")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar utilizador." },
      { status: 500 }
    );
  }
}
