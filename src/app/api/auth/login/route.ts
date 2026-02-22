import { NextResponse } from "next/server";
import { authenticateUser, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e password são obrigatórios." },
        { status: 400 }
      );
    }

    const result = await authenticateUser(email, password);

    if (!result) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    // Definir cookie de sessão com JWT
    await setSessionCookie(result.token);

    return NextResponse.json({
      success: true,
      utilizador: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro ao processar login." },
      { status: 500 }
    );
  }
}
