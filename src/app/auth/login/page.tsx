import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github } from "lucide-react"
import { signInWithEmail, signInWithGithub, signInWithGoogle, signUpWithEmail } from "@/app/auth/actions"
import { SubmitButton } from "@/components/shared/auth/submit-button"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage(props: Props) {
  const searchParams = await props.searchParams
  const error = typeof searchParams.error === 'string' ? searchParams.error : undefined
  const message = typeof searchParams.message === 'string' ? searchParams.message : undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl" role="heading" aria-level={1}>Sign In</CardTitle>
          <CardDescription>
            Enter your email below to login or create an account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {decodeURIComponent(error)}
              </AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert className="border-emerald-500 text-emerald-500">
              <CheckCircle2 className="h-4 w-4 stroke-emerald-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                {decodeURIComponent(message)}
              </AlertDescription>
            </Alert>
          )}
          <form className="grid gap-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <SubmitButton formAction={signInWithEmail} pendingText="Signing In...">Sign In</SubmitButton>
              <SubmitButton formAction={signUpWithEmail} variant="outline" pendingText="Signing Up...">Sign Up</SubmitButton>
            </div>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <form action={signInWithGithub}>
              <Button variant="outline" className="w-full">
                <Github className="mr-2 h-4 w-4" />
                Github
              </Button>
            </form>
            <form action={signInWithGoogle}>
              <Button variant="outline" className="w-full">
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" aria-label="Google logo">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Google
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
