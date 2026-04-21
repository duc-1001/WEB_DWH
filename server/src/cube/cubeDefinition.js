const cubeDefinition = {
  cubeName: process.env.CUBE_NAME || "DWH",
  dimensions: [
    {
      label: "DIM CUSTOMER",
      hierarchy: "[DIM CUSTOMER].[Hierarchy]",
      levels: ["CITY", "CUSTOMER KEY", "CUSTOMER NAME", "CUSTOMER TYPE", "LOCATION KEY", "STATE"],
    },
    {
      label: "DIM STORE",
      hierarchy: "[DIM STORE].[Hierarchy]",
      levels: ["CITY", "STATE", "STORE KEY", "STORE NAME"],
    },
    {
      label: "DIM PRODUCT",
      hierarchy: "[DIM PRODUCT].[PRODUCT KEY]",
      levels: ["DESCRIPTION", "PRODUCT KEY", "PRODUCT SIZE", "WEIGHT"],
    },
    {
      label: "Dim Time",
      hierarchy: "[Dim Time].[Hierarchy]",
      levels: ["Month", "Quarter", "Time Key", "Year"],
    },
  ],
  measureGroups: [
    {
      name: "Fact Inventory",
      measures: [
        "[Measures].[Quantity On Hand]",
      ],
    },
    {
      name: "Fact Sales",
      measures: [
        "[Measures].[Quantity Ordered]",
        "[Measures].[Total Amount]",
      ],
    },
  ],
};

function getAllMeasures() {
  return cubeDefinition.measureGroups.flatMap((group) => group.measures);
}

function getDefaultHierarchy() {
  return cubeDefinition.dimensions[0];
}

function getDefaultMeasures() {
  return getAllMeasures();
}

module.exports = {
  cubeDefinition,
  getAllMeasures,
  getDefaultHierarchy,
  getDefaultMeasures,
};