const express = require("express");

const router = express.Router();

const charts = [
  {
    id: "1",
    name: "Sales by Region",
    description: "Regional sales performance comparison",
    type: "bar",
    dataSource: "Sales Database",
    createdAt: "2024-03-18",
    lastModified: "2024-03-20",
    xAxis: "Region",
    yAxis: "Sales",
    metrics: ["Sales", "Orders"],
    data: [
      { Region: "North", Sales: 150000, Orders: 245 },
      { Region: "South", Sales: 120000, Orders: 198 },
      { Region: "East", Sales: 180000, Orders: 289 },
      { Region: "West", Sales: 165000, Orders: 276 },
    ],
  },
  {
    id: "2",
    name: "Revenue Trends",
    description: "Monthly revenue trends over time",
    type: "line",
    dataSource: "Sales Database",
    createdAt: "2024-03-15",
    lastModified: "2024-03-19",
    xAxis: "Month",
    yAxis: "Revenue",
    metrics: ["Revenue"],
    data: [
      { Month: "Jan", Revenue: 42000 },
      { Month: "Feb", Revenue: 45000 },
      { Month: "Mar", Revenue: 38000 },
      { Month: "Apr", Revenue: 52000 },
      { Month: "May", Revenue: 48000 },
    ],
  },
  {
    id: "3",
    name: "Product Distribution",
    description: "Market share by product category",
    type: "pie",
    dataSource: "Product Database",
    createdAt: "2024-03-10",
    lastModified: "2024-03-18",
    xAxis: "Category",
    yAxis: "Share",
    metrics: ["Share"],
    data: [
      { Category: "Electronics", Share: 35 },
      { Category: "Clothing", Share: 25 },
      { Category: "Food", Share: 20 },
      { Category: "Other", Share: 20 },
    ],
  },
];

const dashboards = [
  {
    id: "1",
    name: "Sales Performance",
    description: "Monthly and yearly sales metrics",
    createdAt: "2024-03-15",
    chartsCount: 2,
    chartIds: ["1", "2"],
  },
  {
    id: "2",
    name: "Customer Analytics",
    description: "Customer demographics and behavior",
    createdAt: "2024-03-10",
    chartsCount: 1,
    chartIds: ["3"],
  },
  {
    id: "3",
    name: "Inventory Management",
    description: "Stock levels and movement tracking",
    createdAt: "2024-03-05",
    chartsCount: 0,
    chartIds: [],
  },
];

