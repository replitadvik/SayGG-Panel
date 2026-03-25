import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2, Search, Trash2, RotateCcw, Edit, Copy, Clock, Key,
  Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Smartphone, AlertTriangle, Filter, MoreHorizontal, Shield, Ban, Zap,
  ChevronDown, ChevronUp, History, User,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatDuration(hours: number) {
  if (hours < 1) return `${hours}h`;
  if (hours < 24) return `${hours} Hour${hours !== 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (rem === 0) return `${days} Day${days !== 1 ? "s" : ""}`;
  return `${days}d ${rem}h`;
}

function formatDurationCompact(hours: number) {
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (rem === 0) return `${days}d`;
  return `${days}d ${rem}h`;
}

function RemainingTime({ expiredDate, status }: { expiredDate: string | null; status: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!expiredDate || status !== 1) return;
    const t = setInterval(() => setTick(v => v + 1), 60000);
    return () => clearInterval(t);
  }, [expiredDate, status]);

  if (status === 0) return <span className="text-red-500 text-[10px] font-medium">Blocked</span>;
  if (!expiredDate) return <span className="text-muted-foreground text-[10px]">Not Activated</span>;

  const now = Date.now();
  const exp = new Date(expiredDate).getTime();
  const diff = exp - now;

  if (diff <= 0) return <span className="text-orange-500 text-[10px] font-medium">Expired</span>;

  const totalMin = Math.floor(diff / 60000);
  const totalHrs = Math.floor(totalMin / 60);
  const days = Math.floor(totalHrs / 24);
  const hrs = totalHrs % 24;
  const mins = totalMin % 60;

  let text = "";
  if (days > 0) text = `${days}d ${hrs}h`;
  else if (totalHrs > 0) text = `${totalHrs}h ${mins}m`;
  else text = `${mins}m`;

  const urgent = totalHrs < 6;
  return (
    <span className={`text-[10px] font-medium ${urgent ? "text-orange-500" : "text-emerald-500"}`}>
      {text} left
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function parseDevices(devices: string | null): string[] {
  if (!devices) return [];
  return devices.split(",").filter(Boolean);
}

function getKeyStatusInfo(key: any): { label: string; variant: "default" | "destructive" | "secondary" | "outline"; color: string } {
  if (key.status === 0) return { label: "Blocked", variant: "destructive", color: "text-red-500" };
  if (key.expiredDate && new Date(key.expiredDate) < new Date()) return { label: "Expired", variant: "secondary", color: "text-orange-500" };
  if (key.expiredDate) return { label: "Active", variant: "default", color: "text-emerald-500" };
  return { label: "Not Activated", variant: "outline", color: "text-muted-foreground" };
}

const PAGE_SIZE = 15;

const FILTER_OPTIONS = [
  { value: "all", label: "All Keys", icon: Key },
  { value: "active", label: "Active", icon: Shield },
  { value: "blocked", label: "Blocked", icon: Ban },
  { value: "expired", label: "Expired", icon: Clock },
  { value: "activated", label: "Activated", icon: Zap },
  { value: "not-activated", label: "Not Activated", icon: AlertTriangle },
];

function DevicesCell({ devices, maxDevices, keyId }: { devices: string | null; maxDevices: number; keyId: number }) {
  const [open, setOpen] = useState(false);
  const parsed = parseDevices(devices);
  const count = parsed.length;

  if (count === 0) {
    return <span className="text-muted-foreground text-xs">0/{maxDevices}</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-primary hover:underline font-mono"
        data-testid={`button-view-devices-${keyId}`}
      >
        {count}/{maxDevices}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Device IDs ({count}/{maxDevices})
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {parsed.map((d, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded bg-muted/50 border border-border/40">
                <code className="text-xs font-mono flex-1 break-all">{d}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(d);
                  }}
                  className="text-muted-foreground hover:text-primary flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, isPending }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; description: string;
  onConfirm: () => void; isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded h-10">Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending} className="rounded h-10" data-testid="button-confirm-action">
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function KeysPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimer, setSearchTimer] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [editKey, setEditKey] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showDevices, setShowDevices] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [extendKey, setExtendKey] = useState<any>(null);
  const [extendDuration, setExtendDuration] = useState("");
  const [showExtendHistory, setShowExtendHistory] = useState(false);
  const [extendSuccess, setExtendSuccess] = useState<any>(null);
  const [resetKey, setResetKey] = useState<any>(null);
  const [resetSuccess, setResetSuccess] = useState<any>(null);
  const [showResetHistory, setShowResetHistory] = useState(false);
  const [registratorSearch, setRegistratorSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; action: () => void } | null>(null);

  const isOwner = user?.level === 1;

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300));
  }, [searchTimer]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (activeFilter !== "all") params.set("filter", activeFilter);
    return params.toString();
  }, [page, debouncedSearch, activeFilter]);

  const { data, isLoading } = useQuery<{
    keys: any[]; total: number; page: number; limit: number; totalPages: number;
  }>({
    queryKey: ["/api/keys", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/keys?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch keys");
      return res.json();
    },
  });

  const keys = data?.keys ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({ title: "Key deleted" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest("POST", "/api/keys/bulk-delete", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setSelectedKeys([]);
      toast({ title: "Keys deleted" });
    },
  });

  const bulkResetMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest("POST", "/api/keys/bulk-reset", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setSelectedKeys([]);
      toast({ title: "Devices reset on selected keys" });
    },
  });

  const deleteExpiredMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/keys/delete-expired");
    },
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setSelectedKeys([]);
      toast({ title: "Expired keys deleted" });
    },
  });

  const deleteUnactivatedMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/keys/delete-unactivated");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setSelectedKeys([]);
      toast({ title: "Unactivated keys deleted" });
    },
  });

  const resetDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      const resp = await apiRequest("POST", `/api/keys/${id}/reset-device`);
      return resp.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setResetKey(null);
      setShowResetHistory(false);
      setResetSuccess(data);
      setTimeout(() => setResetSuccess(null), 4000);
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/keys/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setEditKey(null);
      toast({ title: "Key updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const extendMutation = useMutation({
    mutationFn: async ({ id, duration }: { id: number; duration: string }) => {
      const resp = await apiRequest("POST", `/api/keys/${id}/extend`, { duration });
      return resp.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setExtendKey(null);
      setExtendDuration("");
      setShowExtendHistory(false);
      setExtendSuccess(data);
      setTimeout(() => setExtendSuccess(null), 4000);
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedKeys(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedKeys.length === keys.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(keys.map(k => k.id));
    }
  };

  const isAdmin = user?.level === 2;
  const isReseller = user?.level === 3;

  const openEdit = (key: any) => {
    setEditKey(key);
    setEditForm({
      game: key.game,
      userKey: key.userKey,
      duration: key.duration,
      maxDevices: key.maxDevices,
      status: key.status,
      registrator: key.registrator || "",
    });
    setShowDevices(false);
    setShowHistory(false);
    setRegistratorSearch("");
  };

  const editKeyHistory = useQuery<any[]>({
    queryKey: ["/api/keys", editKey?.id, "history"],
    queryFn: async () => {
      if (!editKey) return [];
      const res = await fetch(`/api/keys/${editKey.id}/history`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!editKey && showHistory,
  });

  const extendKeyHistory = useQuery<any[]>({
    queryKey: ["/api/keys", extendKey?.id, "extend-history"],
    queryFn: async () => {
      if (!extendKey) return [];
      const res = await fetch(`/api/keys/${extendKey.id}/history?type=Key Extend`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!extendKey && showExtendHistory,
  });

  const resetKeyHistory = useQuery<any[]>({
    queryKey: ["/api/keys", resetKey?.id, "reset-history"],
    queryFn: async () => {
      if (!resetKey) return [];
      const res = await fetch(`/api/keys/${resetKey.id}/history?type=Key Reset`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!resetKey && showResetHistory,
  });

  const usernamesList = useQuery<{ username: string; level: number }[]>({
    queryKey: ["/api/users/usernames"],
    queryFn: async () => {
      const res = await fetch("/api/users/usernames", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOwner && !!editKey,
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    setPage(1);
    setSelectedKeys([]);
  };

  const anyBulkPending = bulkDeleteMutation.isPending || bulkResetMutation.isPending ||
    deleteExpiredMutation.isPending || deleteUnactivatedMutation.isPending;

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-panel-header px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-panel-header-foreground/70" />
          <h1 className="text-sm font-semibold text-panel-header-foreground" data-testid="text-keys-title">Keys</h1>
          <span className="text-xs text-panel-header-foreground/50" data-testid="text-keys-count">{total} total</span>
        </div>
        <Link href="/keys/generate">
          <Button size="sm" className="h-8 rounded text-xs gap-1.5" data-testid="button-create-key">
            <Plus className="h-3.5 w-3.5" />
            Create Key
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keys, game, registrator..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-10 rounded bg-muted/50 border-border/60"
            data-testid="input-search-keys"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={activeFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-10 w-[150px] rounded bg-muted/50 border-border/60 text-xs" data-testid="select-filter">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2 text-xs">
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedKeys.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded border border-primary/20 bg-primary/5">
          <span className="text-xs font-medium text-primary flex-1">{selectedKeys.length} selected</span>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded text-xs gap-1"
              onClick={() => setConfirmAction({
                title: "Reset Devices",
                description: `Reset devices on ${selectedKeys.length} selected key(s)?`,
                action: () => { bulkResetMutation.mutate(selectedKeys); setConfirmAction(null); },
              })}
              disabled={anyBulkPending}
              data-testid="button-bulk-reset"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="h-7 rounded text-xs gap-1"
            onClick={() => setConfirmAction({
              title: "Delete Selected Keys",
              description: `Permanently delete ${selectedKeys.length} selected key(s)? This cannot be undone.`,
              action: () => { bulkDeleteMutation.mutate(selectedKeys); setConfirmAction(null); },
            })}
            disabled={anyBulkPending}
            data-testid="button-bulk-delete"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 rounded text-xs gap-1" data-testid="button-bulk-more">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setConfirmAction({
                    title: "Delete Expired Keys",
                    description: "Delete all expired keys globally? This cannot be undone.",
                    action: () => { deleteExpiredMutation.mutate(); setConfirmAction(null); },
                  })}
                  data-testid="menu-delete-expired"
                >
                  <Clock className="h-3.5 w-3.5 mr-2" />
                  Delete All Expired
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setConfirmAction({
                    title: "Delete Unactivated Keys",
                    description: "Delete all keys that have never been activated? This cannot be undone.",
                    action: () => { deleteUnactivatedMutation.mutate(); setConfirmAction(null); },
                  })}
                  data-testid="menu-delete-unactivated"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                  Delete All Unactivated
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="sm" className="h-7 rounded text-xs" onClick={() => setSelectedKeys([])}>
            Clear
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="table-keys">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-3 py-2.5 text-left w-10">
                  <Checkbox
                    checked={keys.length > 0 && selectedKeys.length === keys.length}
                    onCheckedChange={toggleAll}
                    className="rounded"
                    data-testid="checkbox-select-all"
                  />
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">ID</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Game</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap min-w-[120px]">User Key</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Duration</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Devices</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">By</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Expiry</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Created</th>
                <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground whitespace-nowrap sticky right-0 bg-muted/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <Skeleton className="h-4 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-16 text-center text-muted-foreground text-sm">
                    No keys found
                  </td>
                </tr>
              ) : (
                keys.map(key => {
                  const statusInfo = getKeyStatusInfo(key);
                  const deviceList = parseDevices(key.devices);
                  return (
                    <tr
                      key={key.id}
                      className={`border-b border-border/30 hover:bg-muted/20 ${selectedKeys.includes(key.id) ? "bg-primary/5" : ""}`}
                      data-testid={`row-key-${key.id}`}
                    >
                      <td className="px-3 py-2.5">
                        <Checkbox
                          checked={selectedKeys.includes(key.id)}
                          onCheckedChange={() => toggleSelect(key.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                        #{key.id}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-medium">
                        {key.game}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <code className="bg-muted/60 px-1.5 py-0.5 rounded font-mono text-[11px] max-w-[140px] truncate">{key.userKey}</code>
                          <button onClick={() => handleCopy(key.userKey)} className="text-muted-foreground hover:text-primary flex-shrink-0" data-testid={`button-copy-key-${key.id}`}>
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs">{formatDuration(key.duration)} <span className="text-muted-foreground text-[10px]">/ {key.duration}h</span></span>
                          <RemainingTime expiredDate={key.expiredDate} status={key.status} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <Badge variant={statusInfo.variant} className="text-[10px] rounded px-1.5 py-0">
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <DevicesCell devices={key.devices} maxDevices={key.maxDevices} keyId={key.id} />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        {key.registrator}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        {formatDate(key.expiredDate)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        {formatDate(key.createdAt)}
                      </td>
                      <td className={`px-3 py-2.5 whitespace-nowrap sticky right-0 ${selectedKeys.includes(key.id) ? "bg-primary/5" : "bg-card"}`}>
                        <div className="flex items-center justify-end gap-0.5">
                          <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground" onClick={() => openEdit(key)} data-testid={`button-edit-key-${key.id}`}>
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {(user?.level === 1 || user?.level === 2) && (
                            <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground" onClick={() => { setExtendKey(key); setExtendDuration(""); setShowExtendHistory(false); }} data-testid={`button-extend-key-${key.id}`}>
                              <Clock className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {deviceList.length > 0 && (
                            <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground" onClick={() => {
                              setResetKey(key);
                              setShowResetHistory(false);
                            }} data-testid={`button-reset-key-${key.id}`}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={() => {
                            setConfirmAction({
                              title: "Delete Key",
                              description: `Delete key "${key.userKey}"? This cannot be undone.`,
                              action: () => { deleteMutation.mutate(key.id); setConfirmAction(null); },
                            });
                          }} data-testid={`button-delete-key-${key.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({total} keys)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted/80 text-muted-foreground disabled:opacity-30"
                data-testid="button-page-first"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted/80 text-muted-foreground disabled:opacity-30"
                data-testid="button-page-prev"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {getPaginationRange(page, totalPages).map((p, i) => (
                p === "..." ? (
                  <span key={`dot-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`h-8 min-w-[32px] px-2 flex items-center justify-center rounded text-xs font-medium ${
                      page === p
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted/80 text-muted-foreground"
                    }`}
                    data-testid={`button-page-${p}`}
                  >
                    {p}
                  </button>
                )
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted/80 text-muted-foreground disabled:opacity-30"
                data-testid="button-page-next"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted/80 text-muted-foreground disabled:opacity-30"
                data-testid="button-page-last"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(v) => { if (!v) setConfirmAction(null); }}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        onConfirm={confirmAction?.action ?? (() => {})}
        isPending={anyBulkPending || deleteMutation.isPending || resetDeviceMutation.isPending}
      />

      <Dialog open={!!editKey} onOpenChange={() => setEditKey(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Key #{editKey?.id}
            </DialogTitle>
            {editKey && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-edit-count">
                {isOwner ? (
                  <>Edits: <span className="text-primary font-medium">∞</span></>
                ) : (
                  <>
                    Edits: {editKey.editCount ?? 0}/{user?.maxKeyEdits ?? 3} used
                    {(editKey.editCount ?? 0) >= (user?.maxKeyEdits ?? 3) && (
                      <span className="text-destructive ml-1 font-medium">— Limit reached</span>
                    )}
                  </>
                )}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Game</Label>
              <Input
                value={editForm.game || ""}
                onChange={e => setEditForm({...editForm, game: e.target.value})}
                disabled={!isOwner}
                className="h-11 rounded bg-muted/50 border-border/60"
                data-testid="input-edit-game"
              />
              {!isOwner && <p className="text-[10px] text-muted-foreground">Only Owner can change game</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Key</Label>
              <Input
                value={editForm.userKey || ""}
                onChange={e => setEditForm({...editForm, userKey: e.target.value})}
                disabled={isReseller}
                className="h-11 rounded bg-muted/50 border-border/60 font-mono"
                data-testid="input-edit-key"
              />
              {isReseller && <p className="text-[10px] text-muted-foreground">Resellers cannot edit key</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Duration (hrs)</Label>
                <Input
                  type="number"
                  value={editForm.duration || ""}
                  onChange={e => setEditForm({...editForm, duration: parseInt(e.target.value) || 0})}
                  disabled={isReseller}
                  className="h-11 rounded bg-muted/50 border-border/60"
                  data-testid="input-edit-duration"
                />
                {isReseller && <p className="text-[10px] text-muted-foreground">Resellers cannot edit duration</p>}
                {isAdmin && <p className="text-[10px] text-muted-foreground">Limited by your account validity</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Devices</Label>
                <Input
                  type="number"
                  value={editForm.maxDevices || ""}
                  onChange={e => setEditForm({...editForm, maxDevices: parseInt(e.target.value) || 1})}
                  disabled={isReseller}
                  max={isAdmin ? (user?.maxDevicesLimit ?? 1000) : undefined}
                  className="h-11 rounded bg-muted/50 border-border/60"
                  data-testid="input-edit-max-devices"
                />
                {isReseller && <p className="text-[10px] text-muted-foreground">Resellers cannot edit devices</p>}
                {isAdmin && <p className="text-[10px] text-muted-foreground">Max: {user?.maxDevicesLimit ?? 1000}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={String(editForm.status ?? 1)} onValueChange={v => setEditForm({...editForm, status: parseInt(v)})}>
                <SelectTrigger data-testid="select-edit-status" className="h-11 rounded bg-muted/50 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Block</SelectItem>
                </SelectContent>
              </Select>
              {editForm.status === 0 && (
                <p className="text-[10px] text-destructive">Blocked keys are rejected immediately on connect</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Generated By
              </Label>
              {isOwner ? (
                <div className="relative">
                  <Input
                    value={registratorSearch || editForm.registrator || ""}
                    onChange={e => {
                      setRegistratorSearch(e.target.value);
                      setEditForm({...editForm, registrator: e.target.value});
                    }}
                    placeholder="Search users..."
                    className="h-11 rounded bg-muted/50 border-border/60"
                    data-testid="input-edit-registrator"
                  />
                  {registratorSearch && usernamesList.data && (
                    <div className="absolute z-50 top-12 left-0 right-0 bg-card border border-border/60 rounded shadow-lg max-h-40 overflow-y-auto">
                      {usernamesList.data
                        .filter(u => u.username.toLowerCase().includes(registratorSearch.toLowerCase()))
                        .slice(0, 10)
                        .map(u => (
                          <button
                            key={u.username}
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex items-center justify-between"
                            onClick={() => {
                              setEditForm({...editForm, registrator: u.username});
                              setRegistratorSearch("");
                            }}
                            data-testid={`option-registrator-${u.username}`}
                          >
                            <span className="font-medium">{u.username}</span>
                            <span className="text-muted-foreground text-[10px]">{u.level === 1 ? "Owner" : u.level === 2 ? "Admin" : "Reseller"}</span>
                          </button>
                        ))}
                      {usernamesList.data.filter(u => u.username.toLowerCase().includes(registratorSearch.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No users found</p>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">Select from registered users only</p>
                </div>
              ) : (
                <div className="h-11 flex items-center px-3 rounded bg-muted/30 border border-border/60 text-sm text-muted-foreground">
                  {editForm.registrator || "—"}
                </div>
              )}
            </div>

            {editKey && (() => {
              const deviceList = parseDevices(editKey.devices);
              return (
                <div className="space-y-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium w-full"
                    onClick={() => setShowDevices(!showDevices)}
                    data-testid="button-toggle-devices"
                  >
                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                    Devices ({deviceList.length}/{editKey.maxDevices})
                    {showDevices ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                  </button>
                  {showDevices && (
                    <div className="rounded border border-border/60 bg-muted/20 p-3 space-y-1.5 max-h-48 overflow-y-auto">
                      {deviceList.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">No devices registered</p>
                      ) : deviceList.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-card border border-border/40">
                          <code className="text-[11px] font-mono flex-1 break-all text-muted-foreground">{d}</code>
                          <button onClick={() => handleCopy(d)} className="text-muted-foreground hover:text-primary flex-shrink-0" type="button">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {editKey && (
              <div className="space-y-2">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium w-full"
                  onClick={() => setShowHistory(!showHistory)}
                  data-testid="button-toggle-history"
                >
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  Edit History
                  {showHistory ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                </button>
                {showHistory && (
                  <div className="rounded border border-border/60 bg-muted/20 p-3 space-y-2 max-h-48 overflow-y-auto">
                    {editKeyHistory.isLoading ? (
                      <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                    ) : !editKeyHistory.data?.length ? (
                      <p className="text-xs text-muted-foreground text-center py-2">No edit history</p>
                    ) : editKeyHistory.data.map((log: any) => (
                      <div key={log.id} className="px-2 py-1.5 rounded bg-card border border-border/40 space-y-0.5">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-medium">{log.userDo}</span>
                          <span className="text-muted-foreground">{log.activity}</span>
                          <span className="text-muted-foreground ml-auto">{log.createdAt ? formatDate(log.createdAt) : ""}</span>
                        </div>
                        {log.description && <p className="text-[10px] text-muted-foreground">{log.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditKey(null)} className="rounded h-10">Cancel</Button>
            <Button
              onClick={() => {
                const payload: any = { status: editForm.status };
                if (isOwner) {
                  payload.game = editForm.game;
                  payload.userKey = editForm.userKey;
                  payload.duration = editForm.duration;
                  payload.maxDevices = editForm.maxDevices;
                  payload.registrator = editForm.registrator;
                } else if (isAdmin) {
                  payload.userKey = editForm.userKey;
                  payload.duration = editForm.duration;
                  payload.maxDevices = editForm.maxDevices;
                }
                updateMutation.mutate({ id: editKey.id, data: payload });
              }}
              disabled={updateMutation.isPending || (!isOwner && (editKey?.editCount ?? 0) >= (user?.maxKeyEdits ?? 3))}
              className="rounded h-10"
              data-testid="button-save-edit"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!extendKey} onOpenChange={() => setExtendKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Extend Duration
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded bg-muted/60 border border-border/60 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Key</span>
                <code className="font-mono text-foreground text-xs">{extendKey?.userKey}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Current Duration</span>
                <span className="text-foreground text-xs font-medium">{extendKey ? formatDuration(extendKey.duration) : ""}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Current Expiry</span>
                <span className="text-foreground text-xs font-medium">{extendKey ? formatDate(extendKey.expiredDate) : ""}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Status</span>
                <Badge variant="outline" className={`text-[10px] rounded px-1.5 py-0.5 ${extendKey?.status === 1 ? "border-green-500/50 text-green-600 dark:text-green-400" : "border-red-500/50 text-red-600 dark:text-red-400"}`}>
                  {extendKey?.status === 1 ? "Active" : "Blocked"}
                </Badge>
              </div>
              {extendKey?.registrator && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Registrator</span>
                  <span className="text-foreground text-xs">{extendKey.registrator}</span>
                </div>
              )}
            </div>

            <div className={`p-3 rounded text-xs space-y-1 ${isOwner ? "bg-primary/10 border border-primary/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Extend attempts used</span>
                <span className="font-medium">{isOwner ? <span className="text-primary">∞</span> : `${extendKey?.extendCount ?? 0} / ${user?.maxKeyExtends ?? 5}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">{isOwner ? <span className="text-primary">∞</span> : Math.max(0, (user?.maxKeyExtends ?? 5) - (extendKey?.extendCount ?? 0))}</span>
              </div>
              {!isOwner && (extendKey?.extendCount ?? 0) >= (user?.maxKeyExtends ?? 5) && (
                <p className="text-red-500 text-[10px] pt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Extend limit reached. Contact Owner.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Extension to Add</Label>
              <Input
                value={extendDuration}
                onChange={e => setExtendDuration(e.target.value.toUpperCase())}
                placeholder="e.g. 30D, 12H, 7D"
                className="h-11 rounded bg-muted/50 border-border/60 font-mono"
                data-testid="input-extend-duration"
              />
              <p className="text-[10px] text-muted-foreground">Use number + D (days) or H (hours). Examples: 30D = 30 days, 12H = 12 hours</p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium w-full"
                onClick={() => setShowExtendHistory(!showExtendHistory)}
                data-testid="button-toggle-extend-history"
              >
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                Extend History
                {showExtendHistory ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </button>
              {showExtendHistory && (
                <div className="rounded border border-border/60 bg-muted/20 p-3 space-y-2 max-h-48 overflow-y-auto">
                  {extendKeyHistory.isLoading ? (
                    <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  ) : !extendKeyHistory.data?.length ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No extend history</p>
                  ) : extendKeyHistory.data.map((log: any) => (
                    <div key={log.id} className="px-2 py-1.5 rounded bg-card border border-border/40 space-y-0.5">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-medium">{log.userDo}</span>
                        <span className="text-muted-foreground ml-auto">{log.createdAt ? formatDate(log.createdAt) : ""}</span>
                      </div>
                      {log.description && <p className="text-[10px] text-muted-foreground break-all">{log.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExtendKey(null)} className="rounded h-10">Cancel</Button>
            <Button
              onClick={() => extendMutation.mutate({ id: extendKey.id, duration: extendDuration })}
              disabled={extendMutation.isPending || !extendDuration || (!isOwner && (extendKey?.extendCount ?? 0) >= (user?.maxKeyExtends ?? 5))}
              className="rounded h-10"
              data-testid="button-extend-save"
            >
              {extendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!extendSuccess} onOpenChange={() => setExtendSuccess(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
              <Zap className="h-4 w-4" />
              Key Extended
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 rounded bg-green-500/10 border border-green-500/30 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Added</span>
                <span className="font-medium text-xs text-green-600 dark:text-green-400">+{extendSuccess?.extensionLabel}</span>
              </div>
              {extendSuccess?.previousExpiry && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Previous Expiry</span>
                  <span className="text-xs">{formatDate(extendSuccess.previousExpiry)}</span>
                </div>
              )}
              {extendSuccess?.newExpiry && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">New Expiry</span>
                  <span className="font-medium text-xs">{formatDate(extendSuccess.newExpiry)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Total Duration</span>
                <span className="font-medium text-xs">{extendSuccess ? formatDuration(extendSuccess.totalDuration) : ""}</span>
              </div>
              <div className="border-t border-border/40 my-1" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Extends Used</span>
                <span className="font-medium text-xs">{extendSuccess?.extendLimit === null ? <span className="text-primary">∞</span> : `${extendSuccess?.extendCount} / ${extendSuccess?.extendLimit}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Remaining</span>
                <span className="font-medium text-xs">{extendSuccess?.remaining === null ? <span className="text-primary">∞</span> : extendSuccess?.remaining}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendSuccess(null)} className="rounded h-10 w-full" data-testid="button-extend-success-close">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetKey} onOpenChange={v => { if (!v) { setResetKey(null); setShowResetHistory(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-destructive" />
              Reset Devices
            </DialogTitle>
          </DialogHeader>
          {resetKey && (() => {
            const devices = parseDevices(resetKey.devices);
            const raw = resetKey.keyResetTime || "0";
            const resetUsed = /^\d+$/.test(raw) ? parseInt(raw) : 0;
            const resetLimit = user?.maxKeyResets ?? 3;
            const atLimit = !isOwner && resetUsed >= resetLimit;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-muted/50 border border-border/40">
                    <p className="text-[10px] text-muted-foreground">Key</p>
                    <p className="text-xs font-mono font-medium truncate">{resetKey.userKey}</p>
                  </div>
                  <div className="p-3 rounded bg-muted/50 border border-border/40">
                    <p className="text-[10px] text-muted-foreground">Game</p>
                    <p className="text-xs font-medium">{resetKey.game}</p>
                  </div>
                </div>

                <div className="p-3 rounded bg-muted/50 border border-border/40 space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                    Devices to Remove ({devices.length})
                  </p>
                  {devices.length > 0 ? (
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {devices.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-card border border-border/40">
                          <code className="text-[10px] font-mono flex-1 break-all text-destructive">{d}</code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No devices registered</p>
                  )}
                </div>

                <div className={`p-3 rounded border space-y-1 ${isOwner ? "bg-primary/10 border-primary/30" : atLimit ? "bg-destructive/10 border-destructive/30" : "bg-muted/50 border-border/40"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Resets Used</span>
                    <span className={`text-xs font-medium ${isOwner ? "" : atLimit ? "text-destructive" : ""}`}>{isOwner ? <span className="text-primary">∞</span> : `${resetUsed} / ${resetLimit}`}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Remaining</span>
                    <span className={`text-xs font-medium ${isOwner ? "" : atLimit ? "text-destructive" : ""}`}>{isOwner ? <span className="text-primary">∞</span> : Math.max(0, resetLimit - resetUsed)}</span>
                  </div>
                  {!isOwner && atLimit && <p className="text-[10px] text-destructive font-medium">Reset limit reached</p>}
                </div>

                <button
                  onClick={() => setShowResetHistory(!showResetHistory)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full"
                  data-testid="button-toggle-reset-history"
                >
                  <History className="h-3.5 w-3.5" />
                  Reset History
                  {showResetHistory ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                </button>
                {showResetHistory && (
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {resetKeyHistory.isLoading ? (
                      <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                    ) : !resetKeyHistory.data?.length ? (
                      <p className="text-xs text-muted-foreground text-center py-2">No reset history</p>
                    ) : resetKeyHistory.data.map((log: any) => (
                      <div key={log.id} className="px-2 py-1.5 rounded bg-card border border-border/40 space-y-0.5">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-medium">{log.userDo}</span>
                          <span className="text-muted-foreground ml-auto">{log.createdAt ? formatDate(log.createdAt) : ""}</span>
                        </div>
                        {log.description && <p className="text-[10px] text-muted-foreground break-all">{log.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setResetKey(null); setShowResetHistory(false); }} className="rounded h-10">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => resetDeviceMutation.mutate(resetKey.id)}
              disabled={resetDeviceMutation.isPending || parseDevices(resetKey?.devices).length === 0 || (!isOwner && (/^\d+$/.test(resetKey?.keyResetTime || "0") ? parseInt(resetKey.keyResetTime) : 0) >= (user?.maxKeyResets ?? 3))}
              className="rounded h-10"
              data-testid="button-confirm-reset"
            >
              {resetDeviceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Reset All Devices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetSuccess} onOpenChange={() => setResetSuccess(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
              <RotateCcw className="h-4 w-4" />
              Devices Reset
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 rounded bg-green-500/10 border border-green-500/30 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Key</span>
                <span className="font-mono text-xs font-medium">{resetSuccess?.keyUserKey}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Devices Removed</span>
                <span className="font-medium text-xs text-destructive">{resetSuccess?.devicesRemoved}</span>
              </div>
              <div className="border-t border-border/40 my-1" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Resets Used</span>
                <span className="font-medium text-xs">{resetSuccess?.resetLimit === null ? <span className="text-primary">∞</span> : `${resetSuccess?.resetUsed} / ${resetSuccess?.resetLimit}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Remaining</span>
                <span className="font-medium text-xs">{resetSuccess?.resetLeft === null ? <span className="text-primary">∞</span> : resetSuccess?.resetLeft}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetSuccess(null)} className="rounded h-10 w-full" data-testid="button-reset-success-close">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getPaginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];
  pages.push(1);

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}
