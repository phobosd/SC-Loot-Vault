"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run if we are inside an iframe
    if (window.self !== window.top) {
      const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      
      window.parent.postMessage({
        type: "VAULT_ROUTE_CHANGE",
        path: fullPath
      }, "*");
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}
