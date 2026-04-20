const { getConnection } = require("./connection");
const { config } = require("../config/env");
const { buildMdxQuery, normalizeMeasureName } = require("./mdxBuilder");
const {
  cubeDefinition,
  getAllMeasures,
  getDefaultHierarchy,
  getDefaultMeasures,
} = require("./cubeDefinition");

function toNumericIfPossible(value) {
  if (value === null || value === undefined) {
    return value;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : value;
}

function getCubeName(factGroup) {
  const normalized = String(factGroup || "").toLowerCase();
  if (normalized.includes("inventory")) {
    return config.cubeInventoryName;
  }
  if (normalized.includes("sales")) {
    return config.cubeSalesName;
  }
  return config.cubeName || config.cubeSalesName;
}

function findValueByKey(row, candidateKeys) {
  const normalizedEntries = Object.keys(row).map((key) => ({
    key,
    normalized: key.toLowerCase(),
  }));

  for (const candidate of candidateKeys) {
    const normalizedCandidate = String(candidate || "").toLowerCase();
    if (!normalizedCandidate) {
      continue;
    }

    const exact = normalizedEntries.find((entry) => entry.normalized === normalizedCandidate);
    if (exact) {
      return row[exact.key];
    }

    const suffix = normalizedEntries.find((entry) => entry.normalized.endsWith(normalizedCandidate));
    if (suffix) {
      return row[suffix.key];
    }
  }

  return undefined;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getFormattedDimensionValue(row, candidateKeys) {
  for (const candidate of candidateKeys) {
    const value = row?.dimensions?.[candidate];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return "";
}

function matchesFilter(actualValue, expectedValue) {
  const actual = normalizeText(actualValue);
  const expected = normalizeText(expectedValue);

  if (!expected) {
    return true;
  }

  return actual === expected || actual.includes(expected);
}

function isActiveFilterValue(value) {
  // Hỗ trợ cả string và string[] (multi-select)
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  const normalized = normalizeText(value);
  if (!normalized) {
    return false;
  }

  return normalized !== "all" && normalized !== "tat ca" && normalized !== "tất cả" && normalized !== "both";
}

function normalizeCustomerTypeFilterValue(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  if (normalized === "business" || normalized === "khach buu dien" || normalized === "khách bưu điện") {
    return "Khách hàng bưu điện";
  }

  if (normalized === "travel" || normalized === "khach du lich" || normalized === "khách du lịch") {
    return "Khách hàng du lịch";
  }

  return String(value || "").trim();
}

// Hàm kiểm tra một giá trị có khớp với filter không
// filter có thể là string (single) hoặc string[] (multi-select → OR logic)
function matchesMultiFilter(actualValue, filterValue) {
  if (!isActiveFilterValue(filterValue)) return true; // không lọc

  if (Array.isArray(filterValue)) {
    // OR logic: khớp bất kỳ giá trị nào trong array
    return filterValue.some((v) => matchesFilter(actualValue, v));
  }

  return matchesFilter(actualValue, filterValue);
}

function applyFilters(rows, filters = {}) {
  const hasProductKey = isActiveFilterValue(filters.productKey);
  const hasYear = isActiveFilterValue(filters.year);
  const hasQuarter = isActiveFilterValue(filters.quarter);
  const hasMonth = isActiveFilterValue(filters.month);
  const hasCustomerType = isActiveFilterValue(filters.customerType);
  const hasState = isActiveFilterValue(filters.state);
  const hasCity = isActiveFilterValue(filters.city);
  const hasStoreKey = isActiveFilterValue(filters.storeKey || filters.locationKey);

  // Chuẩn hóa customerType (string only)
  const customerTypeVal = hasCustomerType
    ? normalizeCustomerTypeFilterValue(String(Array.isArray(filters.customerType) ? filters.customerType[0] : filters.customerType || ""))
    : "";

  return rows.filter((row) => {
    if (hasProductKey) {
      const productKey = filters.productKey;
      const rowProductKey = getFormattedDimensionValue(row, [
        "PRODUCT KEY",
        "DIM PRODUCT / PRODUCT KEY",
        "[DIM PRODUCT].[PRODUCT KEY]::PRODUCT KEY",
      ]);
      const rowDescription = getFormattedDimensionValue(row, [
        "DESCRIPTION",
        "DIM PRODUCT / DESCRIPTION",
        "[DIM PRODUCT].[PRODUCT KEY]::DESCRIPTION",
      ]);

      if (!matchesMultiFilter(rowProductKey, productKey) && !matchesMultiFilter(rowDescription, productKey)) {
        return false;
      }
    }

    if (hasYear) {
      const rowYear = getFormattedDimensionValue(row, ["Year", "DIM TIME / Year", "Dim Time / Year", "[Dim Time].[Hierarchy]::Year"]);
      if (!matchesMultiFilter(rowYear, filters.year)) return false;
    }

    if (hasQuarter) {
      const rowQuarter = getFormattedDimensionValue(row, [
        "Quarter",
        "DIM TIME / Quarter",
        "Dim Time / Quarter",
        "[Dim Time].[Hierarchy]::Quarter",
      ]);
      if (!matchesMultiFilter(rowQuarter, filters.quarter)) return false;
    }

    if (hasMonth) {
      const rowMonth = getFormattedDimensionValue(row, [
        "Month",
        "DIM TIME / Month",
        "Dim Time / Month",
        "[Dim Time].[Hierarchy]::Month",
      ]);
      if (!matchesMultiFilter(rowMonth, filters.month)) return false;
    }

    if (hasCustomerType && customerTypeVal) {
      const rowCustomerType = getFormattedDimensionValue(row, [
        "CUSTOMER TYPE",
        "DIM CUSTOMER / CUSTOMER TYPE",
      ]);
      if (!matchesFilter(rowCustomerType, customerTypeVal)) return false;
    }

    if (hasState) {
      const rowState = getFormattedDimensionValue(row, ["STATE", "DIM LOCATION / STATE", "DIM STORE / STATE"]);
      if (!matchesMultiFilter(rowState, filters.state)) return false;
    }

    if (hasCity) {
      const rowCity = getFormattedDimensionValue(row, ["CITY", "DIM LOCATION / CITY", "DIM STORE / CITY"]);
      if (!matchesMultiFilter(rowCity, filters.city)) return false;
    }

    if (hasStoreKey) {
      const storeKeyVal = filters.storeKey || filters.locationKey;
      const rowStoreKey = getFormattedDimensionValue(row, [
        "DIM LOCATION / LOCATION KEY",
        "LOCATION KEY",
        "STORE KEY",
        "DIM STORE / STORE KEY",
        "DIM STORE / LOCATION KEY",
      ]);
      if (!matchesMultiFilter(rowStoreKey, storeKeyVal)) return false;
    }

    return true;
  });
}

function measureLabelFromUniqueName(measureUniqueName) {
  return measureUniqueName.replace("[Measures].[", "").replace("]", "");
}

function fieldKeyFromParts(hierarchy, level) {
  return `${hierarchy}::${level}`;
}

function normalizeDimensionField(field) {
  const hierarchy = String(field?.hierarchy || "").trim();
  const level = String(field?.level || "").replace(/\[|\]/g, "").trim();
  return {
    hierarchy,
    level,
    key: fieldKeyFromParts(hierarchy, level),
  };
}

function buildDimensionCandidateKeys(field, index) {
  const hierarchy = String(field?.hierarchy || "").replace(/\[|\]/g, "").trim();
  const level = String(field?.level || "").replace(/\[|\]/g, "").trim();
  const label = String(field?.dimensionLabel || "").trim();
  const safeDimension = label.replace(/\[|\]/g, "").trim();

  return [
    `__Dim${index}Caption`,
    `__Dim${index}UniqueName`,
    `[${safeDimension}].[${level}].[${level}].[MEMBER_CAPTION]`,
    `[${safeDimension}].[${level}].[${level}].[MEMBER_UNIQUE_NAME]`,
    `[${safeDimension}].[${level}].[MEMBER_CAPTION]`,
    `[${safeDimension}].[${level}].[MEMBER_UNIQUE_NAME]`,
    field.key,
    field.level,
    field.label,
    level,
    `${hierarchy}.${level}`,
    `${hierarchy} ${level}`,
    `${hierarchy}.MEMBER_CAPTION`,
    `${hierarchy}.MEMBER_UNIQUE_NAME`,
    `${level}.MEMBER_CAPTION`,
    `${level}.MEMBER_UNIQUE_NAME`,
    `${label}.MEMBER_CAPTION`,
    `${label}.MEMBER_UNIQUE_NAME`,
  ].filter(Boolean);
}

function getHierarchyDefinition(hierarchyUniqueName) {
  return cubeDefinition.dimensions.find((item) => item.hierarchy === hierarchyUniqueName);
}

function formatRows(rawRows, measures, dimensionFields = []) {
  return rawRows.map((row) => {
    const caption = findValueByKey(row, ["__RowCaption", "RowCaption"]) || "(No caption)";
    const uniqueName = findValueByKey(row, ["__RowUniqueName", "RowUniqueName"]);

    const dimensions = {};
    dimensionFields.forEach((field, index) => {
      const candidateKeys = buildDimensionCandidateKeys(field, index);
      const value = findValueByKey(row, candidateKeys);
      const resolved = value ?? findValueByKey(row, [field.key, field.level, field.dimensionLabel, field.label]) ?? "-";

      dimensions[field.key] = resolved;
      dimensions[field.level] = resolved;
      dimensions[field.label] = resolved;
      dimensions[field.dimensionLabel] = resolved;
    });

    const values = {};
    for (const measure of measures) {
      const measureUniqueName = normalizeMeasureName(measure);
      const measureLabel = measureLabelFromUniqueName(measureUniqueName);
      const measureValue =
        row[measureUniqueName] ??
        row[measureLabel] ??
        findValueByKey(row, [measureUniqueName, measureLabel]);

      values[measureLabel] = toNumericIfPossible(measureValue);
    }

    return {
      caption,
      uniqueName,
      key:
        dimensionFields.length > 0
          ? dimensionFields.map((field) => dimensions[field.key]).join("|")
          : uniqueName || caption,
      dimensions,
      values,
    };
  });
}

function resolveDimensionFields(requestedFields) {
  const allowedFields = [];

  for (const dimension of cubeDefinition.dimensions) {
    for (const level of dimension.levels || []) {
      const normalized = normalizeDimensionField({ hierarchy: dimension.hierarchy, level });
      allowedFields.push({
        ...normalized,
        label: `${dimension.label} / ${normalized.level}`,
        dimensionLabel: dimension.label,
        name: `${dimension.label} / ${normalized.level}`,
      });
    }
  }

  const allowedMap = new Map(allowedFields.map((field) => [field.key, field]));

  if (!Array.isArray(requestedFields) || requestedFields.length === 0) {
    return [];
  }

  const resolved = [];
  const seen = new Set();

  for (const item of requestedFields) {
    const normalized = normalizeDimensionField(item);
    const matched = allowedMap.get(normalized.key);
    if (!matched || seen.has(matched.key)) {
      continue;
    }
    seen.add(matched.key);
    resolved.push(matched);
  }

  return resolved;
}

function getDimensionByLabel(label) {
  return cubeDefinition.dimensions.find((dimension) => String(dimension?.label || "") === label);
}

function buildResolvedFieldFromDimensionLevel(dimension, level) {
  if (!dimension || !Array.isArray(dimension.levels) || !dimension.levels.includes(level)) {
    return null;
  }

  const normalized = normalizeDimensionField({ hierarchy: dimension.hierarchy, level });
  return {
    ...normalized,
    label: `${dimension.label} / ${normalized.level}`,
    dimensionLabel: dimension.label,
    name: `${dimension.label} / ${normalized.level}`,
  };
}

function getLocationResolvedField(level, factGroup) {
  const locationDimension = getDimensionByLabel("DIM LOCATION");
  const storeDimension = getDimensionByLabel("DIM STORE");
  const isInventory = String(factGroup || "").toLowerCase().includes("inventory");

  if (isInventory) {
    // CUBE_INVENTORY chi co DIM STORE, khong co DIM LOCATION
    return (
      buildResolvedFieldFromDimensionLevel(storeDimension, level) ||
      buildResolvedFieldFromDimensionLevel(locationDimension, level)
    );
  }

  // CUBE_SALES dung DIM LOCATION
  return (
    buildResolvedFieldFromDimensionLevel(locationDimension, level) ||
    buildResolvedFieldFromDimensionLevel(storeDimension, level)
  );
}

function getTimeResolvedField(level) {
  const timeDimension = getDimensionByLabel("Dim Time");
  return buildResolvedFieldFromDimensionLevel(timeDimension, level);
}

function getCustomerTypeResolvedField() {
  const customerDimension = getDimensionByLabel("DIM CUSTOMER");
  return buildResolvedFieldFromDimensionLevel(customerDimension, "CUSTOMER TYPE");
}

function getProductResolvedField(level) {
  const productDimension = getDimensionByLabel("DIM PRODUCT");
  return buildResolvedFieldFromDimensionLevel(productDimension, level);
}

function ensureFilterDimensionFields(
  selectedFields,
  filters = {},
  filterUsage = {},
  factGroup = ""
) {
  const resolved = Array.isArray(selectedFields) ? [...selectedFields] : [];
  const seen = new Set(resolved.map((f) => f.key));

  const addField = (field) => {
    if (!field || seen.has(field.key)) return;
    seen.add(field.key);
    resolved.push(field);
  };

  const normalize = (v) => String(v || "").trim().toLowerCase();

  // Hỗ trợ cả string và string[] cho isAll / isActive
  const isAll = (v) => {
    if (Array.isArray(v)) return v.length === 0;
    const n = normalize(v);
    return !n || n === "all" || n === "tat ca" || n === "tất cả";
  };

  const isActive = (v) => !isAll(v);

  const isFactSales = String(factGroup).toLowerCase().includes("sales");

  // =========================
  // LOCATION
  // =========================

  const hasState = isActive(filters.state);
  const hasCity = isActive(filters.city);

  const isStateAll = isAll(filters.state) && filterUsage?.state !== false;
  const isCityAll = isAll(filters.city) && filterUsage?.city !== false;

  if (hasState || hasCity) {
    const stateField = getLocationResolvedField("STATE", factGroup);
    if (stateField) addField(stateField);
  }

  if (hasCity) {
    const cityField = getLocationResolvedField("CITY", factGroup);
    if (cityField) addField(cityField);
  }

  if (isStateAll) {
    const stateField = getLocationResolvedField("STATE", factGroup);
    if (stateField) addField(stateField);
  } else if (isCityAll) {
    const cityField = getLocationResolvedField("CITY", factGroup);
    if (cityField) addField(cityField);
  }

  // =========================
  // CUSTOMER TYPE
  // =========================

  if (isActive(filters.customerType)) {
    const field = getCustomerTypeResolvedField();
    if (field) addField(field);
  }

  // =========================
  // PRODUCT
  // =========================

  if (isActive(filters.productKey)) {
    const field =
      getProductResolvedField("PRODUCT KEY") ||
      getProductResolvedField("DESCRIPTION");

    if (field) addField(field);
  }

  // =========================
  // TIME HIERARCHY
  // =========================

  const yearField = getTimeResolvedField("Year");
  const quarterField = getTimeResolvedField("Quarter");
  const monthField = getTimeResolvedField("Month");

  const hasYear = isActive(filters.year);
  const hasQuarter = isActive(filters.quarter);
  const hasMonth = isActive(filters.month);

  // Year luôn có
  if (yearField && filterUsage?.year !== false) {
    addField(yearField);
  }

  // Quarter xuất hiện nếu:
  // - quarter filter có value
  // - hoặc year có value
  if (
    quarterField &&
    filterUsage?.quarter !== false &&
    (hasQuarter || hasYear)
  ) {
    addField(quarterField);
  }

  // Month xuất hiện nếu:
  // - month filter có value
  // - hoặc quarter có value
  if (
    monthField &&
    filterUsage?.month !== false &&
    (hasMonth || hasQuarter)
  ) {
    addField(monthField);

    // Inventory cần thêm Time Key
    if (!isFactSales) {
      const timeKeyField = getTimeResolvedField("Time Key");
      if (timeKeyField) addField(timeKeyField);
    }
  }

  return resolved;
}

function resolveMeasures(requestedMeasures, factGroup) {
  let fallbackMeasures = getDefaultMeasures();
  
  if (factGroup) {
    const normalizedGroup = String(factGroup).toLowerCase();
    const isInventory = normalizedGroup.includes("inventory");
    const isSales = normalizedGroup.includes("sales");
    
    const targetGroup = cubeDefinition.measureGroups.find(g => {
      const name = String(g.name).toLowerCase();
      if (isInventory && name.includes("inventory")) return true;
      if (isSales && name.includes("sales")) return true;
      return false;
    });
    
    if (targetGroup && Array.isArray(targetGroup.measures) && targetGroup.measures.length > 0) {
      fallbackMeasures = targetGroup.measures;
    }
  }

  if (!Array.isArray(requestedMeasures) || requestedMeasures.length === 0) {
    return fallbackMeasures.map(item => normalizeMeasureName(item));
  }

  const allowedMeasures = getAllMeasures();
  const allowed = new Set(allowedMeasures.map((item) => normalizeMeasureName(item)));
  const normalized = requestedMeasures.map((item) => normalizeMeasureName(item));

  return normalized.filter((item) => allowed.has(item));
}

function isAllMembersHierarchyError(error) {
  const providerMessage = error && typeof error.process === "object" ? error.process.message : "";
  const message = `${providerMessage || ""} ${error?.message || ""}`.toLowerCase();
  return message.includes("allmembers") && message.includes("hierarchy expression");
}

async function probeValidFields({ cubeName, hierarchy, path, measures, selectedFields, filters = {} }) {
  const validFields = [];
  const probeMeasures = measures.length > 0 ? [measures[0]] : [];

  for (const field of selectedFields) {
    try {
      const mdxQuery = buildMdxQuery({
        cubeName,
        hierarchy,
        path,
        measures: probeMeasures,
        dimensionFields: [field],
        filters,
      });
      await getConnection().query(mdxQuery);
      validFields.push(field);
    } catch (error) {
      // Ignore invalid field in fallback mode.
    }
  }

  return validFields;
}


// Clean filters: loại bỏ các trường không sử dụng ('all', '', null, undefined)
// Hỗ trợ cả string và string[] (multi-select)
function cleanFilters(filters) {
  const cleaned = {};
  for (const key in filters) {
    const value = filters[key];
    if (Array.isArray(value)) {
      // Giữ array nếu có ít nhất 1 phần tử hợp lệ
      const validItems = value.filter(v => {
        const n = String(v ?? '').trim().toLowerCase();
        return n && n !== 'all' && n !== 'tat ca' && n !== 'tất cả';
      });
      if (validItems.length > 0) {
        cleaned[key] = validItems;
      }
    } else {
      const n = String(value ?? '').trim().toLowerCase();
      if (n && n !== 'all' && n !== 'tat ca' && n !== 'tất cả') {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

async function fetchCubeSlice({ factGroup = "", hierarchy, path = [], measures = [], dimensionFields = [], filters = {}, filterUsage = {} }) {
  const hierarchyDefinition = getHierarchyDefinition(hierarchy) || getDefaultHierarchy();
  const requestedFields = resolveDimensionFields(dimensionFields);
  // Clean filters before using
  const cleanedFilters = cleanFilters(filters);
  const selectedFields = ensureFilterDimensionFields(requestedFields, cleanedFilters, filterUsage, factGroup);

  const selectedMeasures = resolveMeasures(measures, factGroup);
  if (selectedMeasures.length === 0) {
    throw new Error("No valid measures selected");
  }

  const resolvedCubeName = getCubeName(factGroup);

  const baseQueryInput = {
    cubeName: resolvedCubeName,
    hierarchy: selectedFields[0]?.hierarchy || hierarchyDefinition.hierarchy,
    path,
    measures: selectedMeasures,
    dimensionFields: selectedFields,
    filters: cleanedFilters,
  };

  let effectiveFields = selectedFields;
  let rawRows;

  try {
    const mdxQuery = buildMdxQuery(baseQueryInput);
    rawRows = await getConnection().query(mdxQuery);
  } catch (error) {
    if (!isAllMembersHierarchyError(error)) {
      throw error;
    }

    const validFields = await probeValidFields({
      cubeName: resolvedCubeName,
      hierarchy: baseQueryInput.hierarchy,
      path,
      measures: selectedMeasures,
      selectedFields,
      filters: cleanedFilters,
    });

    if (validFields.length === 0) {
      throw new Error("Selected dimension fields are not queryable in this cube structure");
    }

    effectiveFields = validFields;
    const retryQuery = buildMdxQuery({
      ...baseQueryInput,
      dimensionFields: effectiveFields,
    });
    rawRows = await getConnection().query(retryQuery);
  }

  const rows = applyFilters(formatRows(rawRows, selectedMeasures, effectiveFields), cleanedFilters);

  return {
    rows,
    path: [],
    hierarchy: selectedFields[0]?.hierarchy || hierarchyDefinition.hierarchy,
    hierarchyLabel: effectiveFields.length > 0 ? "Custom Selection" : "Grand Total",
    levels: effectiveFields.map((field) => field.level),
    dimensionFields: effectiveFields,
    measures: selectedMeasures.map((item) => measureLabelFromUniqueName(normalizeMeasureName(item))),
    canRollUp: false,
  };
}

function getCubeMeta() {
  return {
    cubeName: cubeDefinition.cubeName,
    dimensions: cubeDefinition.dimensions,
    measureGroups: cubeDefinition.measureGroups,
    allMeasures: getAllMeasures(),
    defaultHierarchy: getDefaultHierarchy(),
    defaultMeasures: getDefaultMeasures(),
  };
}

module.exports = {
  fetchCubeSlice,
  getCubeMeta,
};
