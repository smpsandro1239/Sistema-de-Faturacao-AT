import { NextResponse } from "next/server";
import { authenticateUser, setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Rate limiting: max 5 tentativas por email a cada 15 minutos
    if (email && !rateLimit(`login:${email}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiadas tentativas de login. Por favor, aguarde 15 minutos." },
        { status: 429 }
      );
    }

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
