src/api/auth-api.ts:3:15 - error TS2724: '"./generated/models/onboardingDto"' has no exported member named 'UpdateOnboardingDto'. Did you mean 'OnboardingDto'?

3 import type { UpdateOnboardingDto } from './generated/models/onboardingDto'
                ~~~~~~~~~~~~~~~~~~~

src/api/budgets-api.ts:146:22 - error TS2554: Expected 4 arguments, but got 3.

146       await options?.onSuccess?.(data, variables, context)
                         ~~~~~~~~~

  node_modules/@tanstack/query-core/build/modern/_tsup-dts-rollup.d.ts:938:87
    938     onSuccess?: (data: TData, variables: TVariables, onMutateResult: TOnMutateResult, context: MutationFunctionContext) => Promise<unknown> | unknown;
                                                                                              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    An argument for 'context' was not provided.

src/api/budgets-api.ts:168:22 - error TS2554: Expected 4 arguments, but got 3.

168       await options?.onSuccess?.(data, variables, context)
                         ~~~~~~~~~

  node_modules/@tanstack/query-core/build/modern/_tsup-dts-rollup.d.ts:938:87
    938     onSuccess?: (data: TData, variables: TVariables, onMutateResult: TOnMutateResult, context: MutationFunctionContext) => Promise<unknown> | unknown;
                                                                                              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    An argument for 'context' was not provided.

src/api/budgets-api.ts:190:22 - error TS2554: Expected 4 arguments, but got 3.

190       await options?.onSuccess?.(data, variables, context)
                         ~~~~~~~~~

  node_modules/@tanstack/query-core/build/modern/_tsup-dts-rollup.d.ts:938:87
    938     onSuccess?: (data: TData, variables: TVariables, onMutateResult: TOnMutateResult, context: MutationFunctionContext) => Promise<unknown> | unknown;
                                                                                              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    An argument for 'context' was not provided.

src/api/budgets-api.ts:211:22 - error TS2554: Expected 4 arguments, but got 3.

211       await options?.onSuccess?.(_data, variables, context)
                         ~~~~~~~~~

  node_modules/@tanstack/query-core/build/modern/_tsup-dts-rollup.d.ts:938:87
    938     onSuccess?: (data: TData, variables: TVariables, onMutateResult: TOnMutateResult, context: MutationFunctionContext) => Promise<unknown> | unknown;
                                                                                              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    An argument for 'context' was not provided.

src/api/budgets-api.ts:233:22 - error TS2554: Expected 4 arguments, but got 3.

233       await options?.onSuccess?.(_data, variables, context)
                         ~~~~~~~~~

  node_modules/@tanstack/query-core/build/modern/_tsup-dts-rollup.d.ts:938:87
    938     onSuccess?: (data: TData, variables: TVariables, onMutateResult: TOnMutateResult, context: MutationFunctionContext) => Promise<unknown> | unknown;
                                                                                              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    An argument for 'context' was not provided.

src/components/accounts/account-card.tsx:70:11 - error TS2322: Type 'AccountResponseDtoColor | undefined' is not assignable to type 'string | null | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

70           color={account.color}
             ~~~~~

  src/components/object/colored-object-icon.tsx:6:3
    6   color?: string | null
        ~~~~~
    The expected type comes from property 'color' which is declared here on type 'IntrinsicAttributes & ColoredObjectIconProps'

src/components/accounts/account-card.tsx:102:17 - error TS2322: Type '{ [key: string]: unknown; }' is not assignable to type 'ReactNode'.
  Type '{ [key: string]: unknown; }' is missing the following properties from type 'ReactPortal': children, type, props, key

102                 {account.institution}
                    ~~~~~~~~~~~~~~~~~~~~~

  node_modules/@types/react/index.d.ts:2267:9
    2267         children?: ReactNode | undefined;
                 ~~~~~~~~
    The expected type comes from property 'children' which is declared here on type 'DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>'

src/components/accounts/account-card.tsx:108:32 - error TS2322: Type '({ id: string; label: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; onClick: () => void; variant?: undefined; } | { ...; } | null)[]' is not assignable to type 'ObjectCardAction[]'.
  Type '{ id: string; label: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; onClick: () => void; variant?: undefined; } | { ...; } | null' is not assignable to type 'ObjectCardAction'.
    Type 'null' is not assignable to type 'ObjectCardAction'.

