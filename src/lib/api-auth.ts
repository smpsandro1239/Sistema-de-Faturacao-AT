import { db } from "./db";

/**
 * Valida uma chave de API
 */
export async function validateApiKey(key: string | null): Promise<{
  valid: boolean;
  apiKey?: any;
  empresaId?: string;
  error?: string;
}> {
  if (!key) {
    return { valid: false, error: "Chave de API não fornecida" };
  }

  const apiKey = await db.apiKey.findUnique({
    where: { key, ativo: true },
    include: { empresa: true }
  });

  if (!apiKey || !apiKey.empresaId) {
    return { valid: false, error: "Chave de API inválida, inativa ou sem empresa associada" };
  }

  // Atualizar última utilização (async background)
  db.apiKey.update({
    where: { id: apiKey.id },
    data: { ultimaUtilizacao: new Date() },
  }).catch(console.error);

  return { valid: true, apiKey, empresaId: apiKey.empresaId };
}

/**
 * Helper para extrair a chave do header x-api-key
 */
export function getApiKeyFromRequest(request: Request): string | null {
  return request.headers.get("x-api-key");
}
