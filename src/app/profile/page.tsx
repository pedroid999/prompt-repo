import { getProfile } from './actions'
import { ProfileForm } from '@/components/features/profile/profile-form'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const { data: profile, error } = await getProfile()

  if (error || !profile) {
    // If not authenticated or error, redirect to login
    redirect('/auth/login')
  }

  return (
    <div className="container max-w-4xl py-10">
      <ProfileForm initialData={profile} />
    </div>
  )
}
