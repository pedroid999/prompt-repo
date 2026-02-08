'use server'

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { PromptVersion } from "../types"

export async function getPromptHistory(promptId: string): Promise<PromptVersion[]> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('prompt_id', promptId)
    .order('version_number', { ascending: false })

  if (error) {
    console.error('Error fetching prompt history:', error)
    throw new Error(error.message)
  }

  return data as PromptVersion[]
}
