'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { profileSchema } from '@/lib/validation/profile'

export async function getProfile() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
      console.error('Error fetching profile:', error)
      return { data: null, error: 'Failed to fetch profile' }
  }

  return { data, error: null }
}

export async function updateProfile(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const rawData = {
    display_name: formData.get('display_name') as string,
    avatar_url: formData.get('avatar_url') as string || undefined,
  }

  const validationResult = profileSchema.safeParse(rawData)

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors?.[0]?.message || "Invalid data"
    return { 
      data: null, 
      error: errorMessage
    }
  }

  const { display_name, avatar_url } = validationResult.data

  const { data, error } = await supabase
    .from('profiles')
    .update({
        display_name,
        avatar_url,
        updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return { data: null, error: 'Failed to update profile' }
  }
  
  revalidatePath('/profile')
  return { data, error: null }
}