const express = require("express");
const { fetchCubeSlice, getCubeMeta } = require("../cube/cubeService");
const { cubeDefinition, getAllMeasures } = require("../cube/cubeDefinition");

function measureLabelFromUniqueName(value) {
  return String(value || "").replace("[Measures].[", "").replace("]", "");
}

function normalizeFactGroupKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const FACT_GROUP_ALIASES = {
  factsales: ["factsales", "sales", "sale", "factsalescount"],
  factinventory: ["factinventory", "inventory", "factinventorycount"],
};

function resolveFactGroupCanonicalKey(factGroup) {
  const normalized = normalizeFactGroupKey(factGroup);
  if (!normalized) {
    return "";
  }

  if (FACT_GROUP_ALIASES.factsales.some((alias) => normalized === alias || normalized.includes(alias))) {
    return "factsales";
  }

  if (FACT_GROUP_ALIASES.factinventory.some((alias) => normalized === alias || normalized.includes(alias))) {
    return "factinventory";
  }

  return normalized;
}

function getFactMeasureGroups() {
  return Array.isArray(cubeDefinition.measureGroups) ? cubeDefinition.measureGroups : [];
}

function findFactGroup(factGroup) {
  const normalized = resolveFactGroupCanonicalKey(factGroup);
  if (!normalized) {
    return null;
  }

  const groups = getFactMeasureGroups();
  return (
    groups.find((group) => {
      const key = normalizeFactGroupKey(group?.name);
      return key === normalized || key.includes(normalized) || normalized.includes(key);
    }) ||
    null
  );
}

function getMeasureUniqueNamesByFactGroup(factGroup) {
  const matched = findFactGroup(factGroup);
  if (!matched || !Array.isArray(matched.measures)) {
    return [];
  }

  return matched.measures;
}

function getMeasureLabelsByFactGroup(factGroup) {
  return getMeasureUniqueNamesByFactGroup(factGroup).map((item) => measureLabelFromUniqueName(item));
}

function getDimensionsByFactGroup(factGroup) {
  return Array.isArray(cubeDefinition.dimensions) ? cubeDefinition.dimensions : [];
}

function getUiMetaFromCubeDefinition(factGroup) {
  const factMeasures = getMeasureUniqueNamesByFactGroup(factGroup);
  const sourceMeasures = factMeasures.length > 0 ? factMeasures : getAllMeasures();
  const sourceDimensions = getDimensionsByFactGroup(factGroup);

  return {
    dimensions: sourceDimensions.map((dimension) => ({
      name: dimension.label,
      hierarchy: dimension.levels || [],
      hierarchyUniqueName: dimension.hierarchy,
    })),
    measures: sourceMeasures.map((measure) => ({
      name: measureLabelFromUniqueName(measure),
      uniqueName: measure,
    })),
    factGroup: findFactGroup(factGroup)?.name || "",
  };
}

function normalizeQueryPayload(payload) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const selectedDimensions = Array.isArray(safePayload.selectedDimensions)
    ? safePayload.selectedDimensions.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const selectedMeasures = Array.isArray(safePayload.selectedMeasures)
    ? safePayload.selectedMeasures.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const currentLevelsSource = safePayload.currentLevels && typeof safePayload.currentLevels === "object"
    ? safePayload.currentLevels
    : safePayload.levels && typeof safePayload.levels === "object"
      ? safePayload.levels
      : {};
  const currentLevels = currentLevelsSource && typeof currentLevelsSource === "object" ? currentLevelsSource : {};
  const filters = safePayload.filters && typeof safePayload.filters === "object"
    ? { ...safePayload.filters }
    : {};

  // Nhận filterUsage nếu có
  const filterUsage = safePayload.filterUsage && typeof safePayload.filterUsage === "object" ? { ...safePayload.filterUsage } : null;

  // Nếu có filterUsage, loại bỏ các filter thuộc group bị tắt
  // Hỗ trợ cả string và string[] (multi-select) cho year/quarter/month/state/city
  if (filterUsage) {
    // Time group
    if (!filterUsage.year && !filterUsage.quarter && !filterUsage.month) {
      filters.year = [];
      filters.quarter = [];
      filters.month = [];
    } else {
      if (!filterUsage.year) filters.year = [];
      if (!filterUsage.quarter) filters.quarter = [];
      if (!filterUsage.month) filters.month = [];
    }
    // Location group
    if (!filterUsage.state && !filterUsage.city) {
      filters.state = [];
      filters.city = [];
    } else {
      if (!filterUsage.state) filters.state = [];
      if (!filterUsage.city) filters.city = [];
    }
    // Customer type
    if (filters.hasOwnProperty('customerType') && !filterUsage.customerType) {
      filters.customerType = 'all';
    }
    // Product key
    if (filters.hasOwnProperty('productKey') && !filterUsage.productKey) {
      filters.productKey = '';
    }
  }
  const factGroup = String(safePayload.factGroup || "").trim();

  return {
    selectedDimensions,
    selectedMeasures,
    currentLevels,
    filters,
    filterUsage,
    factGroup,
  };
}

