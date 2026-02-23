import { db } from "./db";

/**
 * Valida uma chave de API
 */
export async function validateApiKey(key: string | null): Promise<{
  valid: boolean;
  apiKey?: any;
  error?: string;
}> {
  if (!key) {
    return { valid: false, error: "Chave de API não fornecida" };
  }

  const apiKey = await db.apiKey.findUnique({
    where: { key, ativo: true },
  });

  if (!apiKey) {
    return { valid: false, error: "Chave de API inválida ou inativa" };
  }

  // Atualizar última utilização (async background)
  db.apiKey.update({
    where: { id: apiKey.id },
    data: { ultimaUtilizacao: new Date() },
  }).catch(console.error);

  return { valid: true, apiKey };
}

/**
 * Helper para extrair a chave do header x-api-key
 */
export function getApiKeyFromRequest(request: Request): string | null {
  return request.headers.get("x-api-key");
}
