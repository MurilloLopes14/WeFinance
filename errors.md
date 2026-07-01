src/hooks/use-dashboard-activity-data.ts:31:5 - error TS2769: No overload matches this call.
  Overload 1 of 3, '(householdId: string, params?: SubscriptionsControllerFindAllParams | undefined, options?: { query?: (Partial<UseQueryOptions<SubscriptionResponseDto[], ErrorType<...>, SubscriptionResponseDto[], readonly unknown[]>> & Pick<...>) | undefined; request?: AxiosRequestConfig<...> | undefined; } | undefined, queryClient?: QueryClient | undefined): UseQueryResult<...> & { ...; }', gave the following error.
    Object literal may only specify known properties, and 'query' does not exist in type 'SubscriptionsControllerFindAllParams'.
  Overload 2 of 3, '(householdId: string, params?: SubscriptionsControllerFindAllParams | undefined, options?: { query?: Partial<UseQueryOptions<SubscriptionResponseDto[], ErrorType<...>, SubscriptionResponseDto[], readonly unknown[]>> | undefined; request?: AxiosRequestConfig<...> | undefined; } | undefined, queryClient?: QueryClient | undefined): UseQueryResult<...> & { ...; }', gave the following error.
    Object literal may only specify known properties, and 'query' does not exist in type 'SubscriptionsControllerFindAllParams'.

31     query: { enabled },
       ~~~~~


src/lib/release-note-helpers.ts:6:38 - error TS2367: This comparison appears to be unintentional because the types '{ [key: string]: unknown; }' and 'string' have no overlap.

6   return note.publishedAt != null && note.publishedAt !== ''
                                       ~~~~~~~~~~~~~~~~~~~~~~~

src/pages/release-notes/modals/release-note-create-modal.tsx:75:9 - error TS2322: Type 'string | null' is not assignable to type 'CreateReleaseNoteDtoPublishedAt | undefined'.
  Type 'null' is not assignable to type 'CreateReleaseNoteDtoPublishedAt | undefined'.

75         publishedAt: toPublishedAtIso(values.publishNow),
           ~~~~~~~~~~~

  src/api/generated/models/createReleaseNoteDto.ts:16:3
    16   publishedAt?: CreateReleaseNoteDtoPublishedAt;
         ~~~~~~~~~~~
    The expected type comes from property 'publishedAt' which is declared here on type 'CreateReleaseNoteDto'

src/pages/release-notes/modals/release-note-edit-modal.tsx:99:9 - error TS2322: Type 'string | null' is not assignable to type 'UpdateReleaseNoteDtoPublishedAt | undefined'.
  Type 'string' is not assignable to type '{ [key: string]: unknown; }'.

99         publishedAt: values.publishNow
           ~~~~~~~~~~~

  src/api/generated/models/updateReleaseNoteDto.ts:18:3
    18   publishedAt?: UpdateReleaseNoteDtoPublishedAt;
         ~~~~~~~~~~~
    The expected type comes from property 'publishedAt' which is declared here on type 'UpdateReleaseNoteDto'

src/pages/subscriptions/subscription-page.tsx:96:64 - error TS2345: Argument of type 'AbortSignal | undefined' is not assignable to parameter of type 'AxiosRequestConfig<any> | undefined'.
  Type 'AbortSignal' has no properties in common with type 'AxiosRequestConfig<any>'.

96         subscriptionsControllerFindAll(householdId, undefined, signal),