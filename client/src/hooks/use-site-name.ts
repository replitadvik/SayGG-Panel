import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const DEFAULT_SITE_NAME = "Key-Panel";

export function useSiteName() {
  const { data, isLoading } = useQuery<{ siteName: string }>({
    queryKey: ["/api/settings/site-name"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const siteName = data?.siteName || DEFAULT_SITE_NAME;

  useEffect(() => {
    document.title = siteName;
  }, [siteName]);

  return { siteName, isLoading };
}
