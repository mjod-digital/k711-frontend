"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES_PATH } from "@/config/site";

const MOBILE_QUERY = "(max-width: 1279px)";

export const MobileRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);

    const redirectOnMobile = () => {
      if (media.matches) {
        router.replace(ROUTES_PATH.apartments);
      }
    };

    redirectOnMobile();
    media.addEventListener("change", redirectOnMobile);

    return () => media.removeEventListener("change", redirectOnMobile);
  }, [router]);

  return null;
}
