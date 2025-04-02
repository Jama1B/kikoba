"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/tanstack-start";

export function NavUser({}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <ClerkLoading>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">GBG</AvatarFallback>
            </Avatar>
          </ClerkLoading>
          <ClerkLoaded>
            <UserButton />
          </ClerkLoaded>

          <div className="grid flex-1 text-left text-sm">
            <span className="truncate font-medium">{user?.firstName}</span>
            <span className="truncate text-xs">
              {user?.emailAddresses[0].emailAddress}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
