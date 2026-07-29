import { createClient } from "@supabase/supabase-js";

function parseSignature(value: string | null) {
  return Object.fromEntries(
    String(value ?? "")
      .split(",")
      .map((part) => part.trim().split("=", 2))
      .filter((part) => part.length === 2),
  );
}

async function hmacHex(secret: string, value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!accessToken || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Webhook não configurado." }, { status: 503 });
  }

  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    data?: { id?: string | number };
  };
  const dataId = String(
    url.searchParams.get("data.id") ?? body.data?.id ?? "",
  ).toLowerCase();
  const requestId = request.headers.get("x-request-id") ?? "";
  const parts = parseSignature(request.headers.get("x-signature"));
  if (!dataId || !requestId || !parts.ts || !parts.v1) {
    return Response.json({ error: "Assinatura ausente." }, { status: 401 });
  }
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expectedSignature = await hmacHex(webhookSecret, manifest);
  if (!timingSafeEqual(expectedSignature, parts.v1)) {
    return Response.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  if (body.type !== "payment" && !url.searchParams.get("type")?.includes("payment")) {
    return Response.json({ received: true });
  }
  const paymentResponse = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!paymentResponse.ok) {
    return Response.json({ error: "Pagamento não localizado." }, { status: 502 });
  }
  const payment = (await paymentResponse.json()) as {
    id?: number | string;
    status?: string;
    external_reference?: string;
    transaction_amount?: number;
  };
  const orderNumber = String(payment.external_reference ?? "");
  if (!orderNumber) return Response.json({ received: true });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,total,status")
    .eq("order_number", orderNumber)
    .single();
  if (orderError || !order) {
    return Response.json({ error: "Pedido não localizado." }, { status: 404 });
  }
  const amountMatches =
    Math.abs(Number(order.total) - Number(payment.transaction_amount ?? 0)) < 0.01;
  if (!amountMatches) {
    return Response.json({ error: "Valor divergente." }, { status: 409 });
  }

  const status =
    payment.status === "approved"
      ? "paid"
      : payment.status === "cancelled" || payment.status === "rejected"
        ? "cancelled"
        : "awaiting_payment";
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status,
      mercadopago_payment_id: String(payment.id ?? dataId),
      pix_txid: payment.status === "approved" ? String(payment.id ?? dataId) : null,
    })
    .eq("id", order.id);
  if (updateError) {
    return Response.json({ error: "Falha ao atualizar pedido." }, { status: 500 });
  }

  return Response.json({ received: true });
}
