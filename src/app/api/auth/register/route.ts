import { NextResponse } from "next/server";
import { criarUtilizador } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

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

    // Rate limiting: max 3 registos por IP a cada hora
    if (!rateLimit(`register:ip`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiadas tentativas de registo. Por favor, tente mais tarde." },
        { status: 429 }
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
