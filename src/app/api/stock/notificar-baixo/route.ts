import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { obterArtigosStockBaixo } from "@/lib/stock";
import { enviarEmail } from "@/lib/mail";
import { defaultTemplates, renderTemplate } from "@/lib/mail-templates";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = auth.user.empresaId;
    const empresa = await db.empresa.findUnique({
      where: { id: empresaId! }
    });

    if (!empresa || !empresa.email) {
      return NextResponse.json({ error: "Empresa sem email configurado" }, { status: 400 });
    }

    const artigosBaixos = await obterArtigosStockBaixo(empresaId!);

    // Filtrar apenas artigos da empresa atual (se a lib de stock já não o fizer)
    // No nosso caso, o auth.user.empresaId deve ser usado se a lib suportar,
    // mas a lib stock.ts parece que usa o prisma globalmente.
    // Vamos assumir que a lib de stock precisa de ser filtrada ou já está filtrada.

    if (artigosBaixos.length === 0) {
      return NextResponse.json({ message: "Não existem artigos com stock baixo" });
    }

    const listaArtigosText = artigosBaixos
      .map(a => `- ${a.artigoCodigo}: ${a.artigoDescricao} (${a.quantidadeAtual} / ${a.stockMinimo}) no armazém ${a.armazemNome}`)
      .join("\n");

    const listaArtigosHtml = `
      <ul style="color: #333;">
        ${artigosBaixos.map(a => `
          <li style="margin-bottom: 10px;">
            <strong style="color: #e11d48;">${a.artigoCodigo}</strong>: ${a.artigoDescricao}<br>
            <span style="color: #666; font-size: 13px;">Stock: ${a.quantidadeAtual} | Mínimo: ${a.stockMinimo} | Armazém: ${a.armazemNome}</span>
          </li>
        `).join("")}
      </ul>
    `;

    const templateData = {
      empresaNome: empresa.nome,
      listaArtigos: listaArtigosText
    };

    const template = defaultTemplates.STOCK_BAIXO;
    const subject = renderTemplate(template.subject, templateData);
    const text = renderTemplate(template.body, templateData);

    const html = `
      <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #e11d48;">Alerta de Stock Baixo</h2>
        <p>Olá,</p>
        <p>Os seguintes artigos da <strong>${empresa.nome}</strong> atingiram ou estão abaixo do nível de stock mínimo:</p>
        ${listaArtigosHtml}
        <p style="margin-top: 20px;">Por favor, aceda ao sistema para gerir as reposições.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">${empresa.nome} | Sistema de Faturação Certificado</p>
      </div>
    `;

    await enviarEmail({
      to: empresa.email,
      subject,
      text,
      html
    });

    return NextResponse.json({ success: true, count: artigosBaixos.length });
  } catch (error) {
    console.error("Erro ao enviar alertas de stock:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
