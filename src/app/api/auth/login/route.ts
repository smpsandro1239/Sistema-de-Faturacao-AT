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

    // Rate limiting
    if (email && !rateLimit(`login:${email}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiadas tentativas de login. Por favor, aguarde 15 minutos." },
        { status: 429 }
      );
    }

    // Diagnóstico de Base de Dados
    try {
      const count = await db.utilizador.count();

      if (count === 0) {
        return NextResponse.json(
          { error: "O sistema não tem utilizadores. Por favor, utilize o botão 'INICIALIZAR DADOS DEMO' acima." },
          { status: 401 }
        );
      }
    } catch (dbError: any) {
      console.error("[LOGIN] Erro DB:", dbError);

      let friendlyError = "Erro ao contactar a base de dados.";

      if (dbError.message?.includes("Unable to open the database file")) {
        friendlyError = "Erro de escrita no servidor (Filesystem Read-only). É recomendável configurar uma base de dados externa (PostgreSQL) na Vercel.";
      } else if (dbError.message?.includes("DATABASE_URL")) {
        friendlyError = "Variável DATABASE_URL não configurada ou inválida.";
      } else if (dbError.message?.includes("table") || dbError.message?.includes("relation")) {
        friendlyError = "Estrutura de tabelas não encontrada. A base de dados precisa de ser sincronizada.";
      }

      return NextResponse.json(
        { error: friendlyError, details: dbError.message },
        { status: 500 }
      );
    }

    const result = await authenticateUser(email, password);

    if (!result) {
      return NextResponse.json(
        { error: "Email ou password incorretos." },
        { status: 401 }
      );
    }

    await setSessionCookie(result.token);

    return NextResponse.json({
      success: true,
      utilizador: result.user,
      token: result.token,
    });
  } catch (error: any) {
    console.error("[LOGIN] Erro Crítico:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
