import { getProfile } from './actions'
import { ProfileForm } from '@/components/features/profile/profile-form'
import { ApiKeysCard } from '@/components/features/profile/api-keys-card'
import { McpConfigCard } from '@/components/features/profile/mcp-config-card'
import { AiProvidersCard } from '@/components/features/profile/ai-providers-card'
import { redirect } from 'next/navigation'
import { BackButton } from '@/components/shared/back-button'

export default async function ProfilePage() {
  const { data: profile, error } = await getProfile()

  if (error || !profile) {
    // If not authenticated or error, redirect to login
    redirect('/auth/login')
  }

  return (
    <div className="flex h-full flex-col bg-[#16161D]">
      <header className="flex h-14 items-center border-b border-[#16161D] bg-[#1F1F28] px-4 md:px-6 gap-4">
        <BackButton />
        <h1 className="text-xl font-bold text-[#DCD7BA]">Profile</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl py-10 space-y-10">
          <ProfileForm initialData={profile} />

          <section>
            <ApiKeysCard />
          </section>

          <section>
            <AiProvidersCard />
          </section>

          <section>
            <McpConfigCard />
          </section>
        </div>
      </main>
    </div>
  )
}
