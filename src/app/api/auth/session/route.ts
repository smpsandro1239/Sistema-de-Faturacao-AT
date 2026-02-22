import { NextResponse } from "next/server";
import { getSession, getSessionFromHeader } from "@/lib/auth";

// GET - Verificar sessão atual
export async function GET(request: Request) {
  try {
    // Tentar obter sessão do header Authorization ou cookie
    let session = await getSessionFromHeader(request);
    
    if (!session) {
      session = await getSession();
    }

    if (!session) {
      return NextResponse.json(
        { authenticated: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        nome: session.nome,
        perfil: session.perfil,
        empresaId: session.empresaId,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return NextResponse.json(
      { authenticated: false, error: "Erro ao verificar sessão" },
      { status: 500 }
    );
  }
}
