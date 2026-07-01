import type { ReleaseNoteResponseDto } from "@/api/generated/models/releaseNoteResponseDto";
import {
  ObjectCardActionsMenu,
  type ObjectCardAction,
} from "@/components/object/object-card-actions-menu";
import { ReleaseNoteMarkdown } from "@/components/release-notes/release-note-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  formatReleaseNoteDate,
  isReleaseNotePublished,
} from "@/lib/release-note-helpers";
import { cn } from "@/lib/utils";
import { Eye, Pencil, ScrollText, Trash2 } from "lucide-react";

type ReleaseNoteCardProps = {
  note: ReleaseNoteResponseDto;
  onView?: (note: ReleaseNoteResponseDto) => void;
  onEdit?: (note: ReleaseNoteResponseDto) => void;
  onDelete?: (note: ReleaseNoteResponseDto) => void;
  className?: string;
};

export function ReleaseNoteCard({
  note,
  onView,
  onEdit,
  onDelete,
  className,
}: ReleaseNoteCardProps) {
  const published = isReleaseNotePublished(note);
  const actions: ObjectCardAction[] = [];

  if (onEdit) {
    actions.push({
      id: "edit",
      label: `Editar v${note.version}`,
      icon: Pencil,
      onClick: () => onEdit(note),
    });
  }

  if (onDelete) {
    actions.push({
      id: "delete",
      label: `Excluir v${note.version}`,
      icon: Trash2,
      variant: "destructive",
      onClick: () => onDelete(note),
    });
  }

  return (
    <Card
      size="sm"
      className={cn(
        "glass-subtle flex h-fit w-full flex-col gap-0 self-start py-0 ring-1 ring-foreground/10",
        className,
      )}
    >
      <div className="flex items-start gap-2.5 border-b border-foreground/8 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <ScrollText className="size-4 text-primary" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[11px]">
              v{note.version}
            </Badge>
            <Badge
              variant={published ? "default" : "outline"}
              className={cn(
                "text-[11px]",
                published && "bg-primary/15 text-primary",
              )}
            >
              {published ? "Publicada" : "Rascunho"}
            </Badge>
          </div>
          <CardTitle className="mt-1.5 line-clamp-2 text-sm leading-snug font-medium">
            {note.title}
          </CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatReleaseNoteDate(
              typeof note.publishedAt === "string" ? note.publishedAt : null,
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onView && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              aria-label={`Ver nota v${note.version}`}
              onClick={() => onView(note)}
            >
              <Eye className="size-4" aria-hidden="true" />
            </Button>
          )}
          {actions.length > 0 && <ObjectCardActionsMenu actions={actions} />}
        </div>
      </div>

      <div className="max-h-48 overflow-hidden px-4 py-3">
        <div className="line-clamp-8 text-muted-foreground">
          <ReleaseNoteMarkdown content={note.content} />
        </div>
      </div>
    </Card>
  );
}
