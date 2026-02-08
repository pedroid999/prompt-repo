'use server'

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function restoreVersion(promptId: string, versionId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  // 1. Fetch the historical version content
  const { data: historicalVersion, error: fetchError } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('id', versionId)
    .eq('prompt_id', promptId)
    .single()

  if (fetchError || !historicalVersion) {
    return { error: "Version not found or access denied" }
  }

  // 2. Get the current max version number to increment
  const { data: maxVersionData, error: maxVersionError } = await supabase
    .from('prompt_versions')
    .select('version_number')
    .eq('prompt_id', promptId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (maxVersionError) {
    return { error: "Failed to determine next version" }
  }

  const nextVersionNumber = (maxVersionData?.version_number || 0) + 1

  // 3. Insert new version with historical content
  const { error: insertError } = await supabase
    .from('prompt_versions')
    .insert({
      prompt_id: promptId,
      version_number: nextVersionNumber,
      content: historicalVersion.content,
      version_note: `Restored from v${historicalVersion.version_number}`,
    })

  if (insertError) {
    return { error: "Failed to restore version" }
  }
  
  // 4. Update parent prompt updated_at
  await supabase
    .from('prompts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', promptId)

  revalidatePath(`/prompts/${promptId}`)
  revalidatePath('/') // Revalidate home/list view to reflect updated timestamp/version content
  
  return { success: true, newVersion: nextVersionNumber }
}
