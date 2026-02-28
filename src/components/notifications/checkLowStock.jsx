import { base44 } from "@/api/base44Client";

export async function checkAndNotifyLowStock(produto, adminEmail = null) {
  const estoqueAtual = produto.estoque_atual ?? 0;
  const estoqueMinimo = produto.estoque_minimo ?? 5;
  
  if (estoqueAtual > estoqueMinimo) {
    return null;
  }

  // Check if notification already exists for this product (not dismissed)
  const existingNotifications = await base44.entities.NotificacaoEstoque.filter({
    produto_id: produto.id,
    visualizada: false,
  });

  if (existingNotifications.length > 0) {
    // Update existing notification with current stock
    await base44.entities.NotificacaoEstoque.update(existingNotifications[0].id, {
      estoque_atual: estoqueAtual,
    });
    return existingNotifications[0];
  }

  // Create new notification
  const notificacao = await base44.entities.NotificacaoEstoque.create({
    produto_id: produto.id,
    produto_nome: produto.nome,
    estoque_atual: estoqueAtual,
    estoque_minimo: estoqueMinimo,
    email_enviado: false,
    visualizada: false,
  });

  // Send email notification if admin email is provided
  if (adminEmail) {
    await sendLowStockEmail(produto, estoqueAtual, estoqueMinimo, adminEmail);
    await base44.entities.NotificacaoEstoque.update(notificacao.id, {
      email_enviado: true,
    });
  }

  return notificacao;
}

export async function sendLowStockEmail(produto, estoqueAtual, estoqueMinimo, toEmail) {
  const subject = `⚠️ Alerta de Estoque Baixo: ${produto.nome}`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
 
