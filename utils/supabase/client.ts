import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  
  if (!url || !key) {
    throw new Error(
      `Supabase credentials missing. URL: ${!!url}, Key: ${!!key}`
    );
  }
  
  return createBrowserClient(url, key);
};
