import { createClient } from "@supabase/supabase-js";

type PreferenceItem = {
  productId: string;
  quantity: number;
  giftWrap?: boolean;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    neighborhood?: string;
    items?: PreferenceItem[];
  };
  const orderNumber = String(body.orderNumber ?? "");
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!/^AE-[A-Z0-9-]{8,40}$/i.test(orderNumber) || !items.length) {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (
    items.some(
      (item) =>
        !uuidPattern.test(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99,
    )
  ) {
    return Response.json({ error: "Itens inválidos." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const productIds = [...new Set(items.map((item) => item.productId))];
  const [productsResult, zoneResult] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,description,price,stock,image_url")
      .in("id", productIds)
      .eq("is_active", true),
    supabase
      .from("delivery_zones")
      .select("fee")
      .eq("name", String(body.neighborhood ?? ""))
      .eq("active", true)
      .maybeSingle(),
  ]);
  if (productsResult.error || productsResult.data?.length !== productIds.length) {
    return Response.json(
      { error: "Um ou mais produtos não estão disponíveis." },
      { status: 409 },
    );
  }

  const products = new Map(
    productsResult.data.map((product) => [String(product.id), product]),
  );
  const preferenceItems: Array<Record<string, unknown>> = [];
  for (const item of items) {
    const product = products.get(item.productId);
    if (!product || Number(product.stock) < item.quantity) {
      return Response.json(
        { error: `Estoque insuficiente para ${product?.name ?? "o produto"}.` },
        { status: 409 },
      );
    }
    preferenceItems.push({
      id: item.productId,
      title: product.name,
      description: product.description ?? undefined,
      picture_url: product.image_url ?? undefined,
      quantity: item.quantity,
      currency_id: "BRL",
      unit_price: Number(product.price),
    });
    if (item.giftWrap) {
      preferenceItems.push({
        id: `gift-wrap-${item.productId}`,
        title: `Embalagem para presente — ${product.name}`,
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: 9.9,
      });
    }
  }
  const deliveryFee = Number(zoneResult.data?.fee ?? 0);
  if (deliveryFee > 0) {
    preferenceItems.push({
      id: "delivery",
      title: `Entrega — ${String(body.neighborhood ?? "")}`,
      quantity: 1,
      currency_id: "BRL",
      unit_price: deliveryFee,
    });
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
        items: preferenceItems,
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
