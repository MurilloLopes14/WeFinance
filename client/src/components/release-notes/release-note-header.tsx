import { ObjectHeader } from '@/components/object/object-header'

type ReleaseNoteHeaderProps = {
  onCreate: () => void
}

export function ReleaseNoteHeader({ onCreate }: ReleaseNoteHeaderProps) {
  return (
    <ObjectHeader
      title="Notas de versão"
      description="Publique novidades do WeFinance em Markdown. Usuários veem a última versão publicada ao entrar no app."
      createAction={{
        label: 'Nova versão',
        onClick: onCreate,
      }}
    />
  )
}
