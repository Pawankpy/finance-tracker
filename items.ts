'use server';

import { createClient } from '@/lib/supabase/server';
import { FinancialItemInput } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('financial_items')
    .select('*')
    .order('maturity_date', { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createItem(input: FinancialItemInput) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('financial_items')
    .insert({ ...input, user_id: userData.user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/');
  return data;
}

export async function updateItem(id: string, input: Partial<FinancialItemInput>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('financial_items')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/');
  return data;
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('financial_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function uploadDocument(file: File) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const path = `${userData.user.id}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('documents').upload(path, file);
  if (error) throw new Error(error.message);
  return path;
}

export async function getDocumentUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function saveApiKey(apiKey: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userData.user.id, claude_api_key: apiKey });
  if (error) throw new Error(error.message);
}

export async function getApiKeyStatus() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data } = await supabase
    .from('user_settings')
    .select('claude_api_key')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  return !!data?.claude_api_key;
}
