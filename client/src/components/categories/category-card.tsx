import type { CategoryResponseDto } from "@/api/generated/models/categoryResponseDto";
import { ColoredObjectIcon } from "@/components/object/colored-object-icon";
import { ObjectCardActionsMenu, type ObjectCardAction } from "@/components/object/object-card-actions-menu";
import { Badge } from "@/components/ui/badge";
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

  const actions: ObjectCardAction[] = [];

  if (onEdit) {
    actions.push({
      id: "edit",
      label: `Editar ${category.name}`,
      icon: Pencil,
      onClick: () => onEdit(category),
    });
  }

  if (onDelete) {
    actions.push({
      id: "delete",
      label: `Excluir ${category.name}`,
      icon: Trash2,
      variant: "destructive",
      onClick: () => onDelete(category),
    });
  }

  return (
    <Card
      size="sm"
      className={cn(
        "glass-subtle category-card-glow h-fit w-full gap-0 self-start py-2.5",
        className,
      )}
      style={{ "--category-color": categoryColor } as CSSProperties}
    >
      <div className="flex min-w-0 items-start gap-2.5 px-3 sm:items-center">
        <ColoredObjectIcon
          color={category.color as unknown as string}
          icon={Tags}
        />

        <div className="min-w-0 flex-1 overflow-hidden">
          <CardTitle className="truncate text-sm leading-snug font-medium">
            {category.name}
          </CardTitle>
          <div className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden">
            {householdName && (
              <Badge
                variant="outline"
                className="h-5 max-w-[42%] shrink truncate rounded-md px-1.5 py-0 text-[11px] leading-none sm:max-w-36"
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
              <p className="min-w-0 flex-1 truncate text-xs leading-none text-muted-foreground">
                em {parentName}
              </p>
            )}
          </div>
        </div>

        <ObjectCardActionsMenu actions={actions} menuLabel={`Ações de ${category.name}`} />
      </div>
    </Card>
  );
}