108         <ObjectCardActionsMenu actions={actions} menuLabel={`Ações de ${account.name}`} />
                                   ~~~~~~~

  src/components/object/object-card-actions-menu.tsx:22:3
    22   actions: ObjectCardAction[]
         ~~~~~~~
    The expected type comes from property 'actions' which is declared here on type 'IntrinsicAttributes & ObjectCardActionsMenuProps'

src/components/budgets/group-budget-card.tsx:75:30 - error TS2322: Type 'HouseholdResponseDtoColor | undefined' is not assignable to type 'string | null | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

75           <ColoredObjectIcon color={household.color} icon={UsersRound} />
                                ~~~~~

  src/components/object/colored-object-icon.tsx:6:3
    6   color?: string | null
        ~~~~~
    The expected type comes from property 'color' which is declared here on type 'IntrinsicAttributes & ColoredObjectIconProps'

src/components/categories/category-card.tsx:104:32 - error TS2322: Type '({ id: string; label: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; onClick: () => void; variant?: undefined; } | { ...; } | null)[]' is not assignable to type 'ObjectCardAction[]'.
  Type '{ id: string; label: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; onClick: () => void; variant?: undefined; } | { ...; } | null' is not assignable to type 'ObjectCardAction'.
    Type 'null' is not assignable to type 'ObjectCardAction'.

104         <ObjectCardActionsMenu actions={actions} menuLabel={`Ações de ${category.name}`} />
                                   ~~~~~~~

  src/components/object/object-card-actions-menu.tsx:22:3
    22   actions: ObjectCardAction[]
         ~~~~~~~
    The expected type comes from property 'actions' which is declared here on type 'IntrinsicAttributes & ObjectCardActionsMenuProps'

src/components/dashboard/balance-evolution-chart.tsx:259:22 - error TS2322: Type 'DailyBalancePoint[] | MonthlyBalancePoint[]' is not assignable to type 'ChartData<DailyBalancePoint> | undefined'.
  Type 'MonthlyBalancePoint[]' is not assignable to type 'readonly DailyBalancePoint[]'.
    Type 'MonthlyBalancePoint' is missing the following properties from type 'DailyBalancePoint': day, date, dailyBalance

259           <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                         ~~~~

  node_modules/recharts/types/util/types.d.ts:1143:5
    1143     data?: ChartData<DataPointType>;
             ~~~~
    The expected type comes from property 'data' which is declared here on type 'IntrinsicAttributes & CartesianChartProps<DailyBalancePoint> & { ref?: Ref<SVGSVGElement> | undefined; }'

src/components/dashboard/category-donut-chart.tsx:37:9 - error TS2322: Type '{ key: string | { [key: string]: unknown; }; name: string; value: number; percentage: number; fill: { [key: string]: unknown; } | "var(--chart-1)" | "var(--chart-2)" | "var(--chart-3)" | "var(--chart-4)" | "var(--chart-5)"; }[]' is not assignable to type 'ChartSlice[]'.
  Type '{ key: string | { [key: string]: unknown; }; name: string; value: number; percentage: number; fill: { [key: string]: unknown; } | "var(--chart-1)" | "var(--chart-2)" | "var(--chart-3)" | "var(--chart-4)" | "var(--chart-5)"; }' is not assignable to type 'ChartSlice'.
    Types of property 'key' are incompatible.
      Type 'string | { [key: string]: unknown; }' is not assignable to type 'string'.
        Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

37   const slices: ChartSlice[] =
           ~~~~~~

src/components/dashboard/day-transactions-sheet.tsx:104:26 - error TS18046: 'transaction.description.trim' is of type 'unknown'.

104                         {transaction.description?.trim() || 'Sem descrição'}
                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/dashboard/day-transactions-sheet.tsx:112:47 - error TS2538: Type '{ [key: string]: unknown; }' cannot be used as an index type.

112                             {categoryNameById[transaction.categoryId] ?? 'Categoria'}
                                                  ~~~~~~~~~~~~~~~~~~~~~~

src/components/dashboard/recent-transactions-panel.tsx:6:1 - error TS6133: 'formatAccountBalance' is declared but its value is never read.

6 import { formatAccountBalance } from '@/lib/account-helpers'
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/dashboard/recent-transactions-panel.tsx:79:80 - error TS18046: 'transaction.description.trim' is of type 'unknown'.

79                 <p className="truncate text-sm font-medium">                  {transaction.description?.trim() || getTransactionTypeLabel(transaction.type)}
                                                                                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/households/household-card.tsx:70:28 - error TS2322: Type 'HouseholdResponseDtoColor | undefined' is not assignable to type 'string | null | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

