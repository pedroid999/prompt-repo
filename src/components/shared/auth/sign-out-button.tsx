import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button variant="ghost">Sign Out</Button>
    </form>
  )
}
