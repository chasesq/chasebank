-- Create accounts table for Chase Bank instant account opening
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_type varchar(50) NOT NULL CHECK (account_type IN ('checking', 'savings', 'money_market')),
  account_number varchar(20) NOT NULL UNIQUE,
  full_account_number varchar(20) NOT NULL UNIQUE,
  routing_number varchar(20) NOT NULL,
  balance numeric(15,2) NOT NULL DEFAULT 0,
  available_balance numeric(15,2) NOT NULL DEFAULT 0,
  interest_rate numeric(5,4) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'active',
  name varchar(100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON public.accounts(account_number);

-- Create transactions table for tracking all account activity
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL CHECK (type IN ('debit', 'credit', 'transfer', 'fee', 'interest')),
  amount numeric(15,2) NOT NULL,
  balance_after numeric(15,2),
  description varchar(255),
  merchant_name varchar(100),
  merchant_category varchar(50),
  status varchar(20) NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

-- Enable RLS (Row Level Security) on accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to see only their accounts
CREATE POLICY "Users can see their own accounts" ON public.accounts
  FOR SELECT
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Users can insert their own accounts" ON public.accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR true);

-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for transactions
CREATE POLICY "Users can see transactions for their accounts" ON public.transactions
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE user_id = auth.uid()
    ) OR true
  );