function buildDimensionFields(selectedDimensions, currentLevels) {
  const fields = [];

  for (const name of selectedDimensions) {
    const matched = cubeDefinition.dimensions.find((dimension) => dimension.label === name);
    if (!matched || !Array.isArray(matched.levels) || matched.levels.length === 0) {
      continue;
    }

    const requestedLevels = Array.isArray(currentLevels[name])
      ? currentLevels[name]
      : currentLevels[name] !== undefined && currentLevels[name] !== null
        ? [currentLevels[name]]
        : [0];

    const safeLevels = requestedLevels
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item))
      .map((item) => Math.max(0, Math.min(Math.trunc(item), matched.levels.length - 1)));

    const uniqueLevels = safeLevels.length > 0 ? Array.from(new Set(safeLevels)) : [0];

    for (const safeLevel of uniqueLevels) {
      fields.push({
        hierarchy: matched.hierarchy,
        level: matched.levels[safeLevel],
        dimensionLabel: matched.label,
        label: `${matched.label} / ${matched.levels[safeLevel]}`,
        name: `${matched.label} / ${matched.levels[safeLevel]}`,
      });
    }
  }

  return fields;
}

function getRowDimensionValue(rowDimensions, field) {
  return (
    rowDimensions[field.label] ??
    rowDimensions[field.dimensionLabel] ??
    rowDimensions[field.level] ??
    rowDimensions[`${field.hierarchy}::${field.level}`] ??
    "-"
  );
}

function normalizeText(value) {
  return String(value || "").trim();
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), "vi"));
}

function sortYears(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => Number(a) - Number(b));
}

function sortQuarters(values) {
  const quarterRank = (value) => {
    const normalized = String(value || "").trim().toUpperCase();
    if (normalized === "Q1") return 1;
    if (normalized === "Q2") return 2;
    if (normalized === "Q3") return 3;
    if (normalized === "Q4") return 4;
    return 999;
  };

  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => {
    const diff = quarterRank(a) - quarterRank(b);
    if (diff !== 0) {
      return diff;
    }
    return String(a).localeCompare(String(b), "vi");
  });
}

function sortMonths(values) {
  const monthOrder = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };

  const rank = (value) => {
    const normalized = String(value || "").trim().slice(0, 3).toLowerCase();
    return monthOrder[normalized] || 999;
  };

  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => {
    const diff = rank(a) - rank(b);
    if (diff !== 0) {
      return diff;
    }
    return String(a).localeCompare(String(b), "vi");
  });
}

function getTimeField(level) {
  const timeDimension = cubeDefinition.dimensions.find((dimension) => String(dimension?.label || "").toLowerCase() === "dim time");
  if (!timeDimension || !Array.isArray(timeDimension.levels) || !timeDimension.levels.includes(level)) {
    return null;
  }

  return {
    hierarchy: timeDimension.hierarchy,
    level,
    dimensionLabel: timeDimension.label,
    label: `${timeDimension.label} / ${level}`,
    name: `${timeDimension.label} / ${level}`,
  };
}

