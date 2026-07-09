"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  CircleDollarSign,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Navigation,
  PieChart,
  PictureInPicture2,
  Search,
  Settings,
  UserRoundCog,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessDenied } from "@/components/AccessDenied";
import { clearStoredSession, getStoredToken, getStoredUser, getStoredUserName } from "@/lib/api";
import { initials } from "@/lib/format";
import { hasPermission, isSuperAdmin, permissionForPath, roleRequiredForPath } from "@/lib/permissions";
import type { PermissionKey, User } from "@/types/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, section: "Operations", permission: "VIEW_DASHBOARD" },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck, section: "Operations", permission: "VIEW_BOOKINGS" },
  { href: "/inquiries", label: "Inquiries", icon: MessageSquare, section: "Operations", permission: "VIEW_INQUIRIES" },
  { href: "/customers", label: "Customers", icon: Users, section: "Operations", permission: "VIEW_CUSTOMERS" },
  { href: "/tours", label: "Tours", icon: BarChart3, section: "Catalog", permission: "VIEW_TOURS" },
  { href: "/blogs", label: "Blogs", icon: BookOpen, section: "Catalog", permission: "VIEW_BLOGS" },
  { href: "/finance", label: "Finance", icon: CircleDollarSign, section: "Business", permission: "VIEW_FINANCE" },
  { href: "/reports", label: "Reports", icon: PieChart, section: "Business", permission: "VIEW_REPORTS" },
  { href: "/navigation", label: "Navigation", icon: Navigation, section: "Website", permission: "VIEW_NAVIGATION" },
  { href: "/alert-popup", label: "Alert Popup", icon: PictureInPicture2, section: "Website", permission: "VIEW_SETTINGS", role: "SUPER_ADMIN" },
  { href: "/settings", label: "Settings", icon: Settings, section: "Website", permission: "VIEW_SETTINGS" },
  { href: "/users", label: "Users & Roles", icon: UserRoundCog, section: "Admin", permission: "VIEW_USERS" }
] satisfies Array<{
  href: string;
  label: string;
  icon: typeof Home;
  section: string;
  permission: PermissionKey;
  role?: User["role"];
}>;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState(() => getStoredUserName());
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }

    setUserName(getStoredUserName());
    setUser(getStoredUser());
  }, [router]);

  const visibleNavItems = navItems.filter((item) => {
    if (item.role === "SUPER_ADMIN" && !isSuperAdmin(user)) return false;
    return hasPermission(user, item.permission);
  });
  const pagePermission = permissionForPath(pathname);
  const pageRole = roleRequiredForPath(pathname);
  const canViewPage = (!pageRole || user?.role === pageRole) && (pagePermission ? hasPermission(user, pagePermission) : true);
  const pageTitle = navItems.find((item) => item.href === pathname)?.label ?? "Dashboard";

  function logout() {
    clearStoredSession();
    router.replace("/login");
  }

  return (
    <div className="app-shell">
      <button
        className={`mobile-scrim ${open ? "is-open" : ""}`}
        aria-label="Close navigation"
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-mark">M</div>
            <div>
              <div className="brand-text">Mountain Helicopters</div>
              <div className="brand-sub">Admin · Nepal</div>
            </div>
          </div>
          <button className="sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {["Operations", "Catalog", "Business", "Website", "Admin"].map((section) => {
          const sectionItems = visibleNavItems.filter((item) => item.section === section);
          if (!sectionItems.length) return null;

          return (
          <div className="nav-section" key={section}>
            <div className="nav-section-label">{section}</div>
            {sectionItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    className={`nav-item ${active ? "active" : ""}`}
                    href={item.href}
                    key={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </div>
          );
        })}

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{initials(userName)}</div>
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-role">{user?.role?.replace(/_/g, " ") ?? "Administrator"}</div>
            </div>
            <button className="logout-btn" aria-label="Sign out" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" aria-label="Open navigation" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="page-title">{pageTitle}</h2>
          </div>
          <div className="topbar-right">
            <div className="search-box">
              <Search className="h-4 w-4" />
              <input placeholder="Search tours, blogs, inquiries..." />
            </div>
            <button className="icon-btn" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="dot" />
            </button>
          </div>
        </header>
        <div className="content">{canViewPage ? children : <AccessDenied />}</div>
      </main>
    </div>
  );
}
