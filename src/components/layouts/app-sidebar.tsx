"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  LayoutDashboard,
  FileText,
  Users,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navSections = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Compliance",
    items: [
      { title: "Licenses", href: "/compliance", icon: ShieldCheck },
      { title: "Facility", href: "/compliance/facility", icon: MapPin },
      { title: "Audit Log", href: "/compliance/audit", icon: FileText },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Products", href: "/inventory", icon: Package },
      { title: "Vendors", href: "/inventory/vendors", icon: Users },
    ],
  },
  {
    label: "Commerce",
    items: [
      { title: "Point of Sale", href: "/pos", icon: ShoppingCart },
      { title: "Orders", href: "/pos/orders", icon: FileText },
    ],
  },
  {
    label: "Delivery",
    items: [{ title: "Trips", href: "/delivery", icon: Truck }],
  },
  {
    label: "Finance",
    items: [
      { title: "Reports", href: "/finance", icon: BarChart3 },
      { title: "Tax Filing", href: "/finance/tax", icon: DollarSign },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <ShieldCheck className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Dispensory</span>
                <span className="text-muted-foreground truncate text-xs">Green Valley - DTLA</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent role="navigation" aria-label="Main navigation">
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/settings" />}>
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/api/auth/signout" />}>
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