function getLocationField(level, factGroup) {
  const canonicalKey = resolveFactGroupCanonicalKey(factGroup);

  // Fact Inventory: lấy location từ DIM STORE
  if (canonicalKey === "factinventory") {
    const storeDimension = cubeDefinition.dimensions.find(
      (dimension) => String(dimension?.label || "") === "DIM STORE"
    );
    if (!storeDimension || !Array.isArray(storeDimension.levels) || !storeDimension.levels.includes(level)) {
      return null;
    }
    return {
      hierarchy: storeDimension.hierarchy,
      level,
      dimensionLabel: storeDimension.label,
      label: `${storeDimension.label} / ${level}`,
      name: `${storeDimension.label} / ${level}`,
    };
  }

  // Fact Sales và các fact group khác: lấy location từ DIM CUSTOMER
  const customerDimension = cubeDefinition.dimensions.find(
    (dimension) => String(dimension?.label || "") === "DIM CUSTOMER"
  );
  if (!customerDimension || !Array.isArray(customerDimension.levels) || !customerDimension.levels.includes(level)) {
    return null;
  }

  return {
    hierarchy: customerDimension.hierarchy,
    level,
    dimensionLabel: customerDimension.label,
    label: `${customerDimension.label} / ${level}`,
    name: `${customerDimension.label} / ${level}`,
  };
}

function getCustomerTypeField() {
  const customerDimension = cubeDefinition.dimensions.find(
    (dimension) => String(dimension?.label || "") === "DIM CUSTOMER"
  );

  if (!customerDimension || !Array.isArray(customerDimension.levels) || !customerDimension.levels.includes("CUSTOMER TYPE")) {
    return null;
  }

  return {
    hierarchy: customerDimension.hierarchy,
    level: "CUSTOMER TYPE",
    dimensionLabel: customerDimension.label,
    label: `${customerDimension.label} / CUSTOMER TYPE`,
    name: `${customerDimension.label} / CUSTOMER TYPE`,
  };
}

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/meta", (req, res) => {
  res.json(getCubeMeta());
});

router.get("/ui/meta", (req, res) => {
  const factGroup = String(req.query.factGroup || "").trim();
  res.json(getUiMetaFromCubeDefinition(factGroup));
});

router.post("/ui/data", async (req, res) => {
  try {
    const { selectedDimensions, selectedMeasures, currentLevels, filters, factGroup, filterUsage } = normalizeQueryPayload(req.body);
    const dimensionFields = buildDimensionFields(selectedDimensions, currentLevels);
    const factMeasureLabels = getMeasureLabelsByFactGroup(factGroup);
    const measureScope = new Set(factMeasureLabels.map((item) => item.toLowerCase()));
    const scopedSelectedMeasures =
      measureScope.size === 0
        ? selectedMeasures
        : selectedMeasures.filter((item) => measureScope.has(String(item || "").toLowerCase()));
    const effectiveMeasures = scopedSelectedMeasures.length > 0
      ? scopedSelectedMeasures
      : (factMeasureLabels.length > 0 ? factMeasureLabels : selectedMeasures);

    const queryResult = await fetchCubeSlice({
      factGroup,
      measures: effectiveMeasures,
      dimensionFields,
      hierarchy: dimensionFields[0]?.hierarchy,
      path: [],
      filters,
      filterUsage,
    });

    const effectiveDimensionFields = Array.isArray(queryResult.dimensionFields) && queryResult.dimensionFields.length > 0
      ? queryResult.dimensionFields
      : dimensionFields;

    const rows = (queryResult.rows || []).map((row) => {
      const dimensions = {};
      for (const field of effectiveDimensionFields) {
        dimensions[field.name] = getRowDimensionValue(row.dimensions || {}, field);
      }

      return {
        dimensions,
        measures: row.values || {},
      };
    });

    res.json({
      rows,
      selectedDimensions,
      selectedMeasures: queryResult.measures || effectiveMeasures,
      levels: currentLevels,
      factGroup: findFactGroup(factGroup)?.name || "",
    });
  } catch (error) {
    const providerMessage = error && typeof error.process === "object" ? error.process.message : "";
    res.status(400).json({
      error: providerMessage || error.message || "Failed to query cube ui data",
    });
  }
});

