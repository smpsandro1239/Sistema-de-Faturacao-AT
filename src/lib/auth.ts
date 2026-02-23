import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, decodeJwt } from "jose";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "faturaat-secret-key-change-in-production";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// Configurações JWT
const JWT_CONFIG = {
  issuer: "faturaat",
  audience: "faturaat-users",
  accessTokenExpiry: "2h",
  refreshTokenExpiry: "7d",
  algorithm: "HS256" as const,
};

export interface JWTPayload {
  userId: string;
  email: string;
  nome: string;
  perfil: string;
  empresaId?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Gera hash da password usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica se a password corresponde ao hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gera um token de acesso JWT usando jose
 */
export async function generateToken(payload: Omit<JWTPayload, "iat" | "exp" | "iss" | "aud">): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    nome: payload.nome,
    perfil: payload.perfil,
    empresaId: payload.empresaId,
  })
    .setProtectedHeader({ alg: JWT_CONFIG.algorithm })
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.issuer)
    .setAudience(JWT_CONFIG.audience)
    .setExpirationTime(JWT_CONFIG.refreshTokenExpiry)
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verifica e decodifica um token JWT
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithms: [JWT_CONFIG.algorithm],
    });

    return payload as JWTPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Decodifica token sem verificar (para debug)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return decodeJwt(token) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extrai o token do header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Define o cookie de sessão
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  });
}

/**
 * Remove o cookie de sessão
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

/**
 * Obtém a sessão atual do utilizador
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Obtém a sessão a partir do header Authorization
 */
export async function getSessionFromHeader(request: Request): Promise<JWTPayload | null> {
  const authHeader = request.headers.get("Authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Valida se o pedido é legítimo (CSRF protection básica via Origin/Referer)
 */
export function validateCSRF(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // Em produção, verificar se origin ou referer pertencem ao host
  if (process.env.NODE_ENV === "production") {
    if (origin && !origin.includes(host!)) return false;
    if (!origin && referer && !referer.includes(host!)) return false;
  }

  return true;
}

/**
 * Middleware helper para verificar autenticação em API routes
 */
export async function authenticateRequest(request: Request): Promise<{
  authenticated: boolean;
  user?: JWTPayload;
  error?: string;
}> {
  // Primeiro tentar obter do header Authorization
  let user = await getSessionFromHeader(request);

  // Se não encontrou no header, tentar obter do cookie
  if (!user) {
    user = await getSession();
  }

  if (!user) {
    return {
      authenticated: false,
      error: "Não autenticado",
    };
  }

  return {
    authenticated: true,
    user,
  };
}

/**
 * Autentica um utilizador e cria sessão
 */
export async function authenticateUser(email: string, password: string): Promise<{
  user: {
    id: string;
    nome: string;
    email: string;
    perfil: string;
  };
  token: string;
} | null> {
  const utilizador = await db.utilizador.findUnique({
    where: { email },
  });

  if (!utilizador || !utilizador.ativo) {
    return null;
  }

  const isValid = await verifyPassword(password, utilizador.passwordHash);

  if (!isValid) {
    return null;
  }

  // Atualizar último acesso
  await db.utilizador.update({
    where: { id: utilizador.id },
    data: { ultimoAcesso: new Date() },
  });

  const payload: Omit<JWTPayload, "iat" | "exp" | "iss" | "aud"> = {
    userId: utilizador.id,
    email: utilizador.email,
    nome: utilizador.nome,
    perfil: utilizador.perfil,
  };

  const token = await generateToken(payload);

  return {
    user: {
      id: utilizador.id,
      nome: utilizador.nome,
      email: utilizador.email,
      perfil: utilizador.perfil,
    },
    token,
  };
}

/**
 * Cria um novo utilizador
 */
export async function criarUtilizador(params: {
  nome: string;
  email: string;
  password: string;
  perfil?: "ADMIN" | "GESTOR" | "OPERADOR" | "CONSULTA";
}): Promise<{ id: string; nome: string; email: string; perfil: string }> {
  const { nome, email, password, perfil = "OPERADOR" } = params;

  // Verificar se email já existe
  const existente = await db.utilizador.findUnique({
    where: { email },
  });

  if (existente) {
    throw new Error("Já existe um utilizador com este email.");
  }

  const passwordHash = await hashPassword(password);

  const utilizador = await db.utilizador.create({
    data: {
      nome,
      email,
      passwordHash,
      perfil,
    },
  });

  return {
    id: utilizador.id,
    nome: utilizador.nome,
    email: utilizador.email,
    perfil: utilizador.perfil,
  };
}

/**
 * Altera a password de um utilizador
 */
export async function alterarPassword(utilizadorId: string, passwordAtual: string, novaPassword: string): Promise<boolean> {
  const utilizador = await db.utilizador.findUnique({
    where: { id: utilizadorId },
  });

  if (!utilizador) {
    throw new Error("Utilizador não encontrado.");
  }

  const isValid = await verifyPassword(passwordAtual, utilizador.passwordHash);

  if (!isValid) {
    throw new Error("Password atual incorreta.");
  }

  const novoHash = await hashPassword(novaPassword);

  await db.utilizador.update({
    where: { id: utilizadorId },
    data: { passwordHash: novoHash },
  });

  return true;
}

/**
 * Verifica se o utilizador tem permissão para uma ação
 */
export function temPermissao(perfilUtilizador: string, acao: string): boolean {
  const permissoes: Record<string, string[]> = {
    ADMIN: ["create", "read", "update", "delete", "emit", "annul", "export", "config"],
    GESTOR: ["create", "read", "update", "delete", "emit", "annul", "export"],
    OPERADOR: ["create", "read", "update", "emit"],
    CONSULTA: ["read"],
  };

  const permissoesUtilizador = permissoes[perfilUtilizador] || [];
  return permissoesUtilizador.includes(acao);
}

/**
 * Verifica se um token está expirado
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  return decoded.exp * 1000 < Date.now();
}

/**
 * Obtém o tempo restante até a expiração do token (em segundos)
 */
export function getTokenTimeToLive(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;

  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  return Math.max(0, ttl);
}
