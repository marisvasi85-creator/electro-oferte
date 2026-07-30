import { NextResponse } from "next/server";
import { createUserClientFromToken, getSupabaseAdmin } from "../../../lib/supabase-admin";
import type { RemoteOffer } from "../../../lib/oferte-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SaveOfferBody = {
  companyId?: string;
  clientId?: string | null;
  offer?: RemoteOffer;
};

async function assertCompanyAccess(userId: string, companyId: string) {
  const admin = getSupabaseAdmin();
  const membership = await admin
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (membership.data) return true;

  const owned = await admin
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (owned.data) {
    await admin.from("company_members").upsert(
      { company_id: companyId, user_id: userId, role: "owner" },
      { onConflict: "company_id,user_id" },
    );
    return true;
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization") || request.headers.get("Authorization");
    if (!auth?.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }
    const accessToken = auth.slice(7).trim();
    if (!accessToken) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const userClient = createUserClientFromToken(accessToken);
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 });
    }
    const userId = userData.user.id;

    const body = (await request.json()) as SaveOfferBody;
    const companyId = body.companyId?.trim();
    const offer = body.offer;
    if (!companyId || !offer?.id || !offer.number) {
      return NextResponse.json({ error: "Payload invalid pentru salvare ofertă." }, { status: 400 });
    }

    const allowed = await assertCompanyAccess(userId, companyId);
    if (!allowed) {
      return NextResponse.json({ error: "Nu ai acces la această firmă." }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    const saved = await admin.from("offers").upsert({
      id: offer.id,
      owner_id: userId,
      company_id: companyId,
      client_id: body.clientId ?? null,
      number: offer.number,
      client_name: offer.client,
      client_details: offer.clientDetails ?? {},
      title: offer.title,
      issue_date: offer.issueDate,
      validity_days: Number(offer.validityDays),
      currency: offer.currency,
      labor: offer.labor,
      labor_options: offer.laborOptions ?? { vatRate: 0, showLine: true },
      discount: offer.discount,
      notes: offer.notes,
      pdf_columns: offer.pdfColumns ?? {
        unit: true,
        quantity: true,
        unitPriceWithoutVat: false,
        unitPrice: true,
        total: true,
        showDiscount: true,
      },
      status: offer.status,
      updated_at: offer.updatedAt,
    }).select("id").single();
    if (saved.error) {
      return NextResponse.json({ error: saved.error.message }, { status: 400 });
    }

    const removed = await admin.from("offer_items").delete().eq("offer_id", offer.id);
    if (removed.error) {
      return NextResponse.json({ error: removed.error.message }, { status: 400 });
    }

    if (offer.items?.length) {
      const inserted = await admin.from("offer_items").insert(offer.items.map((item, index) => ({
        offer_id: offer.id,
        owner_id: userId,
        company_id: companyId,
        catalog_item_id: item.catalogId && !item.catalogId.startsWith("CUS-") ? item.catalogId : null,
        position: index + 1,
        kind: item.kind ?? "material",
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        vat_rate: item.vatRate,
      })));
      if (inserted.error) {
        return NextResponse.json({ error: inserted.error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, id: offer.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Salvarea a eșuat.";
    const status = message.includes("SUPABASE_SERVICE_ROLE_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
