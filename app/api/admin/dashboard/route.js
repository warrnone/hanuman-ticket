import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    /* =========================
       DATE CONFIG
    ========================= */
    const now = new Date();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const day3 = new Date();
    day3.setDate(now.getDate() - 3);

    const day7 = new Date();
    day7.setDate(now.getDate() - 7);

    const thisWeekStart = new Date();
    thisWeekStart.setDate(now.getDate() - 7);

    const lastWeekStart = new Date();
    lastWeekStart.setDate(now.getDate() - 14);

    const RED_COMMISSION_LIMIT = 3000;

    /* =========================
       BASIC COUNTS
    ========================= */

    const { count: users } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: packages } = await supabaseAdmin
      .from("packages")
      .select("*", { count: "exact", head: true });

    /* =========================
       TODAY ORDERS
    ========================= */

    const { data: todayOrders, error: todayError } =
      await supabaseAdmin
        .from("orders")
        .select("total_amount, taxi_id , adult_count, child_count")
        .gte("created_at", todayStart.toISOString());

    if (todayError) throw todayError;

    const ordersToday = todayOrders?.length || 0;

    const revenueToday =
      todayOrders?.reduce(
        (sum, o) => sum + Number(o.total_amount),
        0
      ) || 0;

    const taxiOrdersToday =
      todayOrders?.filter((o) => o.taxi_id).length || 0;

    const taxiRevenueToday =
      todayOrders
        ?.filter((o) => o.taxi_id)
        .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

    /* =========================
       LOAD TAXIS
    ========================= */

    const { data: taxis, error: taxiError } =
      await supabaseAdmin
        .from("taxis")
        .select("id, car_number, commission_value");
      
    if (taxiError) throw taxiError;

    /* =========================
       TAXI COMMISSION TODAY
    ========================= */

    let taxiCommissionToday = 0;

    (todayOrders || []).forEach((o) => {
      if (!o.taxi_id) return;

      const taxi = taxis?.find((t) => t.id === o.taxi_id);
      if (!taxi) return;

      (todayOrders || []).forEach((o) => {
        if (!o.taxi_id) return;

        const taxi = taxis?.find((t) => t.id === o.taxi_id);
        if (!taxi) return;

        const adult = Number(o.adult_count || 0);
        const child = Number(o.child_count || 0);
        const total = Number(o.total_amount || 0);

        let commission = 0;

        switch (taxi.commission_type) {
          case "FIXED_PER_HEAD":
            commission =
              (adult + child) * Number(taxi.commission_value);
            break;

          case "FIXED_PER_ORDER":
            commission = Number(taxi.commission_value);
            break;

          case "PERCENT":
            commission =
              (total * Number(taxi.commission_value)) / 100;
            break;
        }

        taxiCommissionToday += commission;
      });
    });

    const profitToday = revenueToday - taxiCommissionToday;

    /* =========================
       WEEKLY COMPARISON
    ========================= */

    const { data: thisWeekOrders } =
      await supabaseAdmin
        .from("orders")
        .select("total_amount")
        .gte("created_at", thisWeekStart.toISOString());

    const { data: lastWeekOrders } =
      await supabaseAdmin
        .from("orders")
        .select("total_amount")
        .gte("created_at", lastWeekStart.toISOString())
        .lt("created_at", thisWeekStart.toISOString());

    const thisWeekRevenue =
      thisWeekOrders?.reduce(
        (sum, o) => sum + Number(o.total_amount),
        0
      ) || 0;

    const lastWeekRevenue =
      lastWeekOrders?.reduce(
        (sum, o) => sum + Number(o.total_amount),
        0
      ) || 0;

    const percentChange =
      lastWeekRevenue > 0
        ? Math.round(
            ((thisWeekRevenue - lastWeekRevenue) /
              lastWeekRevenue) *
              100
          )
        : 0;

    /* =========================
       LOAD ORDERS 7 DAYS (JOIN TAXI)
    ========================= */

    const { data: orders7d, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select(`
          taxi_id,
          created_at,
          total_amount,
          taxis (
            commission_type,
            commission_value
          )
        `)
        .not("taxi_id", "is", null)
        .gte("created_at", day7.toISOString());

    if (orderError) throw orderError;

    const taxiMap = {};

    (taxis || []).forEach((t) => {
      taxiMap[t.id] = {
        taxi_id: t.id,
        car_number: t.car_number,
        orders_7d: 0,
        unpaid_commission: 0,
        last_order_at: null,
        status: "INACTIVE",
      };
    });

    (orders7d || []).forEach((o) => {
      const t = taxiMap[o.taxi_id];
      if (!t) return;

      t.orders_7d += 1;

      const type = o.taxis?.commission_type;
      const value = Number(o.taxis?.commission_value || 0);

      const adult = Number(o.adult_count || 0);
      const child = Number(o.child_count || 0);
      const total = Number(o.total_amount || 0);

      let commission = 0;

      switch (type) {
        case "FIXED_PER_HEAD":
          commission = (adult + child) * value;
          break;

        case "FIXED_PER_ORDER":
          commission = value;
          break;

        case "PERCENT":
          commission = (total * value) / 100;
          break;
      }

      t.unpaid_commission += commission;

      if (
        !t.last_order_at ||
        new Date(o.created_at) > new Date(t.last_order_at)
      ) {
        t.last_order_at = o.created_at;
      }
    });

    let green = 0,
      yellow = 0,
      red = 0,
      unpaidCommission = 0;

    Object.values(taxiMap).forEach((t) => {
      unpaidCommission += t.unpaid_commission;

      if (t.orders_7d === 0 && t.unpaid_commission > RED_COMMISSION_LIMIT) {
        t.status = "RED";
        red++;
        return;
      }

      if (t.last_order_at) {
        const last = new Date(t.last_order_at);

        if (last >= day3 && t.unpaid_commission === 0) {
          t.status = "GREEN";
          green++;
        } else if (last >= day7) {
          t.status = "YELLOW";
          yellow++;
        } else {
          t.status = "RED";
          red++;
        }
      }
    });

    /* =========================
      PACKAGE SUMMARY
    ========================= */

    const { data: items, error: itemError } =
      await supabaseAdmin
        .from("order_items")
        .select("item_name, price, quantity");

    if (itemError) throw itemError;

    const packageMap = {};

    (items || []).forEach((item) => {
      const name = item.item_name;

      if (!packageMap[name]) {
        packageMap[name] = {
          package: name,
          orders: 0,
          quantity: 0,
          revenue: 0,
        };
      }

      packageMap[name].orders += 1;
      packageMap[name].quantity += item.quantity;
      packageMap[name].revenue +=
        Number(item.price) * Number(item.quantity);
    });

    const topPackages =
      Object.values(packageMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);


    /* =========================
      PRODUCT x CHANNEL MATRIX
    ========================= */
    const { data: matrixData } =
      await supabaseAdmin
        .from("order_items")
        .select(`
          item_name,
          quantity,
          orders (
            taxi_id,
            taxis (
              plate_color
            )
          )
        `);

    const matrixMap = {};

    (matrixData || []).forEach((row) => {
      const pkg = row.item_name;
      const plate = row.orders?.taxis?.plate_color;

      if (!matrixMap[pkg]) {
        matrixMap[pkg] = {
          package: pkg,
          yellow: 0,
          green: 0,
          walkin: 0,
          total: 0,
        };
      }

      if (!row.orders?.taxi_id) {
        matrixMap[pkg].walkin += row.quantity;
      } else if (plate === "YELLOW") {
        matrixMap[pkg].yellow += row.quantity;
      } else if (plate === "GREEN") {
        matrixMap[pkg].green += row.quantity;
      }

      matrixMap[pkg].total += row.quantity;
    });


    /* =========================
      REVENUE BY PLATE
    ========================= */

    let yellowRevenue = 0;
    let greenRevenue = 0;

    (orders7d || []).forEach((o) => {
      const plate = o.taxis?.plate_color;
      if (plate === "YELLOW") {
        yellowRevenue += Number(o.total_amount);
      } else if (plate === "GREEN") {
        greenRevenue += Number(o.total_amount);
      }
    });


    /* =========================
      Profit Margin by Package
    ========================= */
    const profitPackage = {};

    (matrixData || []).forEach((row) => {
      const pkg = row.item_name;

      if (!profitPackage[pkg]) {
        profitPackage[pkg] = {
          package: pkg,
          revenue: 0,
          commission: 0,
        };
      }

      const total = Number(row.price) * Number(row.quantity);
      profitPackage[pkg].revenue += total;

      const taxi = row.orders?.taxis;

      if (!taxi) return;

      const type = taxi.commission_type;
      const value = Number(taxi.commission_value || 0);

      const adult = Number(row.orders?.adult_count || 0);
      const child = Number(row.orders?.child_count || 0);
      const orderTotal = Number(row.orders?.total_amount || 0);

      let commission = 0;

      switch (type) {
        case "FIXED_PER_HEAD":
          commission = (adult + child) * value;
          break;

        case "FIXED_PER_ORDER":
          commission = value;
          break;

        case "PERCENT":
          commission = (orderTotal * value) / 100;
          break;
      }

      profitPackage[pkg].commission += commission;
    });

    const profitMargin = Object.values(profitPackage).map((pkg) => {
      const margin = pkg.revenue > 0 ? ((pkg.revenue - pkg.commission) / pkg.revenue * 100) : 0;
      return {
        ...pkg,
        margin: Math.round(margin * 100) / 100,
      };
    });


    // #region SOURCE CHANNEL SUMMARY
    const { data: sourceSummary, error: sourceError } =
      await supabaseAdmin
        .from("orders")
        .select(`
          total_amount,
          commission_amount,
          source_channels (
            id,
            name,
            commissionable
          )
        `)
        .not("source_channel_id", "is", null);

    if (sourceError) throw sourceError;
    const sourceMap = {};
    sourceSummary.forEach((row) => {
      const name = row.source_channels?.name || "Unknown";

      if (!sourceMap[name]) {
        sourceMap[name] = {
          name,
          totalSales: 0,
          totalCommission: 0,
          orders: 0,
        };
      }

      sourceMap[name].totalSales += Number(row.total_amount || 0);
      sourceMap[name].totalCommission += Number(row.commission_amount || 0);
      sourceMap[name].orders += 1;
    });

    const sourceChannelStats = Object.values(sourceMap);
    // endregion


    // #region เพิ่ม Commission Overview (ภาพรวมคอม)
    const { data: commissionData, error: commissionError } =
      await supabaseAdmin
        .from("orders")
        .select("commission_amount")
        .eq("commission_eligible", true);

    if (commissionError) throw commissionError;

    const totalCommission = commissionData.reduce(
      (sum, row) => sum + Number(row.commission_amount || 0),
      0
    );
    // #endregion

    // #region เพิ่ม Taxi Performance 
    const { data: taxiData, error: taxitotalError } =
      await supabaseAdmin
        .from("orders")
        .select(`
          total_amount,
          taxis (
            id,
            car_number
          )
        `)
        .not("taxi_id", "is", null);

    if (taxitotalError) throw taxitotalError;
    // #endregion

    // #region เพิ่ม Top Sources (แหล่งขายยอดนิยม)      
    const topSources = sourceChannelStats
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);
    // #endregion

    // #region เพิ่ม Taxi Performance (ประสิทธิภาพแท็กซี่)
    const taxiMaptotal = {};
    taxiData.forEach((row) => {
      const name = row.taxis?.car_number || "Unknown";

      if (!taxiMaptotal[name]) {
        taxiMaptotal[name] = {
          name,
          totalSales: 0,
          orders: 0,
        };
      }

      taxiMaptotal[name].totalSales += Number(row.total_amount || 0);
      taxiMaptotal[name].orders += 1;
    });

    const taxiPerformance = Object.values(taxiMaptotal);
    // #endregion

    /* =========================
       RESPONSE
    ========================= */

    return NextResponse.json({
      stats: {
        users: users || 0,
        packages: packages || 0,
        ordersToday,
        revenueToday,
        taxiOrdersToday,
        taxiRevenueToday,
        taxiCommissionToday,
        profitToday,
        taxiCount: taxis?.length || 0,
      },
      weeklyComparison: {
        thisWeekRevenue,
        lastWeekRevenue,
        percentChange,
      },
      topPackages,
      salesChart: [],
      latestOrders: [],
      topTaxis: [],
      topCommissionTaxi: null,
      taxiList: taxis || [],
      orderSource: {
        taxi:
          ordersToday > 0
            ? Math.round((taxiOrdersToday / ordersToday) * 100)
            : 0,
        walkin:
          ordersToday > 0
            ? 100 -
              Math.round((taxiOrdersToday / ordersToday) * 100)
            : 0,
      },
      taxiHealth: {
        total: taxis?.length || 0,
        green,
        yellow,
        red,
        unpaidCommission,
      },
      taxiStatusList: Object.values(taxiMap),
      packageSummary: Object.values(packageMap),
      productChannelMatrix: Object.values(matrixMap),
      plateRevenue: {
        yellow: yellowRevenue,
        green: greenRevenue,
      },
      profitMargin,
      sourceChannelStats,  // 🔥 ใหม่
      totalCommission,     // 🔥 ใหม่
      topSources,          // 🔥 ใหม่
      taxiPerformance,      // 🔥 ถ้ามี
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
