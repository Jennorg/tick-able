"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mode = pathname === "/register" ? "register" : "login";

  return (
    <>
      <AuthForm mode={mode} />
      {children}
    </>
  );
}
