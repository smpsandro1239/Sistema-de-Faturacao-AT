import { NextResponse } from "next/server";
import { authenticateUser, setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";
import { db } from "@/lib/db";

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

    // Logging para debug em produção
    console.log(`Tentativa de login para: ${email}`);

    // Verificar se existem utilizadores na BD
    const count = await db.utilizador.count();
    console.log(`Total de utilizadores na BD: ${count}`);

    const result = await authenticateUser(email, password);

    if (!result) {
      console.warn(`Falha na autenticação para: ${email}`);
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    console.log(`Login bem-sucedido para: ${email}`);

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
      { error: "Erro ao processar login na base de dados. Verifique a ligação." },
      { status: 500 }
    );
  }
}
