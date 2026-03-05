const excludedTypes = ["Organization", "WebSite", "BreadcrumbList"];

if (type === "podcasts") {
  excludedTypes.push("BlogPosting");
}

let filteredGraph = schema["@graph"].filter((item: any) => {
  const itemType = item["@type"];
  // Convert to array so we don't have to write separate logic for strings vs arrays
  const types = Array.isArray(itemType) ? itemType : [itemType];
  
  // Return true only if NONE of the types match our excluded list
  return !types.some((t: string) => excludedTypes.includes(t));
});
