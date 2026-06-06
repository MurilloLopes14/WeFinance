 npm run db:generate

> server@0.0.1 db:generate
> drizzle-kit generate

No config path provided, using default 'drizzle.config.ts'
Reading config file 'C:\Users\muril\Documents\Programing\Projects\WeFinance\server\drizzle.config.ts'
◇ injected env (0) from .env // tip: ⌁ auth for agents [www.vestauth.com]
~ group_members › household_members table will be renamed/moved
~ groups › households table will be renamed/moved
--- all table conflicts resolved ---


~ group_id › household_id column will be renamed

+ role column will be created

+ split_value column will be created
--- all columns conflicts in household_members table resolved ---


+ currency column will be created

+ default_split_type column will be created
--- all columns conflicts in households table resolved ---


~ group_id › household_id column will be renamed
--- all columns conflicts in transactions table resolved ---

TypeError: Cannot read properties of undefined (reading 'columns')
    at preparePgAlterColumns (C:\Users\muril\Documents\Programing\Projects\WeFinance\server\node_modules\drizzle-kit\bin.cjs:26344:63)
    at C:\Users\muril\Documents\Programing\Projects\WeFinance\server\node_modules\drizzle-kit\bin.cjs:28571:16
    at Array.map (<anonymous>)
    at applyPgSnapshotsDiff (C:\Users\muril\Documents\Programing\Projects\WeFinance\server\node_modules\drizzle-kit\bin.cjs:28570:51)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async prepareAndMigratePg (C:\Users\muril\Documents\Programing\Projects\WeFinance\server\node_modules\drizzle-kit\bin.cjs:32191:42)
    at async Object.handler (C:\Users\muril\Documents\Programing\Projects\WeFinance\server\node_modules\drizzle-kit\bin.cjs:91988:7)
    at async run (C:\Users\muril\Documents\Programing\Projects\WeFinance\server\node_modules\drizzle-kit\bin.cjs:91472:7)