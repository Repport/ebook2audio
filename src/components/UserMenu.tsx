
import React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import UserAvatar from "@/components/UserAvatar"
import { useAuth } from "@/hooks/useAuth"
import { LogOut, Settings, List, LogIn, Activity } from "lucide-react"
import { useNavigate } from "react-router-dom"

const UserMenu = () => {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate("/auth")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {user && (
              <p className="text-sm font-medium leading-none">{user.email}</p>
            )}
            <p className="text-xs leading-none text-muted-foreground">
              {user ? 'Manage your account' : 'Sign in to your account'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user ? (
            <>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/conversions")}>
                <List className="mr-2 h-4 w-4" />
                <span>Your Conversions</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/monitoring")}>
                <Activity className="mr-2 h-4 w-4" />
                <span>System Monitoring</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => navigate("/auth")}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Log in</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          {/* eslint-disable-next-line react/jsx-no-target-blank */}
          <a href="https://lovable.ai" target="_blank" rel="noopener noreferrer">
            About
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu
