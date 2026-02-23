import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "faturaat-secret-key-change-in-production";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = [
  "/login",
  "/api/auth/login",
  "/api/portal", // O portal público já tem a sua própria lógica de accessKey
  "/portal",
  "/icons",
  "/manifest.json",
  "/logo.svg"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Tentar obter o token do cookie ou header
  const token = request.cookies.get("session")?.value ||
                request.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    // Se for API, retornar 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    // Se for página, redirecionar para login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Validar JWT
    await jwtVerify(token, SECRET_KEY);
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware Auth Error:", error);

    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Sessão expirada ou inválida" }, { status: 401 });
    }

    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
