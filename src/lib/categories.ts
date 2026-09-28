export type CategoryGroup = {
  name: string;
  icon: string;
  subcategories: string[];
};

export const EXPENSE_CATEGORIES: CategoryGroup[] = [
  {
    name: "Housing",
    icon: "Home",
    subcategories: ["Rent", "Kahramaa (Electricity & Water)", "Internet (Ooredoo/Vodafone)", "Maintenance"],
  },
  {
    name: "Food",
    icon: "UtensilsCrossed",
    subcategories: ["Groceries", "Restaurants", "Talabat", "Snoonu", "Coffee"],
  },
  {
    name: "Transportation",
    icon: "Car",
    subcategories: ["Fuel", "Uber", "Karwa", "Metro", "Car Maintenance"],
  },
  {
    name: "Personal",
    icon: "ShoppingBag",
    subcategories: ["Shopping", "Clothing", "Electronics", "Entertainment", "Gym", "Personal Care"],
  },
  {
    name: "Subscriptions",
    icon: "Repeat",
    subcategories: ["Netflix", "Spotify", "Cloud Storage", "Software", "Ooredoo/Vodafone Plan", "Other Subscriptions"],
  },
  {
    name: "Family",
    icon: "Users",
    subcategories: ["Family Transfers", "Gifts", "Other"],
  },
  {
    name: "Travel",
    icon: "Plane",
    subcategories: ["Qatar Travel", "International Travel"],
  },
  {
    name: "Other",
    icon: "MoreHorizontal",
    subcategories: ["Miscellaneous"],
  },
];

export const PAYMENT_METHODS = ["Cash", "Debit Card", "Credit Card", "Bank Transfer", "Mobile Wallet"];

export const INVESTMENT_CATEGORIES = [
  "Cash / Savings",
  "Fixed-income / Sukuk",
  "ETFs",
  "Index Funds",
  "Stocks",
  "Gold",
  "Other",
];

export const RISK_PROFILES: Record<string, { label: string; description: string; typicalAssets: string[] }> = {
  Conservative: {
    label: "Conservative",
    description:
      "Prioritizes capital preservation over growth. Typically favored by people with a short time horizon or low tolerance for value swings.",
    typicalAssets: ["Cash / Savings", "Fixed-income / Sukuk", "Money market funds", "Gold (small allocation)"],
  },
  Moderate: {
    label: "Moderate",
    description:
      "Balances growth and stability. Typically favored by people with a medium-to-long time horizon who can tolerate some fluctuation.",
    typicalAssets: ["Index Funds", "ETFs", "Fixed-income / Sukuk", "Some Stocks", "Gold"],
  },
  Aggressive: {
    label: "Aggressive",
    description:
      "Prioritizes long-term growth and accepts larger short-term swings. Typically favored by people with a long time horizon.",
    typicalAssets: ["Stocks", "ETFs", "Index Funds", "Small allocation to Cash as a buffer"],
  },
};

export const CALENDAR_EVENT_TYPES = [
  "salary",
  "rent",
  "bill",
  "subscription",
  "savings",
  "investment",
  "vacation",
] as const;