70         <ColoredObjectIcon color={household.color} icon={UsersRound} />
                              ~~~~~

  src/components/object/colored-object-icon.tsx:6:3
    6   color?: string | null
        ~~~~~
    The expected type comes from property 'color' which is declared here on type 'IntrinsicAttributes & ColoredObjectIconProps'

src/components/households/household-card.tsx:90:32 - error TS2322: Type '({ id: string; label: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; onClick: () => void; variant?: undefined; } | { ...; } | null)[]' is not assignable to type 'ObjectCardAction[]'.
  Type '{ id: string; label: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; onClick: () => void; variant?: undefined; } | { ...; } | null' is not assignable to type 'ObjectCardAction'.
    Type 'null' is not assignable to type 'ObjectCardAction'.

90         <ObjectCardActionsMenu actions={actions} menuLabel={`Ações de ${household.name}`} />
                                  ~~~~~~~

  src/components/object/object-card-actions-menu.tsx:22:3
    22   actions: ObjectCardAction[]
         ~~~~~~~
    The expected type comes from property 'actions' which is declared here on type 'IntrinsicAttributes & ObjectCardActionsMenuProps'

src/components/object/object-collection-state.tsx:1:10 - error TS6133: 'ObjectEmptyState' is declared but its value is never read.

1 import { ObjectEmptyState, type ObjectEmptyAction } from '@/components/object/object-empty-state'
           ~~~~~~~~~~~~~~~~

src/components/splits/split-columns.tsx:115:30 - error TS2322: Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

115                 <AvatarImage src={previewMember.avatarUrl} alt={row.original.memberName} />
                                 ~~~

  node_modules/@types/react/index.d.ts:3174:9
    3174         src?:
                 ~~~
    The expected type comes from property 'src' which is declared here on type 'IntrinsicAttributes & AvatarImageProps'

src/components/splits/split-preview-avatar-group.tsx:34:26 - error TS2322: Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

34             <AvatarImage src={member.avatarUrl} alt={member.name} />
                            ~~~

  node_modules/@types/react/index.d.ts:3174:9
    3174         src?:
                 ~~~
    The expected type comes from property 'src' which is declared here on type 'IntrinsicAttributes & AvatarImageProps'

src/components/splits/split-transaction-card.tsx:89:32 - error TS2322: Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

89                   <AvatarImage src={previewMember.avatarUrl} alt={row.memberName} />
                                  ~~~

  node_modules/@types/react/index.d.ts:3174:9
    3174         src?:
                 ~~~
    The expected type comes from property 'src' which is declared here on type 'IntrinsicAttributes & AvatarImageProps'

src/components/subscriptions/subscription-card.tsx:169:11 - error TS2322: Type '({ id: string; label: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; onClick: () => void; variant?: undefined; } | { ...; } | null)[]' is not assignable to type 'ObjectCardAction[]'.
  Type '{ id: string; label: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; onClick: () => void; variant?: undefined; } | { ...; } | null' is not assignable to type 'ObjectCardAction'.
    Type 'null' is not assignable to type 'ObjectCardAction'.

169           actions={actions}
              ~~~~~~~

  src/components/object/object-card-actions-menu.tsx:22:3
    22   actions: ObjectCardAction[]
         ~~~~~~~
    The expected type comes from property 'actions' which is declared here on type 'IntrinsicAttributes & ObjectCardActionsMenuProps'

src/components/transactions/transaction-card-list.tsx:32:41 - error TS2538: Type '{ [key: string]: unknown; }' cannot be used as an index type.

32                 ? meta.categoryNameById[transaction.categoryId]
                                           ~~~~~~~~~~~~~~~~~~~~~~

src/components/transactions/transaction-card.tsx:29:5 - error TS18046: 'transaction.description.trim' is of type 'unknown'.

29     transaction.description?.trim() || getTransactionTypeLabel(transaction.type)
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/transactions/transaction-columns.tsx:42:12 - error TS18046: 'row.original.description.trim' is of type 'unknown'.

42           {row.original.description?.trim() || '—'}
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/transactions/transaction-columns.tsx:70:38 - error TS2538: Type '{ [key: string]: unknown; }' cannot be used as an index type.

70             ? (meta.categoryNameById[row.original.categoryId] ?? '—')
                                        ~~~~~~~~~~~~~~~~~~~~~~~

src/components/transactions/transaction-owner-avatar.tsx:26:24 - error TS2322: Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

