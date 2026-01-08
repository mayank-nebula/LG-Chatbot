// Define what each ID means
export const CATEGORY_MAP: Record<number, string> = {
  5340: "Technology",
  5928: "Information",
  1234: "Business",
  5555: "Science",
  // ... add the rest
};

// Define "Super Categories" (Frontend Groups)
export const CATEGORY_GROUPS: Record<string, number[]> = {
  "tech-and-info": [5340, 5928],
  "business-and-science": [1234, 5555],
  "all-tech": [5340],
};
