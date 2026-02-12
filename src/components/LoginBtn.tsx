"use client"

import { FaGoogle } from "react-icons/fa"
import { signIn } from 'next-auth/react'
import { Button } from './ui/button'

function LoginBtn() {
    return  <Button onClick={() => signIn('google', { callbackUrl: '/home'})}>
                <FaGoogle />
                Google
            </Button>
}

export default LoginBtn