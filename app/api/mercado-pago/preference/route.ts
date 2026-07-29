import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!accessToken) {
    return Response.json(
      {
        code: "mercado_pago_not_configured",
        error: "O Mercado Pago aguarda a credencial privada da loja.",
      },
      { status: 503 },
    );
  }
  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const body = (await request.json()) as {
    orderNumber?: string;
    customer?: { name?: string; phone?: string };
  };
  const orderNumber = String(body.orderNumber ?? "");
  if (!/^AE-[A-Z0-9-]{8,40}$/i.test(orderNumber)) {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: quote, error: quoteError } = await supabase.rpc(
    "get_order_payment_quote",
    { order_number_value: orderNumber },
  );
  if (quoteError || !quote) {
    return Response.json(
      { error: quoteError?.message || "Pedido não encontrado." },
      { status: 404 },
    );
  }

  const quoteTotal = Number(quote.total);
  const itemCount = Number(quote.item_count ?? 0);
  if (!Number.isFinite(quoteTotal) || quoteTotal <= 0 || itemCount < 1) {
    return Response.json({ error: "Valor do pedido inválido." }, { status: 409 });
  }

  const configuredSiteUrl =
    process.env.SITE_URL || process.env.URL || new URL(request.url).origin;
  const siteUrl = configuredSiteUrl.replace(/\/$/, "");
  const response = await fetch(
    "https://api.mercadopago.com/checkout/preferences",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": orderNumber,
      },
      body: JSON.stringify({
        items: [
          {
            id: orderNumber,
            title: `Pedido ${orderNumber} • ${itemCount} item(ns)`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: quoteTotal,
          },
        ],
        payer: {
          name: String(body.customer?.name ?? "").slice(0, 120),
          phone: { number: String(body.customer?.phone ?? "").replace(/\D/g, "") },
        },
        external_reference: orderNumber,
        statement_descriptor: "ANDORA ESSENCE",
        back_urls: {
          success: `${siteUrl}/?pagamento=aprovado&pedido=${encodeURIComponent(orderNumber)}`,
          pending: `${siteUrl}/?pagamento=pendente&pedido=${encodeURIComponent(orderNumber)}`,
          failure: `${siteUrl}/?pagamento=nao-concluido&pedido=${encodeURIComponent(orderNumber)}`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/mercado-pago/webhook`,
      }),
    },
  );
  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    console.error("Mercado Pago preference error", response.status, result);
    return Response.json(
      { error: "Não foi possível iniciar o pagamento agora." },
      { status: 502 },
    );
  }

  return Response.json({
    id: result.id,
    checkoutUrl: result.init_point,
    sandboxCheckoutUrl: result.sandbox_init_point,
  });
}
