'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateProfile } from "@/app/profile/actions"
import { profileSchema, ProfileFormValues } from "@/lib/validation/profile"
import { startTransition, useOptimistic } from "react"

interface ProfileFormProps {
  initialData: {
    display_name: string | null
    avatar_url: string | null
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [optimisticProfile, setOptimisticProfile] = useOptimistic(
    initialData,
    (state, newProfile: Partial<ProfileFormValues>) => ({
      ...state,
      ...newProfile,
    })
  )

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: initialData.display_name || "",
      avatar_url: initialData.avatar_url || "",
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    const formData = new FormData()
    formData.append('display_name', data.display_name)
    formData.append('avatar_url', data.avatar_url || "")

    startTransition(() => {
      setOptimisticProfile(data)
    })

    // Optimistic UI: Feedback immediately
    toast.success("Profile updated successfully", {
      description: "Your changes have been saved."
    })

    try {
        const result = await updateProfile(formData)
        
        if (result.error) {
            toast.error(result.error)
            // Ideally we would revert the optimistic state here if it wasn't automatically reset 
            // by the next server render or by form state management
            return
        }
    } catch (error) {
        toast.error("An unexpected error occurred")
    }
  }

  return (
    <Card className="w-full max-w-2xl bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-foreground">Profile Settings</CardTitle>
                <CardDescription className="text-muted-foreground">
                Manage your public profile information.
                </CardDescription>
            </div>
            {optimisticProfile.avatar_url && (
                <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border">
                    <img 
                        src={optimisticProfile.avatar_url} 
                        alt="Avatar Preview" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Display Name</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="Your name" 
                        className="font-mono bg-input/50"
                        {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground">
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Avatar URL</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="https://github.com/avatar.png" 
                        className="font-mono bg-input/50"
                        {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground">
                    Link to your avatar image.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save Changes</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}