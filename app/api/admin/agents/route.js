import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list agents
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search") || "";
    const agent_type = searchParams.get("agent_type");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort"); // commission_desc | commission_asc
    const all = searchParams.get("all") === "true";

    let query = supabaseAdmin
      .from("agents")
      .select(
        "id, name, agent_type, commission_rate, phone, status, created_at",
        { count: "exact" }
      );

    // 🔍 search (name / phone)
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // 🎯 filter
    if (agent_type) query = query.eq("agent_type", agent_type);
    if (status) query = query.eq("status", status);

    // 🔃 sort
    if (sort === "commission_desc") {
      query = query.order("commission_rate", { ascending: false });
    } else if (sort === "commission_asc") {
      query = query.order("commission_rate", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // 📄 pagination
    if (!all) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: all
        ? null
        : {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
          },
    });
  } catch (err) {
    console.error("GET agents error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load agents" },
      { status: 500 }
    );
  }
}
/* =========================
   POST: create agent
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      agent_type,
      commission_rate = 0,
      phone = null,
      status = "ACTIVE",
    } = body;

    if (!name || !agent_type) {
      return NextResponse.json(
        { error: "Missing name or agent_type" },
        { status: 400 }
      );
    }


    // 🔍 CHECK DUPLICATE NAME
    const { data: existing } = await supabaseAdmin
      .from("agents")
      .select("id")
      .ilike("name", name.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Agent name already exists" },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from("agents")
      .insert({
        name,
        agent_type,
        commission_rate: Number(commission_rate),
        phone,
        status,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST agents error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create agent" },
      { status: 500 }
    );
  }
}
