import { getSupabase, isSupabaseConfigured } from "./supabase";
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  type: string;
  cost: number;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  badge?: string;
  adult?: boolean;
  description: string;
};

export type Publication = {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
  image?: string;
};

export type PosItem = Product & { quantity: number };
export type PaymentMethod = "Dinheiro" | "Pix" | "Débito" | "Crédito";
export type Sale = {
  id: string;
  createdAt: string;
  items: PosItem[];
  revenue: number;
  cost: number;
  profit: number;
  payments: { method: PaymentMethod; amount: number }[];
  status: "Pago" | "Pendente";
  customer?: string;
  dueDate?: string;
};

export type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  recurring: boolean;
};

export type Withdrawal = {
  id: string;
  reason: string;
  amount: number;
  time: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function productFromRow(row: Record<string, any>): Product {
  const category = Array.isArray(row.categories)
    ? row.categories[0]?.name
    : row.categories?.name;
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    category: category ?? row.category_name ?? "Outros",
    brand: row.brand ?? "",
    type: row.product_type ?? "",
    cost: Number(row.cost_price ?? 0),
    price: Number(row.price ?? 0),
    oldPrice:
      row.compare_at_price === null || row.compare_at_price === undefined
        ? undefined
        : Number(row.compare_at_price),
    stock: Number(row.stock ?? 0),
    image: row.image_url ?? "",
    badge: row.badge ?? undefined,
    adult: Boolean(row.adult_only ?? row.categories?.adult_only),
    description: row.description ?? "",
  };
}

function publicationFromRow(row: Record<string, any>): Publication {
  return {
    id: String(row.id),
    title: row.title,
    subtitle: row.subtitle ?? "",
    theme: row.theme ?? "Campanha personalizada",
    active: Boolean(row.is_published),
    startsAt: row.starts_at?.slice(0, 10) ?? "",
    endsAt: row.ends_at?.slice(0, 10) ?? "",
    image: row.image_url ?? undefined,
  };
}

export async function loadStorefront() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const [productsResult, publicationsResult] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(name, adult_only)")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("publications")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);
  if (productsResult.error) throw productsResult.error;
  if (publicationsResult.error) throw publicationsResult.error;
  return {
    products: (productsResult.data ?? []).map(productFromRow),
    publications: (publicationsResult.data ?? []).map(publicationFromRow),
  };
}

export async function signInAdmin(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase ainda não está configurado.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  const { data: allowed, error: permissionError } =
    await supabase.rpc("is_admin");
  if (permissionError || !allowed) {
    await supabase.auth.signOut();
    throw new Error("Este usuário não possui acesso administrativo.");
  }
  return data.session;
}

