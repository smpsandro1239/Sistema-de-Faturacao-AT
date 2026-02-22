import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

// POST - Terminar sessão (logout)
export async function POST() {
  try {
    // Limpar cookie de sessão
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Sessão terminada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao terminar sessão:", error);
    return NextResponse.json(
      { error: "Erro ao terminar sessão" },
      { status: 500 }
    );
  }
}
