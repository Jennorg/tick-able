"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mode = pathname === "/register" ? "register" : "login";

  return (
    <>
      <Suspense fallback={null}>
        <AuthForm mode={mode} />
      </Suspense>
      {children}
    </>
  );
}