26           <AvatarImage src={owner.avatarUrl} alt={owner.name} />
                          ~~~

  node_modules/@types/react/index.d.ts:3174:9
    3174         src?:
                 ~~~
    The expected type comes from property 'src' which is declared here on type 'IntrinsicAttributes & AvatarImageProps'

src/components/ui/calendar.tsx:162:9 - error TS2353: Object literal may only specify known properties, and 'table' does not exist in type 'Partial<ClassNames>'.

162         table: "w-full border-collapse",
            ~~~~~

  node_modules/react-day-picker/dist/esm/types/props.d.ts:44:5
    44     classNames?: Partial<ClassNames>;
           ~~~~~~~~~~
    The expected type comes from property 'classNames' which is declared here on type 'IntrinsicAttributes & DayPickerProps'

src/hooks/use-dashboard-data.ts:23:5 - error TS2769: No overload matches this call.
  Overload 1 of 3, '(options: DefinedInitialDataOptions<T, unknown, T, readonly unknown[]>, queryClient?: QueryClient | undefined): DefinedUseQueryResult<NoInfer<T>, unknown>', gave the following error.
    Argument of type 'Partial<UseQueryOptions<T, unknown, T, readonly unknown[]>>' is not assignable to parameter of type 'DefinedInitialDataOptions<T, unknown, T, readonly unknown[]>'.
      Type 'Partial<UseQueryOptions<T, unknown, T, readonly unknown[]>>' is not assignable to type 'Omit<UseQueryOptions<T, unknown, T, readonly unknown[]>, "queryFn">'.
        Types of property 'queryKey' are incompatible.
          Type 'readonly unknown[] | undefined' is not assignable to type 'readonly unknown[]'.
            Type 'undefined' is not assignable to type 'readonly unknown[]'.
  Overload 2 of 3, '(options: UndefinedInitialDataOptions<T, unknown, T, readonly unknown[]>, queryClient?: QueryClient | undefined): UseQueryResult<NoInfer<T>, unknown>', gave the following error.
    Argument of type 'Partial<UseQueryOptions<T, unknown, T, readonly unknown[]>>' is not assignable to parameter of type 'UndefinedInitialDataOptions<T, unknown, T, readonly unknown[]>'.
      Type 'Partial<UseQueryOptions<T, unknown, T, readonly unknown[]>>' is not assignable to type 'UseQueryOptions<T, unknown, T, readonly unknown[]>'.
        Types of property 'queryKey' are incompatible.
          Type 'readonly unknown[] | undefined' is not assignable to type 'readonly unknown[]'.
            Type 'undefined' is not assignable to type 'readonly unknown[]'.
  Overload 3 of 3, '(options: UseQueryOptions<T, unknown, T, readonly unknown[]>, queryClient?: QueryClient | undefined): UseQueryResult<NoInfer<T>, unknown>', gave the following error.
    Argument of type 'Partial<UseQueryOptions<T, unknown, T, readonly unknown[]>>' is not assignable to parameter of type 'UseQueryOptions<T, unknown, T, readonly unknown[]>'.
      Types of property 'queryKey' are incompatible.
        Type 'readonly unknown[] | undefined' is not assignable to type 'readonly unknown[]'.
          Type 'undefined' is not assignable to type 'readonly unknown[]'.

 23     defaultQueryOptions({
        ~~~~~~~~~~~~~~~~~~~~~
 24       queryKey,
    ~~~~~~~~~~~~~~~
...
 26       enabled,
    ~~~~~~~~~~~~~~
 27     }),
    ~~~~~~


src/lib/split-table-helpers.ts:44:22 - error TS18046: 'transaction.description.trim' is of type 'unknown'.

44         description: transaction.description?.trim() ?? '',
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/lib/split-table-helpers.ts:50:9 - error TS2322: Type 'TransactionSplitResponseDtoCategoryId | undefined' is not assignable to type 'string | null | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

50         splitCategoryId: split.categoryId,
           ~~~~~~~~~~~~~~~

  src/lib/split-table-helpers.ts:16:3
    16   splitCategoryId?: string | null
         ~~~~~~~~~~~~~~~
    The expected type comes from property 'splitCategoryId' which is declared here on type 'SplitTableRow'

src/lib/tour-helpers.ts:25:46 - error TS2345: Argument of type 'string' is not assignable to parameter of type '"payees"'.

25   return !onboarding.completedTours.includes(tourKey)
                                                ~~~~~~~

