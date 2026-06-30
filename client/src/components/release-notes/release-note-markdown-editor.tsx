import { ReleaseNoteMarkdown } from '@/components/release-notes/release-note-markdown'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ReleaseNoteMarkdownEditorProps = {
  id: string
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
}

export function ReleaseNoteMarkdownEditor({
  id,
  value,
  onChange,
  error,
  className,
}: ReleaseNoteMarkdownEditorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>Conteúdo (Markdown)</Label>
      <Tabs defaultValue="write" className="gap-2">
        <TabsList className="h-8 w-fit">
          <TabsTrigger value="write" className="px-3 text-xs">
            Escrever
          </TabsTrigger>
          <TabsTrigger value="preview" className="px-3 text-xs">
            Pré-visualizar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="mt-0">
          <Textarea
            id={id}
            name="content"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={'## Novidades\n\n- Item 1\n- Item 2'}
            spellCheck
            rows={12}
            className="min-h-[220px] resize-y rounded-xl font-mono text-sm"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="glass-subtle min-h-[220px] rounded-xl p-4 ring-1 ring-foreground/10">
            <ReleaseNoteMarkdown content={value} />
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
