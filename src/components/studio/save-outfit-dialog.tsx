"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button, Input, Label, Textarea } from "@/components/ui/ui";
import { OCCASIONS, STYLE_TAGS, type Occasion, type StyleTag } from "@/types/catalog";
import { cn } from "@/lib/utils";

interface SaveOutfitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  onSave: (input: { name: string; occasion?: Occasion; styleTags: StyleTag[]; notes?: string }) => Promise<void>;
}

export function SaveOutfitDialog({ open, onOpenChange, initialName, onSave }: SaveOutfitDialogProps) {
  const [name, setName] = useState(initialName);
  const [occasion, setOccasion] = useState<Occasion | undefined>(undefined);
  const [styleTags, setStyleTags] = useState<StyleTag[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleTag(tag: StyleTag) {
    setStyleTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), occasion, styleTags, notes: notes.trim() || undefined });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Save this look</DialogTitle>
        <div className="flex flex-col gap-3">
          <div>
            <Label>Outfit name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Friday Dinner" autoFocus />
          </div>
          <div>
            <Label>Occasion</Label>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setOccasion(occasion === o ? undefined : o)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                    occasion === o ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted"
                  )}
                >
                  {o.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Style</Label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                    styleTags.includes(tag) ? "bg-accent text-white" : "bg-surface-muted text-muted"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any details to remember..." />
          </div>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="mt-1">
            {saving ? "Saving..." : "Save outfit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
