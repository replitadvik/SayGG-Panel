import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useSiteName() {
  const { data, isLoading } = useQuery<{ siteName: string }>({
    queryKey: ["/api/settings/site-name"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const siteName = data?.siteName || "";

  useEffect(() => {
    if (siteName) {
      document.title = siteName;
    }
  }, [siteName]);

  return { siteName, isLoading };
}