const reports = [
  {
    id: "1",
    dashboardId: "1",
    name: "Default Sales Pivot",
    description: "Base OLAP configuration",
    config: {
      selectedDimensions: ["DIM STORE", "Dim Time"],
      currentLevels: { "DIM STORE": 0, "Dim Time": 0 },
      selectedMeasures: ["Quantity Ordered"],
      filters: {},
      rowDimension: "DIM STORE",
      columnDimension: "Dim Time",
      chartType: "line",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const notifications = [
  {
    id: "1",
    type: "success",
    message: "Connected to OLAP server successfully",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "2",
    type: "info",
    message: "BI workbench is ready. Use Refresh to query latest DW data.",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
  },
];

function nextId(items) {
  const maxId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  return String(maxId + 1);
}

function getDashboardCharts(dashboard) {
  return charts.filter((chart) => dashboard.chartIds.includes(chart.id));
}

router.get("/dashboards", (req, res) => {
  res.json({ success: true, data: dashboards, count: dashboards.length });
});

router.get("/dashboards/:id", (req, res) => {
  const dashboard = dashboards.find((item) => item.id === req.params.id);
  if (!dashboard) {
    res.status(404).json({ success: false, error: "Dashboard not found" });
    return;
  }

  const relatedCharts = getDashboardCharts(dashboard);
  res.json({
    success: true,
    data: {
      ...dashboard,
      charts: relatedCharts,
      stats: {
        totalCharts: relatedCharts.length,
      },
    },
  });
});

router.post("/dashboards", (req, res) => {
  const { name, description = "" } = req.body || {};
  if (!name || !String(name).trim()) {
    res.status(400).json({ success: false, error: "Dashboard name is required" });
    return;
  }

  const newDashboard = {
    id: nextId(dashboards),
    name: String(name).trim(),
    description: String(description || "").trim(),
    createdAt: new Date().toISOString(),
    chartsCount: 0,
    chartIds: [],
  };

  dashboards.push(newDashboard);
  res.status(201).json({ success: true, data: newDashboard });
});

router.delete("/dashboards/:id", (req, res) => {
  const index = dashboards.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    res.status(404).json({ success: false, error: "Dashboard not found" });
    return;
  }

  dashboards.splice(index, 1);
  res.json({ success: true });
});

router.get("/charts", (req, res) => {
  res.json({ success: true, data: charts, count: charts.length });
});

router.get("/charts/:id", (req, res) => {
  const chart = charts.find((item) => item.id === req.params.id);
  if (!chart) {
    res.status(404).json({ success: false, error: "Chart not found" });
    return;
  }

  res.json({ success: true, data: chart });
});

router.post("/charts", (req, res) => {
  const {
    name,
    description = "",
    type = "bar",
    dataSource = "OLAP Cube",
    xAxis = "name",
    yAxis = "value",
    metrics = [],
    data = [],
  } = req.body || {};

  if (!name || !String(name).trim()) {
    res.status(400).json({ success: false, error: "Chart name is required" });
    return;
  }

  const now = new Date().toISOString();
  const newChart = {
    id: nextId(charts),
    name: String(name).trim(),
    description: String(description || "").trim(),
    type: String(type || "bar"),
    dataSource: String(dataSource || "OLAP Cube"),
    createdAt: now,
    lastModified: now,
    xAxis: String(xAxis || "name"),
    yAxis: String(yAxis || "value"),
    metrics: Array.isArray(metrics) ? metrics : [],
    data: Array.isArray(data) ? data : [],
  };

  charts.push(newChart);
  res.status(201).json({ success: true, data: newChart });
});

router.delete("/charts/:id", (req, res) => {
  const index = charts.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    res.status(404).json({ success: false, error: "Chart not found" });
    return;
  }

  const [removed] = charts.splice(index, 1);
  for (const dashboard of dashboards) {
    dashboard.chartIds = dashboard.chartIds.filter((chartId) => chartId !== removed.id);
    dashboard.chartsCount = dashboard.chartIds.length;
  }

  res.json({ success: true });
});

router.get("/search", (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();
  if (!query || query.length < 2) {
    res.json({ success: true, data: [], count: 0 });
    return;
  }

  const dashboardItems = dashboards
    .filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    })
    .map((item) => ({
      id: item.id,
      type: "dashboard",
      name: item.name,
      description: item.description,
      url: `/dashboard/${item.id}`,
    }));

  const chartItems = charts
    .filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    })
    .map((item) => ({
      id: item.id,
      type: "chart",
      name: item.name,
      description: item.description,
      url: `/charts/${item.id}`,
    }));

  const results = [...dashboardItems, ...chartItems];
  res.json({ success: true, data: results, count: results.length });
});

router.get("/reports", (req, res) => {
  const dashboardId = String(req.query.dashboardId || "").trim();
  const data = dashboardId
    ? reports.filter((item) => item.dashboardId === dashboardId)
    : reports;

  res.json({ success: true, data, count: data.length });
});

router.post("/reports", (req, res) => {
  const { dashboardId, name, description = "", config = {} } = req.body || {};
  if (!dashboardId || !name || !String(name).trim()) {
    res.status(400).json({ success: false, error: "dashboardId and name are required" });
    return;
  }

  const now = new Date().toISOString();
  const report = {
    id: nextId(reports),
    dashboardId: String(dashboardId),
    name: String(name).trim(),
    description: String(description || "").trim(),
    config: config && typeof config === "object" ? config : {},
    createdAt: now,
    updatedAt: now,
  };

  reports.unshift(report);
  res.status(201).json({ success: true, data: report });
});

router.delete("/reports/:id", (req, res) => {
  const index = reports.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    res.status(404).json({ success: false, error: "Report not found" });
    return;
  }

  reports.splice(index, 1);
  res.json({ success: true });
});

router.get("/notifications", (req, res) => {
  res.json({ success: true, data: notifications, count: notifications.length });
});

router.post("/notifications", (req, res) => {
  const { type = "info", message } = req.body || {};
  if (!message || !String(message).trim()) {
    res.status(400).json({ success: false, error: "Notification message is required" });
    return;
  }

  const next = {
    id: nextId(notifications),
    type: String(type || "info"),
    message: String(message).trim(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  notifications.unshift(next);
  res.status(201).json({ success: true, data: next });
});

router.delete("/notifications/:id", (req, res) => {
  const index = notifications.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    res.status(404).json({ success: false, error: "Notification not found" });
    return;
  }

  notifications.splice(index, 1);
  res.json({ success: true });
});

module.exports = { catalogRoutes: router };
