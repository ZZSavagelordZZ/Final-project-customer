import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function LogoutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      await signOut();
      router.push("/Login");
    };

    performLogout();
  }, [signOut, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Logging out...</p>
    </div>
  );
}
