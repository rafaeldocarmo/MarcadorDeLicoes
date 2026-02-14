"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { signIn } from "next-auth/react"
import { FaGoogle, FaMicrosoft } from "react-icons/fa"


export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col gap-6 ", className)} {...props}>
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Marcador de Lições</CardTitle>
          <CardDescription>
            Para começar, faça login com o Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/home" })}>
                  <FaGoogle />
                  Login com Google
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => signIn("azure-ad", { callbackUrl: "/home" })}>
                  <FaMicrosoft />
                  Login com Office
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

