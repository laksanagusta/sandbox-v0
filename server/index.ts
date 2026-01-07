import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import http from "http";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Mock data untuk dashboard (dapat diganti dengan database sesungguhnya)
const mockDashboardData = {
  data: {
    overview: {
      total_business_trips: 2,
      draft_business_trips: 0,
      ongoing_business_trips: 2,
      completed_business_trips: 0,
      canceled_business_trips: 0,
      upcoming_business_trps: 0,
      total_assignees: 2,
      total_transactions: 0,
      total_cost: 9298500,
      average_cost_per_trip: 4649250
    },
    monthly_stats: [
      {
        month: "October",
        year: 2025,
        total_trips: 15,
        completed_trips: 0,
        total_cost: 9298500,
        average_cost_per_trip: 619900,
        top_destination: "Palembang"
      }
    ],
    destination_stats: [
      {
        destination: "Palembang",
        total_trips: 15,
        completed_trips: 0,
        total_cost: 9298500,
        average_cost_per_trip: 619900,
        last_trip_date: "2025-10-23"
      }
    ],
    transaction_type_stats: null,
    recent_business_trips: [
      {
        id: "2cfd0183-62d2-4c39-a48a-7782c0443e1a",
        business_trip_number: "BT-000002",
        activity_purpose: "melakukan pemantauan dan evaluasi pelaksanaan program di daerah dalam rangka tindak lanjut Monitoring Evaluasi Penguatan Akuntabilitas kinerja di Kantor Balai Kekarantinaan Kesehatan Kelas I Palembang",
        destination_city: "Palembang",
        start_date: "2025-10-23",
        end_date: "2025-10-25",
        status: "ongoing",
        assignee_count: 1,
        total_cost: 4739500
      },
      {
        id: "738eff30-ec02-4536-ac93-91c1fd829162",
        business_trip_number: "BT-000001",
        activity_purpose: "wadda",
        destination_city: "Palembang",
        start_date: "2025-10-23",
        end_date: "2025-10-25",
        status: "ongoing",
        assignee_count: 1,
        total_cost: 4559000
      }
    ]
  },
  success: true
};

// API Endpoint untuk Business Trip Dashboard
app.get("/api/business-trips/dashboard", (req: Request, res: Response) => {
  try {
    // Extract query parameters untuk filter
    const { start_date, end_date, destination, status, limit } = req.query;

    // Log query parameters untuk debugging
    console.log("Dashboard query params:", { start_date, end_date, destination, status, limit });

    // Simulasi filter berdasarkan parameter
    let filteredData = { ...mockDashboardData.data };

    // Filter berdasarkan destinasi
    if (destination && typeof destination === 'string') {
      filteredData.destination_stats = filteredData.destination_stats?.filter(
        stat => stat.destination.toLowerCase().includes(destination.toLowerCase())
      ) || [];

      filteredData.recent_business_trips = filteredData.recent_business_trips?.filter(
        trip => trip.destination_city.toLowerCase().includes(destination.toLowerCase())
      ) || [];
    }

    // Filter berdasarkan status
    if (status && typeof status === 'string') {
      filteredData.recent_business_trips = filteredData.recent_business_trips?.filter(
        trip => trip.status === status
      ) || [];
    }

    // Apply limit
    if (limit && !isNaN(Number(limit))) {
      const limitNum = Number(limit);
      filteredData.recent_business_trips = filteredData.recent_business_trips?.slice(0, limitNum) || [];
    }

    // Hitung ulang overview berdasarkan data yang sudah difilter
    if (destination && typeof destination === 'string') {
      filteredData.overview.total_business_trips = filteredData.recent_business_trips.length;
      filteredData.overview.ongoing_business_trips = filteredData.recent_business_trips.filter(
        trip => trip.status === 'ongoing'
      ).length;
      filteredData.overview.completed_business_trips = filteredData.recent_business_trips.filter(
        trip => trip.status === 'completed'
      ).length;
    }

    // Kirim response
    res.json({
      data: filteredData,
      success: true
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch dashboard data",
      success: false
    });
  }
});

// --- MCP Routes ---
import { mcpRunner } from "./lib/mcp-runner";

app.get("/api/mcp/tools", async (req, res) => {
  try {
    const result = await mcpRunner.listTools();
    res.json(result);
  } catch (error: any) {
    console.error("MCP List Tools Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/mcp/execute", async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    const result = await mcpRunner.callTool(name, args);
    res.json(result);
  } catch (error: any) {
    console.error(`MCP Execute Tool ${req.body.name} Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = http.createServer(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