src/lib/tour-helpers.ts:32:42 - error TS2345: Argument of type 'string' is not assignable to parameter of type '"payees"'.

32   if (onboarding.completedTours.includes(tourKey)) {
                                            ~~~~~~~

src/lib/tour-helpers.ts:38:22 - error TS2322: Type 'string' is not assignable to type '"payees"'.

38     completedTours: [...onboarding.completedTours, tourKey],
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/lib/tour-helpers.ts:38:52 - error TS2322: Type 'string' is not assignable to type '"payees"'.

38     completedTours: [...onboarding.completedTours, tourKey],
                                                      ~~~~~~~

src/pages/accounts/account-form-fields.tsx:266:11 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.

266           value={color}
              ~~~~~

  src/components/color-preset-picker.tsx:9:3
    9   value: string
        ~~~~~
    The expected type comes from property 'value' which is declared here on type 'IntrinsicAttributes & ColorPresetPickerProps'

src/pages/accounts/account-page.tsx:108:10 - error TS18046: 'account.institution.toLowerCase' is of type 'unknown'.

108         (account.institution?.toLowerCase().includes(normalizedSearch) ?? false)
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/pages/accounts/modals/account-create-modal.tsx:72:7 - error TS2322: Type '{ yieldPercent: null; yieldGranularity: null; maturityDate: null; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; institution: string | undefined; balanceManual: number; color: string | undefined; } | { ...; }' is not assignable to type 'CreateAccountDto'.
  Type '{ yieldPercent: null; yieldGranularity: null; maturityDate: null; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; institution: string | undefined; balanceManual: number; color: string | undefined; }' is not assignable to type 'CreateAccountDto'.
    Types of property 'yieldPercent' are incompatible.
      Type 'null' is not assignable to type 'number | undefined'.

72       data: {
         ~~~~

  src/api/generated/accounts/accounts.ts:101:30
    101         {householdId: string;data: BodyType<CreateAccountDto>},
                                     ~~~~
    The expected type comes from property 'data' which is declared here on type '{ householdId: string; data: CreateAccountDto; }'

src/pages/accounts/modals/account-create-modal.tsx:105:15 - error TS2719: Type 'import("C:/Users/muril/Documents/Programing/Projects/WeFinance/client/node_modules/react-hook-form/dist/types/form").UseFormSetValue<{ householdId: string; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; balanceManual: number; institution?: string | undefined; color?: string | undefine...' is not assignable to type 'import("C:/Users/muril/Documents/Programing/Projects/WeFinance/client/node_modules/react-hook-form/dist/types/form").UseFormSetValue<{ householdId: string; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; balanceManual: number; institution?: string | undefined; color?: string | undefine...'. Two different types with this name exist, but they are unrelated.
  Type '{ householdId: string; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; balanceManual: number; institution?: string | undefined; color?: string | undefined; yieldPercent?: string | undefined; yieldGranularity?: "" | ... 3 more ... | undefined; maturityDate?: string | undefined; } | { .....' is not assignable to type '{ householdId: string; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; balanceManual: number; institution?: string | undefined; color?: string | undefined; yieldPercent?: string | undefined; yieldGranularity?: "" | ... 3 more ... | undefined; maturityDate?: string | undefined; }'.
    Property 'balanceManual' is missing in type '{ householdId: string; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; institution?: string | undefined; color?: string | undefined; yieldPercent?: string | undefined; yieldGranularity?: "" | ... 3 more ... | undefined; maturityDate?: string | undefined; }' but required in type '{ householdId: string; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; balanceManual: number; institution?: string | undefined; color?: string | undefined; yieldPercent?: string | undefined; yieldGranularity?: "" | ... 3 more ... | undefined; maturityDate?: string | undefined; }'.

105               setValue={setValue}
                  ~~~~~~~~

  src/pages/accounts/account-form-fields.tsx:29:3
    29   setValue: UseFormSetValue<AccountFormValues | AccountEditFormValues>
         ~~~~~~~~
    The expected type comes from property 'setValue' which is declared here on type 'IntrinsicAttributes & AccountFormFieldsProps'

src/pages/accounts/modals/account-edit-modal.tsx:47:5 - error TS2322: Type 'string | { [key: string]: unknown; }' is not assignable to type 'string | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

47     institution: account.institution ?? '',
       ~~~~~~~~~~~

  src/pages/accounts/account-form-schema.ts:80:5
     80     institution: z
            ~~~~~~~~~~~~~~
     81       .string()
        ~~~~~~~~~~~~~~~
    ...
     84       .optional()
        ~~~~~~~~~~~~~~~~~
     85       .or(z.literal('')),
        ~~~~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'institution' which is declared here on type '{ householdId: string; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; institution?: string | undefined; color?: string | undefined; yieldPercent?: string | undefined; yieldGranularity?: "" | ... 3 more ... | undefined; maturityDate?: string | undefined; }'

src/pages/accounts/modals/account-edit-modal.tsx:48:5 - error TS2322: Type 'string | { [key: string]: unknown; } | undefined' is not assignable to type 'string | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

48     color: account.color ?? defaultAccountEditFormValues.color,
       ~~~~~

  src/pages/accounts/account-form-schema.ts:86:5
     86     color: z
            ~~~~~~~~
     87       .string()
        ~~~~~~~~~~~~~~~
    ...
     90       .optional()
        ~~~~~~~~~~~~~~~~~
     91       .or(z.literal('')),
        ~~~~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'color' which is declared here on type '{ householdId: string; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; institution?: string | undefined; color?: string | undefined; yieldPercent?: string | undefined; yieldGranularity?: "" | ... 3 more ... | undefined; maturityDate?: string | undefined; }'

src/pages/accounts/modals/account-edit-modal.tsx:52:5 - error TS2322: Type 'string | { [key: string]: unknown; }' is not assignable to type 'string | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

52     maturityDate: account.maturityDate ?? '',
       ~~~~~~~~~~~~

  src/pages/accounts/account-form-schema.ts:15:3
    15   maturityDate: z.string().optional().or(z.literal('')),
         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'maturityDate' which is declared here on type '{ householdId: string; name: string; type: "checking" | "savings" | "credit" | "cash" | "investment"; institution?: string | undefined; color?: string | undefined; yieldPercent?: string | undefined; yieldGranularity?: "" | ... 3 more ... | undefined; maturityDate?: string | undefined; }'

src/pages/accounts/modals/account-edit-modal.tsx:129:9 - error TS2322: Type 'string | null' is not assignable to type 'UpdateAccountDtoInstitution | undefined'.
  Type 'string' is not assignable to type '{ [key: string]: unknown; }'.

129         institution: values.institution || null,
            ~~~~~~~~~~~

  src/api/generated/models/updateAccountDto.ts:22:3
    22   institution?: UpdateAccountDtoInstitution;
         ~~~~~~~~~~~
    The expected type comes from property 'institution' which is declared here on type 'UpdateAccountDto'

src/pages/accounts/modals/account-edit-modal.tsx:130:9 - error TS2322: Type 'string | undefined' is not assignable to type 'UpdateAccountDtoColor | undefined'.
  Type 'string' is not assignable to type '{ [key: string]: unknown; }'.

130         color: values.color || undefined,
            ~~~~~

  src/api/generated/models/updateAccountDto.ts:25:3
    25   color?: UpdateAccountDtoColor;
         ~~~~~
    The expected type comes from property 'color' which is declared here on type 'UpdateAccountDto'

src/pages/categories/category-form-fields.tsx:197:11 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.

197           value={color}
              ~~~~~

  src/components/color-preset-picker.tsx:9:3
    9   value: string
        ~~~~~
    The expected type comes from property 'value' which is declared here on type 'IntrinsicAttributes & ColorPresetPickerProps'

src/pages/categories/category-page.tsx:236:52 - error TS2345: Argument of type '{ [key: string]: unknown; }' is not assignable to parameter of type 'string'.

236                   ? findCategoryInList(categories, category.parentId)
                                                       ~~~~~~~~~~~~~~~~~

src/pages/categories/modals/category-edit-modal.tsx:49:5 - error TS2322: Type 'string | { [key: string]: unknown; }' is not assignable to type 'string | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

49     parentId: category.parentId ?? '',
       ~~~~~~~~

  src/pages/categories/category-form-schema.ts:18:5
    18     parentId: z.string().uuid().optional().or(z.literal('')),
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'parentId' which is declared here on type '{ householdId: string; name: string; kind: "expense" | "income" | "transfer"; isFixed: boolean; parentId?: string | undefined; color?: string | undefined; }'

src/pages/categories/modals/category-edit-modal.tsx:52:5 - error TS2322: Type 'string | { [key: string]: unknown; } | undefined' is not assignable to type 'string | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

52     color: category.color ?? defaultCategoryFormValues.color,
       ~~~~~

  src/pages/categories/category-form-schema.ts:20:5
     20     color: z
            ~~~~~~~~
     21       .string()
        ~~~~~~~~~~~~~~~
    ...
     24       .optional()
        ~~~~~~~~~~~~~~~~~
     25       .or(z.literal('')),
        ~~~~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'color' which is declared here on type '{ householdId: string; name: string; kind: "expense" | "income" | "transfer"; isFixed: boolean; parentId?: string | undefined; color?: string | undefined; }'

src/pages/categories/modals/category-edit-modal.tsx:141:9 - error TS2322: Type 'string | null' is not assignable to type 'UpdateCategoryDtoParentId | undefined'.
  Type 'string' is not assignable to type '{ [key: string]: unknown; }'.

141         parentId: values.parentId ? values.parentId : null,
            ~~~~~~~~

  src/api/generated/models/updateCategoryDto.ts:20:3
    20   parentId?: UpdateCategoryDtoParentId;
         ~~~~~~~~
    The expected type comes from property 'parentId' which is declared here on type 'UpdateCategoryDto'

src/pages/categories/modals/category-edit-modal.tsx:144:9 - error TS2322: Type 'string | undefined' is not assignable to type 'UpdateCategoryDtoColor | undefined'.
  Type 'string' is not assignable to type '{ [key: string]: unknown; }'.

144         color: values.color || undefined,
            ~~~~~

  src/api/generated/models/updateCategoryDto.ts:23:3
    23   color?: UpdateCategoryDtoColor;
         ~~~~~
    The expected type comes from property 'color' which is declared here on type 'UpdateCategoryDto'

src/pages/households/household-form-fields.tsx:118:13 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.

118             value={color}
                ~~~~~

  src/components/color-preset-picker.tsx:9:3
    9   value: string
        ~~~~~
    The expected type comes from property 'value' which is declared here on type 'IntrinsicAttributes & ColorPresetPickerProps'

src/pages/households/modals/household-edit-modal.tsx:45:5 - error TS2322: Type 'string' is not assignable to type '"BRL" | "EUR" | "USD"'.

45     currency: household.currency,
       ~~~~~~~~

  src/pages/households/household-form-schema.ts:11:3
    11   currency: z.enum(['BRL', 'EUR', 'USD']),
         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'currency' which is declared here on type '{ name: string; currency: "BRL" | "EUR" | "USD"; defaultSplitType: "equal" | "percent"; keepBudgets: boolean; color?: string | undefined; }'

src/pages/households/modals/household-edit-modal.tsx:47:5 - error TS2322: Type 'string | { [key: string]: unknown; } | undefined' is not assignable to type 'string | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

47     color: household.color ?? defaultHouseholdFormValues.color,
       ~~~~~

  src/pages/households/household-form-schema.ts:16:3
     16   color: z
          ~~~~~~~~
     17     .string()
        ~~~~~~~~~~~~~
    ...
     20     .optional()
        ~~~~~~~~~~~~~~~
     21     .or(z.literal('')),
        ~~~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'color' which is declared here on type '{ name: string; currency: "BRL" | "EUR" | "USD"; defaultSplitType: "equal" | "percent"; keepBudgets: boolean; color?: string | undefined; }'

src/pages/households/modals/household-edit-modal.tsx:120:9 - error TS2322: Type 'string | undefined' is not assignable to type 'UpdateHouseholdDtoColor | undefined'.
  Type 'string' is not assignable to type '{ [key: string]: unknown; }'.

120         color: values.color || undefined,
            ~~~~~

  src/api/generated/models/updateHouseholdDto.ts:18:3
    18   color?: UpdateHouseholdDtoColor;
         ~~~~~
    The expected type comes from property 'color' which is declared here on type 'UpdateHouseholdDto'

src/pages/households/modals/household-view.tsx:51:17 - error TS2322: Type '{ [key: string]: unknown; } | "var(--primary)"' is not assignable to type 'BackgroundColor | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'BackgroundColor | undefined'.
    Type '{ [key: string]: unknown; }' is not assignable to type 'string & {}'.
      Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

51                 backgroundColor: household.color ?? 'var(--primary)',
                   ~~~~~~~~~~~~~~~

src/pages/profile/profile-basic-info-form.tsx:150:17 - error TS2322: Type '{ mode: "single"; locale: Locale; captionLayout: "dropdown"; selected: Date | undefined; onSelect: (date: Date | undefined) => void; disabled: (date: Date) => boolean; defaultMonth: Date | undefined; fromYear: number; toYear: number; }' is not assignable to type 'IntrinsicAttributes & (DayPickerProps & { buttonVariant?: "link" | "outline" | "default" | "secondary" | "ghost" | "destructive" | null | undefined; })'.
  Property 'fromYear' does not exist on type '(IntrinsicAttributes & PropsBase & PropsSingle & { buttonVariant?: "link" | "outline" | "default" | "secondary" | "ghost" | "destructive" | null | undefined; }) | (IntrinsicAttributes & ... 2 more ... & { ...; })'.

150                 fromYear={1940}
                    ~~~~~~~~

src/pages/profile/profile-helpers.ts:34:38 - error TS2345: Argument of type 'UserResponseDtoBirthDate | undefined' is not assignable to parameter of type 'string | null | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

34     birthDate: toBirthDateInputValue(user.birthDate),
                                        ~~~~~~~~~~~~~~

src/pages/profile/profile-helpers.ts:35:54 - error TS2345: Argument of type '{ [key: string]: unknown; }' is not assignable to parameter of type 'string'.

35     phoneNumber: user.phoneNumber ? formatPhoneInput(user.phoneNumber) : '',
                                                        ~~~~~~~~~~~~~~~~

src/pages/profile/profile-page.tsx:73:15 - error TS2322: Type 'MeResponseDtoAvatarUrl | undefined' is not assignable to type 'string | null | undefined'.
  Type '{ [key: string]: unknown; }' is not assignable to type 'string'.

73               avatarUrl={user.avatarUrl}
                 ~~~~~~~~~

  src/pages/profile/profile-avatar-section.tsx:19:3
    19   avatarUrl?: string | null
         ~~~~~~~~~
    The expected type comes from property 'avatarUrl' which is declared here on type 'IntrinsicAttributes & ProfileAvatarSectionProps'

src/pages/subscriptions/subscription-page.tsx:301:42 - error TS2538: Type '{ [key: string]: unknown; }' cannot be used as an index type.

301                       ? categoryNameById[subscription.categoryId]
                                             ~~~~~~~~~~~~~~~~~~~~~~~

src/pages/transactions/transaction-page.tsx:138:8 - error TS18046: 'transaction.description.toLowerCase' is of type 'unknown'.

138       (transaction.description?.toLowerCase().includes(normalizedSearch) ?? false),
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/pages/transactions/transaction-split-fields.tsx:15:3 - error TS2724: '"@/lib/transaction-split-helpers"' has no exported member named 'computeDefaultHouseholdSplits'. Did you mean 'buildDefaultHouseholdSplits'?

15   computeDefaultHouseholdSplits,
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  src/lib/transaction-split-helpers.ts:61:17
    61 export function buildDefaultHouseholdSplits(
                       ~~~~~~~~~~~~~~~~~~~~~~~~~~~
    'buildDefaultHouseholdSplits' is declared here.

src/pages/transactions/transaction-split-fields.tsx:16:3 - error TS2305: Module '"@/lib/transaction-split-helpers"' has no exported member 'getCustomSplitTotal'.

16   getCustomSplitTotal,
     ~~~~~~~~~~~~~~~~~~~

src/pages/transactions/transaction-split-fields.tsx:17:3 - error TS2305: Module '"@/lib/transaction-split-helpers"' has no exported member 'getDefaultSplitModeDescription'.

17   getDefaultSplitModeDescription,
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/pages/transactions/transaction-split-fields.tsx:18:3 - error TS2724: '"@/lib/transaction-split-helpers"' has no exported member named 'getInitialCustomSplitLines'. Did you mean 'getInitialCustomSplitRows'?

18   getInitialCustomSplitLines,
     ~~~~~~~~~~~~~~~~~~~~~~~~~~

  src/lib/transaction-split-helpers.ts:110:17
    110 export function getInitialCustomSplitRows(
                        ~~~~~~~~~~~~~~~~~~~~~~~~~
    'getInitialCustomSplitRows' is declared here.

src/pages/transactions/transaction-split-fields.tsx:19:3 - error TS2305: Module '"@/lib/transaction-split-helpers"' has no exported member 'getNextAvailableMember'.

19   getNextAvailableMember,
     ~~~~~~~~~~~~~~~~~~~~~~

src/pages/transactions/transaction-split-fields.tsx:185:41 - error TS7006: Parameter 'split' implicitly has an 'any' type.

185               {defaultSplitPreview.map((split) => {
                                            ~~~~~


Found 69 errors.