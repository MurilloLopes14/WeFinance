import type { CategoryResponseDto } from "@/api/generated/models/categoryResponseDto";
import { ColoredObjectIcon } from "@/components/object/colored-object-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getCategoryKindLabel } from "@/lib/category-helpers";
import { DEFAULT_PRESET_COLOR } from "@/lib/color-helpers";
import { cn } from "@/lib/utils";
import { Pencil, Tags, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";

export const categoryCardGridClassName =
  "grid w-full auto-rows-min grid-cols-1 content-start items-start gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

type CategoryCardProps = {
  category: CategoryResponseDto;
  householdName?: string | null;
  parentName?: string | null;
  onEdit?: (category: CategoryResponseDto) => void;
  onDelete?: (category: CategoryResponseDto) => void;
  className?: string;
};

export function CategoryCard({
  category,
  householdName,
  parentName,
  onEdit,
  onDelete,
  className,
}: CategoryCardProps) {
  const categoryColor = category.color ?? DEFAULT_PRESET_COLOR;

  return (
    <Card
      size="sm"
      className={cn(
        "glass-subtle category-card-glow h-fit w-full gap-0 self-start py-2.5",
        className,
      )}
      style={{ "--category-color": categoryColor } as CSSProperties}
    >
      <div className="flex min-w-0 items-center gap-2.5 px-3">
        <ColoredObjectIcon
          color={category.color as unknown as string}
          icon={Tags}
        />

        <div className="min-w-0 flex-1">
          <CardTitle className="line-clamp-1 text-sm leading-snug font-medium">
            {category.name}
          </CardTitle>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
            {householdName && (
              <Badge
                variant="outline"
                className="h-5 max-w-32 shrink-0 truncate rounded-md px-1.5 py-0 text-[11px] leading-none"
              >
                {householdName}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[11px] leading-none"
            >
              {getCategoryKindLabel(category.kind)}
            </Badge>
            {category.isFixed && (
              <Badge
                variant="outline"
                className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[11px] leading-none"
              >
                Fixa
              </Badge>
            )}
            {parentName && (
              <p className="truncate text-xs leading-none text-muted-foreground">
                em {parentName}
              </p>
            )}
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex shrink-0 items-center gap-0.5">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label={`Editar ${category.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(category);
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 text-destructive hover:text-destructive"
                aria-label={`Excluir ${category.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(category);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
