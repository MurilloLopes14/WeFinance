import type { ReleaseNoteResponseDto } from '@/api/generated/models/releaseNoteResponseDto'
import {
  getReleaseNotesControllerFindAllQueryKey,
  getReleaseNotesControllerFindLatestQueryKey,
  useReleaseNotesControllerFindAll,
  useReleaseNotesControllerRemove,
} from '@/api/generated/release-notes/release-notes'
import { ReleaseNoteCard } from '@/components/release-notes/release-note-card'
import { ReleaseNoteCardGridSkeleton } from '@/components/release-notes/release-note-card-grid-skeleton'
import { ReleaseNoteHeader } from '@/components/release-notes/release-note-header'
import { ObjectCollectionState } from '@/components/object/object-collection-state'
import { ObjectDeleteConfirmDialog } from '@/components/object/object-delete-confirm-dialog'
import { ObjectEmptyState } from '@/components/object/object-empty-state'
import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import { useAuthSession } from '@/hooks/use-auth-session'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { releaseNoteCardGridClassName } from '@/lib/release-note-helpers'
import { isAdmin } from '@/lib/user-helpers'
import { ReleaseNoteCreateModal } from '@/pages/release-notes/modals/release-note-create-modal'
import { ReleaseNoteEditModal } from '@/pages/release-notes/modals/release-note-edit-modal'
import { ScrollText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function ReleaseNotesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user, isLoading: isLoadingUser } = useAuthSession()
  const [createOpen, setCreateOpen] = useState(false)
  const [editNote, setEditNote] = useState<ReleaseNoteResponseDto | null>(null)
  const [deleteNote, setDeleteNote] = useState<ReleaseNoteResponseDto | null>(null)

  const {
    data: notes,
    isLoading: isLoadingNotes,
    isError,
    refetch,
  } = useReleaseNotesControllerFindAll({
    query: { enabled: isAdmin(user?.role) },
  })

  useEffect(() => {
    if (!isLoadingUser && user && !isAdmin(user.role)) {
      navigate('/dashboard', { replace: true })
    }
  }, [isLoadingUser, user, navigate])

  const deleteMutation = useReleaseNotesControllerRemove({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getReleaseNotesControllerFindAllQueryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: getReleaseNotesControllerFindLatestQueryKey(),
        })
        toast.success('Nota de versão excluída')
        setDeleteNote(null)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível excluir a nota de versão'))
      },
    },
  })

  if (isLoadingUser || (user && !isAdmin(user.role))) {
    return null
  }

  const hasNotes = (notes?.length ?? 0) > 0

  return (
    <ObjectPageLayout>
      <ReleaseNoteHeader onCreate={() => setCreateOpen(true)} />

      <ObjectPageContent>
        <ObjectCollectionState
          isLoading={isLoadingNotes}
          isError={isError}
          isEmpty={!hasNotes}
          skeleton={<ReleaseNoteCardGridSkeleton />}
          onRetry={() => void refetch()}
          emptyState={
            <ObjectEmptyState
              icon={ScrollText}
              title="Nenhuma nota publicada"
              description="Crie a primeira nota de versão para comunicar novidades aos usuários do WeFinance."
              actions={[
                {
                  label: 'Nova versão',
                  onClick: () => setCreateOpen(true),
                },
              ]}
            />
          }
        >
          <div className={releaseNoteCardGridClassName}>
            {(notes ?? []).map((note) => (
              <ReleaseNoteCard
                key={note.id}
                note={note}
                onEdit={setEditNote}
                onDelete={setDeleteNote}
              />
            ))}
          </div>
        </ObjectCollectionState>
      </ObjectPageContent>

      <ReleaseNoteCreateModal open={createOpen} onOpenChange={setCreateOpen} />

      <ReleaseNoteEditModal
        note={editNote}
        open={editNote !== null}
        onOpenChange={(open) => {
          if (!open) setEditNote(null)
        }}
      />

      <ObjectDeleteConfirmDialog
        open={deleteNote !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteNote(null)
        }}
        title="Excluir nota de versão"
        description={`Tem certeza que deseja excluir a versão "${deleteNote?.version}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => {
          if (!deleteNote) return
          deleteMutation.mutate({ id: deleteNote.id })
        }}
        isPending={deleteMutation.isPending}
      />
    </ObjectPageLayout>
  )
}
