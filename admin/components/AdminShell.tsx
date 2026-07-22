"use client";

import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Home,
  Plane,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  PieChart,
  PictureInPicture2,
  Radio,
  Settings,
  ShieldCheck,
  Undo2,
  UserRoundCog,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AccessDenied } from "@/components/AccessDenied";
import {
  apiFetch,
  clearOriginalSession,
  clearStoredSession,
  getOriginalSession,
  getStoredToken,
  getStoredUser,
  getStoredUserName,
  setStoredSession,
  storeOriginalSession
} from "@/lib/api";
import { initials } from "@/lib/format";
import { hasPermission, isSuperAdmin, permissionForPath, roleRequiredForPath } from "@/lib/permissions";
import type { PermissionKey, User } from "@/types/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, section: "Operations", permission: "VIEW_DASHBOARD" },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck, section: "Operations", permission: "VIEW_BOOKINGS" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, section: "Operations", permission: "VIEW_BOOKINGS" },
  { href: "/inquiries", label: "Inquiries", icon: MessageSquare, section: "Operations", permission: "VIEW_INQUIRIES" },
  { href: "/customers", label: "Customers", icon: Users, section: "Operations", permission: "VIEW_CUSTOMERS" },
  { href: "/tours", label: "Tours", icon: BarChart3, section: "Catalog", permission: "VIEW_TOURS" },
  { href: "/helicopters", label: "Helicopters", icon: Plane, section: "Catalog", permission: "VIEW_HELICOPTERS" },
  { href: "/blogs", label: "Blogs", icon: BookOpen, section: "Catalog", permission: "VIEW_BLOGS" },
  { href: "/newsletters", label: "Newsletters", icon: Mail, section: "Catalog", permission: "VIEW_NEWSLETTERS" },
  { href: "/sources", label: "Sources", icon: Radio, section: "Business", permission: "VIEW_DASHBOARD" },
  { href: "/finance", label: "Finance", icon: CircleDollarSign, section: "Business", permission: "VIEW_FINANCE" },
  { href: "/reports", label: "Reports", icon: PieChart, section: "Business", permission: "VIEW_REPORTS" },
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
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("Administrator");
  const [user, setUser] = useState<User | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [switchingUserId, setSwitchingUserId] = useState<string | null>(null);
  const [accountError, setAccountError] = useState("");
  const [originalSession, setOriginalSession] = useState<ReturnType<typeof getOriginalSession>>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }

    setUserName(getStoredUserName());
    setUser(getStoredUser());
    setOriginalSession(getOriginalSession());
  }, [router]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function closeMenu(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountMenuOpen(false);
    }

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  const visibleNavItems = navItems.filter((item) => {
    if (item.role === "SUPER_ADMIN" && !isSuperAdmin(user)) return false;
    return hasPermission(user, item.permission);
  });
  const pagePermission = permissionForPath(pathname);
  const pageRole = roleRequiredForPath(pathname);
  const canViewPage = mounted && (!pageRole || user?.role === pageRole) && (pagePermission ? hasPermission(user, pagePermission) : true);
  const pageTitle = navItems.find((item) => item.href === pathname)?.label ?? "Dashboard";

  function logout() {
    clearStoredSession();
    router.replace("/login");
  }

  async function openAccountMenu() {
    const nextOpen = !accountMenuOpen;
    setAccountMenuOpen(nextOpen);
    setAccountError("");

    if (!nextOpen || !isSuperAdmin(user) || accounts.length) return;

    const token = getStoredToken();
    if (!token) return;

    setAccountsLoading(true);
    try {
      const users = await apiFetch<User[]>("/admin/users", { token });
      setAccounts(users.filter((account) => account.status === "ACTIVE" && account.role !== "CUSTOMER"));
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Accounts could not be loaded.");
    } finally {
      setAccountsLoading(false);
    }
  }

  async function switchAccount(account: User) {
    const token = getStoredToken();
    if (!token || !user || account.id === user.id) return;

    setSwitchingUserId(account.id);
    setAccountError("");
    try {
      const session = await apiFetch<{ token: string; user: User }>("/admin/auth/impersonate", {
        method: "POST",
        token,
        body: JSON.stringify({ userId: account.id })
      });
      storeOriginalSession(token, user);
      setStoredSession(session.token, session.user);
      setUser(session.user);
      setUserName(session.user.name || session.user.username);
      setOriginalSession(getOriginalSession());
      setAccountMenuOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Account could not be selected.");
    } finally {
      setSwitchingUserId(null);
    }
  }

  function returnToSuperAdmin() {
    if (!originalSession) return;
    setStoredSession(originalSession.token, originalSession.user);
    clearOriginalSession();
    setUser(originalSession.user);
    setUserName(originalSession.user.name || originalSession.user.username);
    setOriginalSession(null);
    setAccounts([]);
    setAccountMenuOpen(false);
    router.push("/dashboard");
    router.refresh();
  }

  const canSwitchAccounts = isSuperAdmin(user) || Boolean(originalSession);

  return (
    <div className="app-shell">
      <button
        className={`mobile-scrim ${open ? "is-open" : ""}`}
        aria-label="Close navigation"
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-lockup">
            <img
              className="brand-logo-image"
              src="/mountain-helicopters-nepal-logo.jpeg"
              alt="Mountain Helicopters Nepal"
            />
            <div className="brand-role">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Dashboard</span>
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
            <h1 className="page-title">{pageTitle}</h1>
          </div>
          {canSwitchAccounts ? (
            <div className="account-switcher" ref={accountMenuRef}>
              <button
                className="account-switcher-trigger"
                type="button"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                onClick={openAccountMenu}
              >
                <span className="account-switcher-avatar">{initials(userName)}</span>
                <span className="account-switcher-identity">
                  <strong>{userName}</strong>
                  <small>{user?.role.replace(/_/g, " ")}</small>
                </span>
                <ChevronDown className={`h-4 w-4 account-switcher-chevron ${accountMenuOpen ? "is-open" : ""}`} />
              </button>

              {accountMenuOpen ? (
                <div className="account-switcher-menu" role="menu">
                  <div className="account-switcher-heading">
                    <strong>{originalSession ? "Viewing account" : "Switch account"}</strong>
                  </div>

                  {originalSession ? (
                    <button className="account-return-button" type="button" role="menuitem" onClick={returnToSuperAdmin}>
                      <Undo2 className="h-4 w-4" />
                      <span>
                        <strong>Return to {originalSession.user.name || originalSession.user.username}</strong>
                        <small>Super Admin</small>
                      </span>
                    </button>
                  ) : (
                    <div className="account-switcher-list">
                      {accountsLoading ? <div className="account-switcher-state">Loading accounts...</div> : null}
                      {!accountsLoading && !accountError && accounts.map((account) => {
                        const accountName = account.name || account.username;
                        const selected = account.id === user?.id;

                        return (
                          <button
                            className={`account-switcher-option ${selected ? "is-selected" : ""}`}
                            type="button"
                            role="menuitem"
                            key={account.id}
                            disabled={selected || switchingUserId !== null}
                            onClick={() => switchAccount(account)}
                          >
                            <span className="account-option-avatar">{initials(accountName)}</span>
                            <span className="account-option-copy">
                              <strong>{accountName}</strong>
                              <small>{account.role.replace(/_/g, " ")}</small>
                            </span>
                            {selected ? <Check className="h-4 w-4" /> : null}
                            {switchingUserId === account.id ? <span className="account-option-loading">Switching...</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {accountError ? <div className="account-switcher-error">{accountError}</div> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </header>
        <div className="content">{canViewPage ? children : <AccessDenied />}</div>
      </main>
    </div>
  );
}