async function handleLocationOptions(req, res) {
  try {
    const payload = req.method === "GET"
      ? {
          factGroup: String(req.query.factGroup || "").trim(),
          filters: {
            year: req.query.year,
            quarter: req.query.quarter,
            month: req.query.month,
            state: req.query.state,
            city: req.query.city,
            customerType: req.query.customerType,
            productKey: req.query.productKey,
          },
        }
      : req.body;

    const { filters, factGroup, filterUsage } = normalizeQueryPayload(payload);
    const stateField = getLocationField("STATE", factGroup);
    const cityField = getLocationField("CITY", factGroup);

    if (!stateField || !cityField) {
      return res.json({ states: [], citiesByState: {} });
    }

    const baseFilters = {
      ...filters,
      state: "",
      city: "",
    };

    const stateResult = await fetchCubeSlice({
      factGroup,
      measures: [],
      dimensionFields: [stateField],
      hierarchy: stateField.hierarchy,
      path: [],
      filters: baseFilters,
      filterUsage,
    });

    const states = uniqueSorted(
      (stateResult.rows || []).map((row) => normalizeText(getRowDimensionValue(row.dimensions || {}, stateField)))
    );

    const cityResult = await fetchCubeSlice({
      factGroup,
      measures: [],
      dimensionFields: [stateField, cityField],
      hierarchy: stateField.hierarchy,
      path: [],
      filters: {
        ...baseFilters,
        // Khi lấy city options, không cần filter theo state (trả về tất cả cities theo tất cả states)
        state: [],
      },
      filterUsage,
    });

    const citiesByState = {};

    for (const row of cityResult.rows || []) {
      const state = normalizeText(getRowDimensionValue(row.dimensions || {}, stateField));
      const city = normalizeText(getRowDimensionValue(row.dimensions || {}, cityField));
      if (!state || !city) {
        continue;
      }

      if (!citiesByState[state]) {
        citiesByState[state] = [];
      }
      citiesByState[state].push(city);
    }

    for (const state of Object.keys(citiesByState)) {
      citiesByState[state] = uniqueSorted(citiesByState[state]);
    }

    res.json({
      states,
      citiesByState,
    });
  } catch (error) {
    const providerMessage = error && typeof error.process === "object" ? error.process.message : "";
    res.status(400).json({
      error: providerMessage || error.message || "Failed to load location options",
    });
  }
}

router.get("/ui/location-options", handleLocationOptions);
router.post("/ui/location-options", handleLocationOptions);

async function handleCustomerTypeOptions(req, res) {
  try {
    const payload = req.method === "GET"
      ? {
          factGroup: String(req.query.factGroup || "").trim(),
        }
      : req.body;

    const { factGroup, filterUsage } = normalizeQueryPayload(payload);
    const customerTypeField = getCustomerTypeField();

    if (!customerTypeField) {
      return res.json({ customerTypes: [] });
    }

    const factMeasures = getMeasureLabelsByFactGroup(factGroup);
    const queryMeasures = factMeasures.length > 0 ? [factMeasures[0]] : getAllMeasures().slice(0, 1).map((item) => measureLabelFromUniqueName(item));

    const result = await fetchCubeSlice({
      factGroup,
      measures: queryMeasures,
      dimensionFields: [customerTypeField],
      hierarchy: customerTypeField.hierarchy,
      path: [],
      filters: {},
      filterUsage,
    });

    const customerTypes = uniqueSorted(
      (result.rows || []).map((row) => normalizeText(getRowDimensionValue(row.dimensions || {}, customerTypeField)))
    );

    res.json({
      customerTypes,
    });
  } catch (error) {
    const providerMessage = error && typeof error.process === "object" ? error.process.message : "";
    res.status(400).json({
      error: providerMessage || error.message || "Failed to load customer type options",
    });
  }
}

