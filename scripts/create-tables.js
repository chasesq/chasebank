import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[v0] Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTables() {
  try {
    console.log('[v0] Starting database migration...');

    // Create accounts table
    const { error: accountsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          account_type VARCHAR(50) NOT NULL,
          account_number VARCHAR(20) UNIQUE NOT NULL,
          full_account_number VARCHAR(20) NOT NULL,
          routing_number VARCHAR(20) NOT NULL,
          balance DECIMAL(15,2) NOT NULL DEFAULT 0,
          available_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
          interest_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON public.accounts(user_id);
      `
    });

    if (accountsError) {
      console.error('[v0] Accounts table error:', accountsError);
    } else {
      console.log('[v0] Accounts table created successfully');
    }

    // Create transactions table
    const { error: transactionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          description TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'completed',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS transactions_account_id_idx ON public.transactions(account_id);
        CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
      `
    });

    if (transactionsError) {
      console.error('[v0] Transactions table error:', transactionsError);
    } else {
      console.log('[v0] Transactions table created successfully');
    }

    console.log('[v0] Database migration completed');
  } catch (error) {
    console.error('[v0] Migration error:', error.message || error);
    process.exit(1);
  }
}

createTables();
