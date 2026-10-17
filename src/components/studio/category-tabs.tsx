"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GARMENT_CATEGORIES, type GarmentCategory } from "@/types/catalog";

const LABELS: Record<GarmentCategory, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  dresses: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  bags: "Bags",
  accessories: "Accessories",
  hairstyles: "Hair",
};

export function CategoryTabs({ value, onChange }: { value: GarmentCategory; onChange: (c: GarmentCategory) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as GarmentCategory)}>
      <TabsList>
        {GARMENT_CATEGORIES.map((category) => (
          <TabsTrigger key={category} value={category}>
            {LABELS[category]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
