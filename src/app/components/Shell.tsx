"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import FooterNav from "./FooterNav";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRegister = pathname === "/register";

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 16 }}>
        {children}
      </main>
      {!isRegister && <FooterNav />}
    </>
  );
}