export async function registerAdmin(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase ainda não está configurado.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/admin` },
  });
  if (error) throw error;
  return data;
}

export async function hasAdminSession() {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  const { data: allowed } = await supabase.rpc("is_admin");
  return Boolean(allowed);
}

export async function signOutAdmin() {
  await getSupabase()?.auth.signOut();
}

async function resolveCategory(name: string, adultOnly: boolean) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { data, error } = await supabase
    .from("categories")
    .upsert(
      { name, slug: slugify(name), adult_only: adultOnly },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function uploadDataImage(
  dataUrl: string,
  bucket: "product-images" | "campaign-images",
) {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const blob = await fetch(dataUrl).then((response) => response.blob());
  const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function saveProduct(product: Product) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const categoryId = await resolveCategory(
    product.category,
    Boolean(product.adult),
  );
  const imageUrl = await uploadDataImage(product.image, "product-images");
  const record = {
    code: product.code.trim().toUpperCase(),
    category_id: categoryId,
    name: product.name,
    slug: `${slugify(product.name)}-${product.code.toLowerCase()}`,
    brand: product.brand,
    product_type: product.type,
    description: product.description,
    cost_price: product.cost,
    price: product.price,
    compare_at_price: product.oldPrice ?? null,
    stock: product.stock,
    image_url: imageUrl,
    badge: product.badge ?? null,
    adult_only: Boolean(product.adult),
    is_promotion: Boolean(product.oldPrice),
    is_active: true,
  };
  const query = product.id.startsWith("new-") || product.id.startsWith("seed-")
    ? supabase.from("products").insert(record)
    : supabase.from("products").update(record).eq("id", product.id);
  const { data, error } = await query
    .select("*, categories(name, adult_only)")
    .single();
  if (error) throw error;
  return productFromRow(data);
}

export async function deleteProduct(id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function savePublication(publication: Publication) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const imageUrl = publication.image
    ? await uploadDataImage(publication.image, "campaign-images")
    : null;
  const record = {
    title: publication.title,
    subtitle: publication.subtitle,
    theme: publication.theme,
    image_url: imageUrl,
    starts_at: publication.startsAt || null,
    ends_at: publication.endsAt || null,
    is_published: publication.active,
  };
  const query =
    publication.id.startsWith("new-") ||
    publication.id.startsWith("seed-")
    ? supabase.from("publications").insert(record)
    : supabase.from("publications").update(record).eq("id", publication.id);
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return publicationFromRow(data);
}

export async function setPublicationState(id: string, active: boolean) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { error } = await supabase
    .from("publications")
    .update({ is_published: active })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePublication(id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { error } = await supabase.from("publications").delete().eq("id", id);
  if (error) throw error;
}

export async function loadAdminData() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const [sales, expenses, withdrawals] = await Promise.all([
    supabase
      .from("sales")
      .select("*, sale_items(*), sale_payments(*)")
      .order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").order("expense_date", {
      ascending: false,
    }),
    supabase
      .from("cash_withdrawals")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);
  if (sales.error) throw sales.error;
  if (expenses.error) throw expenses.error;
  if (withdrawals.error) throw withdrawals.error;
  return {
    sales: (sales.data ?? []).map((row: Record<string, any>) => ({
      id: row.sale_number,
      createdAt: row.created_at,
      items: (row.sale_items ?? []).map((item: Record<string, any>) => ({
        id: String(item.product_id),
        code: item.product_code,
        name: item.product_name,
        category: "",
        brand: "",
        type: "",
        cost: Number(item.unit_cost),
        price: Number(item.unit_price),
        stock: 0,
        image: "",
        description: "",
        quantity: Number(item.quantity),
      })),
      revenue: Number(row.revenue),
      cost: Number(row.cost),
      profit: Number(row.profit),
      payments: (row.sale_payments ?? []).map(
        (payment: Record<string, any>) => ({
          method: payment.method as PaymentMethod,
          amount: Number(payment.amount),
        }),
      ),
      status: row.status === "pending" ? "Pendente" : "Pago",
      customer: row.customer_name ?? undefined,
      dueDate: row.due_date ?? undefined,
    })) as Sale[],
    expenses: (expenses.data ?? []).map((row: Record<string, any>) => ({
      id: String(row.id),
      description: row.description,
      category: row.category,
      amount: Number(row.amount),
      date: row.expense_date,
      recurring: Boolean(row.is_recurring),
    })) as Expense[],
    withdrawals: (withdrawals.data ?? []).map(
      (row: Record<string, any>) => ({
        id: String(row.id),
        reason: row.reason,
        amount: Number(row.amount),
        time: new Date(row.created_at).toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }),
      }),
    ) as Withdrawal[],
  };
}

export async function completeSale(sale: Sale) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { error } = await supabase.rpc("complete_pos_sale", {
    payload: {
      sale_number: sale.id,
      status: sale.status === "Pendente" ? "pending" : "paid",
      customer_name: sale.customer ?? null,
      due_date: sale.dueDate ?? null,
      revenue: sale.revenue,
      cost: sale.cost,
      profit: sale.profit,
      items: sale.items.map((item) => ({
        product_id: item.id,
        product_code: item.code,
        product_name: item.name,
        unit_price: item.price,
        unit_cost: item.cost,
        quantity: item.quantity,
      })),
      payments: sale.payments.map((payment) => ({
        method: payment.method,
        amount: payment.amount,
      })),
    },
  });
  if (error) throw error;
}

export async function createExpense(input: Omit<Expense, "id">) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      description: input.description,
      category: input.category,
      amount: input.amount,
      expense_date: input.date,
      is_recurring: input.recurring,
    })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    description: data.description,
    category: data.category,
    amount: Number(data.amount),
    date: data.expense_date,
    recurring: Boolean(data.is_recurring),
  } satisfies Expense;
}

export async function createWithdrawal(
  input: Omit<Withdrawal, "id" | "time">,
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { data, error } = await supabase
    .from("cash_withdrawals")
    .insert({ reason: input.reason, amount: input.amount })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    reason: data.reason,
    amount: Number(data.amount),
    time: "Agora",
  } satisfies Withdrawal;
}

export async function createCustomer(input: {
  name: string;
  phone: string;
  address: string;
  birthday?: string;
  preference?: string;
  acceptsWhatsapp: boolean;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { error } = await supabase.from("customers").upsert(
    {
      name: input.name,
      phone: input.phone,
      address: input.address,
      birthday: input.birthday || null,
      preferences: input.preference ? [input.preference] : [],
      accepts_whatsapp: input.acceptsWhatsapp,
    },
    { onConflict: "phone" },
  );
  if (error) throw error;
}

export { isSupabaseConfigured };
