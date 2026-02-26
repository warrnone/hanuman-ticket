import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    /* =========================
       DATE CONFIG
    ========================= */
    // #region กำหนดค่าต่างๆ ของวันที่ เช่น วันนี้ ต้นวัน 3 วันก่อน 7 วันก่อน เพื่อใช้ในการกรองข้อมูล orders และคำนวณคอมมิชชั่นของแท็กซี่ในส่วนต่างๆ ของแดชบอร์ด
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
    // #endregion

    /* =========================
       BASIC COUNTS
    ========================= */
    // #region ดึงข้อมูลจำนวนผู้ใช้และแพ็คเกจทั้งหมด เพื่อแสดงในส่วนสถิติพื้นฐานของแดชบอร์ด
    const { count: users } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: packages } = await supabaseAdmin
      .from("packages")
      .select("*", { count: "exact", head: true });
    // #endregion

    /* =========================
       TODAY ORDERS
    ========================= */
    // #region ดึงข้อมูล orders ที่สร้างขึ้นตั้งแต่ต้นวัน เพื่อคำนวณยอดขายรวม ยอดขายจากแท็กซี่ และจำนวน orders จากแท็กซี่ในวันนี้
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
    // #endregion  
    
    /* =========================
       LOAD TAXIS
    ========================= */
    // #region ดึงข้อมูลแท็กซี่ทั้งหมด เพื่อใช้ในการคำนวณคอมมิชชั่นและวิเคราะห์สถานะของแท็กซี่ในส่วนต่างๆ ของแดชบอร์ด  
    const { data: taxis, error: taxiError } =
      await supabaseAdmin
        .from("taxis")
        .select("id, car_number");
      
    if (taxiError) throw taxiError;
    
    // #endregion

    /* =========================
       TAXI COMMISSION TODAY
    ========================= */
    // #region คำนวณยอดคอมมิชชั่นของแท็กซี่จาก orders วันนี้ โดยใช้ข้อมูล commission_type และ commission_value จากตาราง taxis  
    let taxiCommissionToday = 0;

    (todayOrders || []).forEach((o) => {
      if (!o.taxi_id) return;

      taxiCommissionToday += Number(o.commission_amount || 0);
    });

    const profitToday = revenueToday - taxiCommissionToday;
    // #endregion

    /* =========================
       WEEKLY COMPARISON
    ========================= */
    // #region ดึงข้อมูล orders ของสัปดาห์นี้และสัปดาห์ที่แล้ว เพื่อคำนวณรายได้รวมและเปอร์เซ็นต์การเปลี่ยนแปลง
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
    // #endregion

    /* =========================
       LOAD ORDERS 7 DAYS (JOIN TAXI)
    ========================= */
    // #region TAXI PERFORMANCE (ใช้ commission_amount จาก orders)
    const { data: orders7d, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select(`
          taxi_id,
          created_at,
          commission_amount
        `)
        .not("taxi_id", "is", null)
        .gte("created_at", day7.toISOString());

    if (orderError) throw orderError;

    // เตรียม map taxi
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

    // รวมข้อมูลจาก orders
    (orders7d || []).forEach((o) => {
      const t = taxiMap[o.taxi_id];
      if (!t) return;

      t.orders_7d += 1;

      // ใช้ commission_amount ตรง ๆ
      const commission = Number(o.commission_amount || 0);
      t.unpaid_commission += commission;

      if (
        !t.last_order_at ||
        new Date(o.created_at) > new Date(t.last_order_at)
      ) {
        t.last_order_at = o.created_at;
      }
    });

    // วิเคราะห์สถานะ
    let green = 0,
      yellow = 0,
      red = 0,
      unpaidCommission = 0;

    Object.values(taxiMap).forEach((t) => {
      unpaidCommission += t.unpaid_commission;

      if (t.orders_7d === 0) {
        t.status = "INACTIVE";
        return;
      }

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
    });

    // #endregion

    /* =========================
      PACKAGE SUMMARY
    ========================= */
    // #region ดึงข้อมูล order_items ทั้งหมดใน 7 วันที่ผ่านมา เพื่อสรุปยอดขายแยกตามแพ็คเกจ
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

    const topPackages = Object.values(packageMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    // #endregion

    /* =========================
      PRODUCT x CHANNEL MATRIX
    ========================= */
    // #region ดึงข้อมูล order_items พร้อม join orders และ taxis เพื่อสร้าง matrix แสดงยอดขายแยกตามแพ็คเกจและช่องทาง (แท็กซี่สีเขียว, เหลือง, walk-in)
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
    // #endregion

    /* =========================
      REVENUE BY PLATE
    ========================= */
    // #region คำนวณยอดรายได้รวมแยกตามสีแท็กซี่จากข้อมูล orders ใน 7 วันที่ผ่านมา
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
    // #endregion

    /* =========================
      Profit Margin by Package
    ========================= */
    // #region คำนวณกำไรขั้นต้นและอัตรากำไรขั้นต้นแยกตามแพ็คเกจ โดยรวมข้อมูลจาก order_items และ orders เพื่อหาค่า commission ของแต่ละแพ็คเกจ
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
    // #endregion

    // #region SOURCE CHANNEL × ACTIVITY (HW / HL)
    const { data: ordersWithItems, error } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        commission_amount,
        source_channels ( id, name ),
        order_items (
          price,
          quantity,
          packages (
            categories (
              name
            )
          )
        )
      `)
      .not("source_channel_id", "is", null);

    if (error) throw error;

    // map category → activity code
    function getActivityType(categoryName) {
      const activityMap = {
        "World Packages": "HW",
        "Luge": "HL",
        "Roller": "Ro",
        "SKY WALK": "SW",
        "Zipline": "Zip",
      };

      return activityMap[categoryName] || "Walk in";
    }

    const map = {};

    ordersWithItems.forEach((order) => {
      const channelName = order.source_channels?.name || "Unknown";

      (order.order_items || []).forEach((item) => {
        const categoryName =
          item.packages?.categories?.name;

        const activity = getActivityType(categoryName);

        const key = `${channelName} - ${activity}`;

        if (!map[key]) {
          map[key] = {
            name: key,
            orders: 0,
            totalSales: 0,
            totalCommission: 0,
          };
        }

        // 1 order ต่อ activity 1 ครั้ง
        map[key].orders += 1;

        // คำนวณยอดจาก item จริง
        const itemRevenue =
          Number(item.price || 0) * Number(item.quantity || 0);

        map[key].totalSales += itemRevenue;

        // commission อยู่ระดับ order
        map[key].totalCommission +=
          Number(order.commission_amount || 0);
      });
    });

    // ===== ทำให้ Master List ครบทุก Channel × Activity =====

    const { data: allChannels, error: channelError } =
      await supabaseAdmin
        .from("source_channels")
        .select("id, name");

    if (channelError) throw channelError;

    // activity types ที่ระบบคุณมี
    const activityTypes = ["HW", "HL", "Ro", "SW", "Zip"];

    allChannels.forEach((ch) => {
      activityTypes.forEach((activity) => {
        const key = `${ch.name} - ${activity}`;

        if (!map[key]) {
          map[key] = {
            name: key,
            orders: 0,
            totalSales: 0,
            totalCommission: 0,
          };
        }
      });
    });

    const sourceChannelStats = Object.values(map).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // #endregion

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
    // #region รวมข้อมูลทั้งหมดที่ดึงมาและคำนวณได้ ส่งกลับในรูปแบบ JSON เพื่อให้ frontend นำไปแสดงผลในแดชบอร์ด
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
      sourceChannelStats, totalCommission: sourceChannelStats.reduce((sum, s) => sum + s.totalCommission, 0),
      topSources,          // 🔥 ใหม่
      taxiPerformance,      // 🔥 ถ้ามี
    });
    // #endregion
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
