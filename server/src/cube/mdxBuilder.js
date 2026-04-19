const SAFE_ID_PATTERN = /^[A-Za-z0-9_\-\.\[\]&\s]+$/;

function normalizeMeasureName(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("[Measures].")) {
    return trimmed;
  }

  return `[Measures].[${trimmed.replace(/\[|\]/g, "")}]`;
}

function sanitizeIdentifier(identifier, label) {
  if (!identifier || !SAFE_ID_PATTERN.test(identifier)) {
    throw new Error(`Invalid ${label}`);
  }

  return identifier;
}

function buildRowSet(hierarchy, path) {
  if (!Array.isArray(path) || path.length === 0) {
    return `${hierarchy}.Levels(0).Members`;
  }

  const targetMember = sanitizeIdentifier(path[path.length - 1], "member path");
  return `{ ${targetMember}.Children }`;
}

function sanitizeBracketName(value) {
  return String(value || "").replace(/\[|\]/g, "").trim();
}

function parseBracketSegments(identifier) {
  const matches = String(identifier || "").match(/\[([^\]]+)\]/g) || [];
  return matches.map((item) => item.replace(/\[|\]/g, "").trim());
}

function toBracketIdentifier(value, label) {
  const safe = sanitizeBracketName(value);
  if (!safe) {
    throw new Error(`Invalid ${label}`);
  }
  sanitizeIdentifier(`[${safe}]`, label);
  return `[${safe}]`;
}

function buildLevelUniqueName(hierarchy, level) {
  const safeHierarchy = sanitizeIdentifier(hierarchy, "hierarchy");
  const levelName = sanitizeBracketName(level);
  if (!levelName) {
    throw new Error("Invalid level");
  }

  const segments = parseBracketSegments(safeHierarchy);
  const dimensionName = segments[0];
  const hierarchyName = segments[1] || "";
  const normalizedHierarchyName = hierarchyName.toLowerCase();
  const normalizedLevelName = levelName.toLowerCase();

  // Generic hierarchies like [DIM CUSTOMER].[Hierarchy] usually expose attributes
  // as separate hierarchies ([DIM CUSTOMER].[CUSTOMER NAME].[CUSTOMER NAME]).
  // Use attribute hierarchy form to avoid treating [Hierarchy].[Level] as a member.
  if (normalizedHierarchyName === "hierarchy") {
    if (!dimensionName) {
      return `${safeHierarchy}.${toBracketIdentifier(levelName, "level")}`;
    }

    const dimensionId = toBracketIdentifier(dimensionName, "dimension");
    const levelId = toBracketIdentifier(levelName, "level");
    return `${dimensionId}.${levelId}.${levelId}`;
  }

  if (normalizedHierarchyName === normalizedLevelName) {
    return `${safeHierarchy}.${toBracketIdentifier(levelName, "level")}`;
  }

  if (!dimensionName) {
    return `${safeHierarchy}.${toBracketIdentifier(levelName, "level")}`;
  }

  const dimensionId = toBracketIdentifier(dimensionName, "dimension");
  const levelId = toBracketIdentifier(levelName, "level");
  return `${dimensionId}.${levelId}.${levelId}`;
}

function buildAllMembersExpression(field) {
  const levelUniqueName = buildLevelUniqueName(field.hierarchy, field.level);
  return `${levelUniqueName}.ALLMEMBERS`;
}

function normalizeFilterMap(filters = {}) {
  const map = {};
  if (!filters || typeof filters !== "object") {
    return map;
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) {
      continue;
    }

    const normalizedKey = String(key || "").trim().toLowerCase();
    const normalizedValue = String(value || "").trim();
    if (!normalizedKey || !normalizedValue || normalizedValue.toLowerCase() === "all") {
      continue;
    }

    map[normalizedKey] = normalizedValue;
  }

  return map;
}

function escapeMdxString(value) {
  return String(value || "").replace(/"/g, '""');
}

function resolveFilterValueForField(field, filtersMap) {
  const level = String(field?.level || "").trim().toLowerCase();

  if (level === "product key") {
    return filtersMap.productkey || filtersMap["product key"];
  }
  if (level === "description") {
    return filtersMap.description;
  }
  if (level === "year") {
    return filtersMap.year;
  }
  if (level === "quarter") {
    return filtersMap.quarter;
  }
  if (level === "month") {
    return filtersMap.month;
  }
  if (level === "state") {
    return filtersMap.state;
  }
  if (level === "city") {
    return filtersMap.city;
  }
  if (level === "store key") {
    return (
      filtersMap.storekey ||
      filtersMap["store key"] ||
      filtersMap.locationkey ||
      filtersMap["location key"]
    );
  }
  if (level === "location key") {
    return (
      filtersMap.locationkey ||
      filtersMap["location key"] ||
      filtersMap.storekey ||
      filtersMap["store key"]
    );
  }

  return undefined;
}

function buildFilteredMembersExpression(field, filtersMap) {
  const levelUniqueName = buildLevelUniqueName(field.hierarchy, field.level);
  const setExpr = `${levelUniqueName}.ALLMEMBERS`;
  // For now, skip MDX-level filtering to avoid syntax issues
  // Backend applyFilters will handle filtering after cube returns data
  return setExpr;
}

function buildCrossJoinRowSet(dimensionFields, filters = {}) {
  if (!Array.isArray(dimensionFields) || dimensionFields.length === 0) {
    throw new Error("At least one dimension field must be selected");
  }

  const filtersMap = normalizeFilterMap(filters);
  const sets = dimensionFields.map((field) => buildFilteredMembersExpression(field, filtersMap));

  if (sets.length === 1) {
    return `{ ${sets[0]} }`;
  }

  return `{ (${sets.join(" * ")}) }`;
}

function buildMdxQuery({ cubeName, hierarchy, path, measures, dimensionFields = [], filters = {} }) {
  const safeCube = sanitizeIdentifier(cubeName, "cube name");

  const selectedMeasures = measures.map((item) => sanitizeIdentifier(normalizeMeasureName(item), "measure"));
  const useFieldMode = Array.isArray(dimensionFields) && dimensionFields.length > 0;

  if (!useFieldMode) {
    return `
SELECT
  NON EMPTY { ${selectedMeasures.join(", ")} } ON COLUMNS
FROM [${safeCube.replace(/\[|\]/g, "")}]
`;
  }

  const safeHierarchy = hierarchy ? sanitizeIdentifier(hierarchy, "hierarchy") : "";
  const rowSet = useFieldMode ? buildCrossJoinRowSet(dimensionFields, filters) : buildRowSet(safeHierarchy, path);

  return `
SELECT
  NON EMPTY { ${selectedMeasures.join(", ")} } ON COLUMNS,
  NON EMPTY ${rowSet} DIMENSION PROPERTIES MEMBER_CAPTION, MEMBER_UNIQUE_NAME ON ROWS
FROM [${safeCube.replace(/\[|\]/g, "")}]
`;
}

module.exports = {
  buildMdxQuery,
  normalizeMeasureName,
};
