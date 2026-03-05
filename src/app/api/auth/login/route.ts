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

    console.log(`[LOGIN] Tentativa para: ${email}`);

    // Testar ligação à BD e verificar se está inicializada
    let count = 0;
    try {
      count = await db.utilizador.count();
      console.log(`[LOGIN] Utilizadores detetados: ${count}`);
    } catch (dbError: any) {
      console.error("[LOGIN] Erro de Base de Dados:", dbError);

      let errorMsg = "A base de dados não está acessível.";
      if (dbError.message?.includes("DATABASE_URL")) {
        errorMsg = "Configuração em falta: Variável DATABASE_URL não definida.";
      } else if (dbError.message?.includes("table") || dbError.message?.includes("relation")) {
        errorMsg = "As tabelas não foram criadas. Execute 'npx prisma db push'.";
      }

      return NextResponse.json(
        { error: errorMsg, details: dbError.message },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { error: "Sistema não inicializado. Clique em 'INICIALIZAR DADOS DEMO' acima." },
        { status: 401 }
      );
    }

    const result = await authenticateUser(email, password);

    if (!result) {
      return NextResponse.json(
        { error: "Email ou password incorretos." },
        { status: 401 }
      );
    }

    // Definir cookie de sessão
    await setSessionCookie(result.token);

    return NextResponse.json({
      success: true,
      utilizador: result.user,
      token: result.token,
    });
  } catch (error: any) {
    console.error("[LOGIN] Erro crítico:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor de autenticação." },
      { status: 500 }
    );
  }
}
