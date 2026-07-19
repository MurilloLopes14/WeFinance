import {
  getPayeesControllerFindAllQueryKey,
  payeesControllerCreate,
  payeesControllerFindAll,
} from "@/api/generated/payees/payees";
import type { PayeeResponseDto } from "@/api/generated/models/payeeResponseDto";
import { findPayeeByName } from "@/lib/payee-helpers";
import type { QueryClient } from "@tanstack/react-query";

function upsertPayeeInCache(
  queryClient: QueryClient,
  householdId: string,
  payee: PayeeResponseDto,
) {
  queryClient.setQueryData<PayeeResponseDto[]>(
    getPayeesControllerFindAllQueryKey(householdId),
    (current) => {
      if (!current) return [payee];
      if (current.some((entry) => entry.id === payee.id)) return current;
      return [...current, payee];
    },
  );
}

/**
 * Reuses an existing payee by name or creates one, keeping the list cache in sync
 * so the combobox selection stays stable right after create.
 */
export async function ensureHouseholdPayee(options: {
  queryClient: QueryClient;
  householdId: string;
  name: string;
  defaultCategoryId?: string;
  knownPayees?: PayeeResponseDto[];
}): Promise<PayeeResponseDto> {
  const name = options.name.trim();
  if (!name) {
    throw new Error("Informe um nome para cadastrar o beneficiário");
  }

  const existing =
    findPayeeByName(options.knownPayees ?? [], name) ??
    findPayeeByName(
      options.queryClient.getQueryData<PayeeResponseDto[]>(
        getPayeesControllerFindAllQueryKey(options.householdId),
      ) ?? [],
      name,
    );

  if (existing) {
    upsertPayeeInCache(options.queryClient, options.householdId, existing);
    return existing;
  }

  try {
    const created = await payeesControllerCreate(options.householdId, {
      name,
      defaultCategoryId: options.defaultCategoryId,
    });

    upsertPayeeInCache(options.queryClient, options.householdId, created);
    void options.queryClient.invalidateQueries({
      queryKey: getPayeesControllerFindAllQueryKey(options.householdId),
    });

    return created;
  } catch (error) {
    // Create may have succeeded on the server even if the client saw a failure
    // (timeout / aborted follow-up). Recover by reloading and matching the name.
    const refreshed = await payeesControllerFindAll(options.householdId);
    const recovered = findPayeeByName(refreshed, name);

    if (recovered) {
      upsertPayeeInCache(options.queryClient, options.householdId, recovered);
      options.queryClient.setQueryData(
        getPayeesControllerFindAllQueryKey(options.householdId),
        refreshed,
      );
      return recovered;
    }

    throw error;
  }
}
