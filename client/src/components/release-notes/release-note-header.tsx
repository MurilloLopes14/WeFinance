import { ObjectHeader } from '@/components/object/object-header'

type ReleaseNoteHeaderProps = {
  onCreate?: () => void
  readOnly?: boolean
}

export function ReleaseNoteHeader({ onCreate, readOnly = false }: ReleaseNoteHeaderProps) {
  return (
    <ObjectHeader
      title="Notas de versão"
      description={
        readOnly
          ? 'Histórico de novidades e melhorias publicadas no WeFinance.'
          : 'Publique novidades do WeFinance em Markdown. Usuários veem a última versão publicada ao entrar no app.'
      }
      createAction={
        onCreate
          ? {
              label: 'Nova versão',
              onClick: onCreate,
            }
          : undefined
      }
    />
  )
}
