import { useReleaseNotesControllerFindLatest } from '@/api/generated/release-notes/release-notes'
import { useUsersControllerMarkReleaseNoteSeen } from '@/api/generated/users/users'
import { ReleaseNotePopup } from '@/components/release-notes/release-note-popup'
import { AUTH_SESSION_QUERY_KEY, useAuthSession } from '@/hooks/use-auth-session'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

export function ReleaseNotesGate() {
  const queryClient = useQueryClient()
  const { data: user } = useAuthSession()
  const [open, setOpen] = useState(false)

  const shouldFetch = Boolean(user?.shouldSeeReleaseNotes)

  const { data: latestNote, isSuccess } = useReleaseNotesControllerFindLatest({
    query: { enabled: shouldFetch },
  })

  const markSeenMutation = useUsersControllerMarkReleaseNoteSeen({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
        setOpen(false)
      },
    },
  })

  useEffect(() => {
    if (shouldFetch && isSuccess && latestNote) {
      setOpen(true)
    }
  }, [shouldFetch, isSuccess, latestNote])

  const handleClose = useCallback(() => {
    if (markSeenMutation.isPending) return
    markSeenMutation.mutate()
  }, [markSeenMutation])

  if (!latestNote || !open) return null

  return (
    <ReleaseNotePopup
      note={latestNote}
      open={open}
      variant="announcement"
      onClose={handleClose}
      isMarkingSeen={markSeenMutation.isPending}
    />
  )
}
