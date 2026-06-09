import type { CategoryResponseDto } from '@/api/generated/models/categoryResponseDto'
import type { CategoryResponseDtoKind } from '@/api/generated/models/categoryResponseDtoKind'

export function getCategoryKindLabel(kind: CategoryResponseDtoKind): string {
  switch (kind) {
    case 'expense':
      return 'Despesa'
    case 'income':
      return 'Receita'
    case 'transfer':
      return 'Transferência'
    default:
      return kind
  }
}

export function findCategoryInList(
  categories: CategoryResponseDto[] | undefined,
  categoryId: string,
): CategoryResponseDto | undefined {
  return categories?.find((category) => category.id === categoryId)
}

export function getParentCategoryOptions(
  categories: CategoryResponseDto[] | undefined,
): CategoryResponseDto[] {
  return (categories ?? []).filter((category) => !category.parentId)
}

export function getEditableParentCategoryOptions(
  categories: CategoryResponseDto[] | undefined,
  editingCategoryId: string,
): CategoryResponseDto[] {
  return getParentCategoryOptions(categories).filter(
    (category) => category.id !== editingCategoryId,
  )
}
