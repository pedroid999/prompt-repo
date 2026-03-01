import { getProfile } from './actions'
import { ProfileForm } from '@/components/features/profile/profile-form'
import { ApiKeysCard } from '@/components/features/profile/api-keys-card'
import { McpConfigCard } from '@/components/features/profile/mcp-config-card'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const { data: profile, error } = await getProfile()

  if (error || !profile) {
    // If not authenticated or error, redirect to login
    redirect('/auth/login')
  }

  return (
    <div className="container max-w-4xl py-10 space-y-10">
      <ProfileForm initialData={profile} />

      <section>
        <ApiKeysCard />
      </section>

      <section>
        <McpConfigCard />
      </section>
    </div>
  )
}
