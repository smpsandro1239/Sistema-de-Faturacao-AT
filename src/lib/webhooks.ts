import { db } from "./db";
import { createHmac } from "crypto";

/**
 * Dispara webhooks para um determinado evento
 */
export async function fireWebhooks(evento: string, payload: any) {
  try {
    const empresaId = payload.empresaId;

    const webhooks = await db.webhookConfig.findMany({
      where: {
        ativo: true,
        empresaId,
        OR: [
          { evento },
          { evento: "*" }
        ]
      }
    });

    console.log(`Disparando ${webhooks.length} webhooks para o evento: ${evento}`);

    const promises = webhooks.map(async (webhook) => {
      try {
        const body = JSON.stringify({
          timestamp: new Date().toISOString(),
          evento,
          data: payload
        });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "x-webhook-event": evento,
        };

        if (webhook.secreto) {
          const signature = createHmac("sha256", webhook.secreto)
            .update(body)
            .digest("hex");
          headers["x-webhook-signature"] = `sha256=${signature}`;
        }

        const response = await fetch(webhook.url, {
          method: "POST",
          headers,
          body
        });

        if (!response.ok) {
          console.error(`Falha no webhook ${webhook.id}: ${response.statusText}`);
        }
      } catch (err) {
        console.error(`Erro ao disparar webhook ${webhook.id}:`, err);
      }
    });

    // Não bloqueamos o processo principal, mas queremos que corram
    Promise.all(promises).catch(console.error);
  } catch (error) {
    console.error("Erro ao buscar webhooks:", error);
  }
}