router.get("/ui/customer-type-options", handleCustomerTypeOptions);
router.post("/ui/customer-type-options", handleCustomerTypeOptions);

async function handleTimeOptions(req, res) {
  try {
    const payload = req.method === "GET"
      ? {
          factGroup: String(req.query.factGroup || "").trim(),
          filters: {
            year: req.query.year,
            quarter: req.query.quarter,
            month: req.query.month,
            state: req.query.state,
            city: req.query.city,
            customerType: req.query.customerType,
            productKey: req.query.productKey,
          },
        }
      : req.body;

    const { filters, factGroup, filterUsage } = normalizeQueryPayload(payload);
    const yearField = getTimeField("Year");
    const quarterField = getTimeField("Quarter");
    const monthField = getTimeField("Month");

    if (!yearField || !quarterField || !monthField) {
      return res.json({ years: [], quarters: [], months: [] });
    }

    const baseFilters = {
      ...filters,
      // Xóa time filters để lấy tất cả options có sẵn (FE tự validate)
      year: [],
      quarter: [],
      month: [],
    };

    const yearResult = await fetchCubeSlice({
      factGroup,
      measures: [],
      dimensionFields: [yearField],
      hierarchy: yearField.hierarchy,
      path: [],
      filters: baseFilters,
      filterUsage,
    });

    const years = sortYears(
      (yearResult.rows || []).map((row) => normalizeText(getRowDimensionValue(row.dimensions || {}, yearField)))
    );

    const quarterResult = await fetchCubeSlice({
      factGroup,
      measures: [],
      dimensionFields: [yearField, quarterField],
      hierarchy: yearField.hierarchy,
      path: [],
      filters: baseFilters, // không filter theo year để lấy tất cả quarters
      filterUsage,
    });

    const quarters = sortQuarters(
      (quarterResult.rows || []).map((row) => normalizeText(getRowDimensionValue(row.dimensions || {}, quarterField)))
    );

    const monthResult = await fetchCubeSlice({
      factGroup,
      measures: [],
      dimensionFields: [yearField, quarterField, monthField],
      hierarchy: yearField.hierarchy,
      path: [],
      filters: baseFilters, // không filter theo year/quarter để lấy tất cả months
      filterUsage,
    });

    const months = sortMonths(
      (monthResult.rows || []).map((row) => normalizeText(getRowDimensionValue(row.dimensions || {}, monthField)))
    );

    res.json({
      years,
      quarters,
      months,
    });
  } catch (error) {
    const providerMessage = error && typeof error.process === "object" ? error.process.message : "";
    res.status(400).json({
      error: providerMessage || error.message || "Failed to load time options",
    });
  }
}

router.get("/ui/time-options", handleTimeOptions);
router.post("/ui/time-options", handleTimeOptions);

router.post("/query", async (req, res) => {
  try {
    const payload = req.body || {};
    const { selectedDimensions, selectedMeasures, currentLevels, filters, factGroup, filterUsage } = normalizeQueryPayload(payload);
    const dimensionFields = Array.isArray(payload.dimensionFields) && payload.dimensionFields.length > 0
      ? payload.dimensionFields
      : buildDimensionFields(selectedDimensions, currentLevels);
    const measures = Array.isArray(payload.measures) && payload.measures.length > 0
      ? payload.measures
      : selectedMeasures;
    const data = await fetchCubeSlice({
      hierarchy: payload.hierarchy,
      path: Array.isArray(payload.path) ? payload.path : [],
      measures,
      dimensionFields,
      filters,
      filterUsage,
      factGroup,
    });
    res.json(data);
  } catch (error) {
    const providerMessage = error && typeof error.process === "object" ? error.process.message : "";
    res.status(400).json({
      error: providerMessage || error.message || "Failed to query cube",
    });
  }
});

module.exports = { cubeRoutes: router };
