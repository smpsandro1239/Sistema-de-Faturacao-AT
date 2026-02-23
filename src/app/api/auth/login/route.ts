import { NextResponse } from "next/server";
import { authenticateUser, setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validação com Zod
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Rate limiting: max 5 tentativas por email a cada 15 minutos
    if (email && !rateLimit(`login:${email}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiadas tentativas de login. Por favor, aguarde 15 minutos." },
        { status: 429 }
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
