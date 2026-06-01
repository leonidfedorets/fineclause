import { useState, useEffect } from "react";
import { useWebAuthn, type PasskeyRecord } from "@/hooks/useWebAuthn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Fingerprint, Trash2, Plus, Shield, Smartphone, Monitor,
  Pencil, Check, X, RefreshCw, Cloud,
} from "lucide-react";

const DeviceIcon = ({ type }: { type: string | null }) =>
  type === "multiDevice"
    ? <Smartphone className="w-4 h-4 text-accent" />
    : <Monitor className="w-4 h-4 text-accent" />;

export const PasskeyManager = () => {
  const { isSupported, registerPasskey, getPasskeys, renamePasskey, deletePasskey } = useWebAuthn();
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const refresh = async () => {
    setRefreshing(true);
    setPasskeys(await getPasskeys());
    setRefreshing(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleAdd = async () => {
    setLoading(true);
    const deviceName = prompt("Name this passkey (e.g. MacBook Touch ID, iPhone Face ID):");
    if (deviceName === null) { setLoading(false); return; }
    const ok = await registerPasskey(deviceName);
    if (ok) await refresh();
    setLoading(false);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    const ok = await renamePasskey(id, editName);
    if (ok) { setEditingId(null); await refresh(); }
  };

  const handleDelete = async (key: PasskeyRecord) => {
    if (!confirm(`Remove passkey "${key.name}"?\n\nYou won't be able to use it to sign in.`)) return;
    const ok = await deletePasskey(key.id);
    if (ok) await refresh();
  };

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground flex items-start gap-3">
        <Fingerprint className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-foreground">Passkeys not supported</p>
          <p className="mt-0.5">Your browser doesn't support WebAuthn passkeys yet. Try Chrome 108+, Safari 16+, or Edge 108+.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="passkey-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            Passkeys & Biometric Sign-In
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in instantly with Face ID, Touch ID, or Windows Hello — no password needed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={refresh} disabled={refreshing} className="h-8 w-8 p-0">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={loading}
            className="gap-1.5 h-8"
            data-testid="add-passkey-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Passkey
          </Button>
        </div>
      </div>

      {/* Passkey list */}
      {passkeys.length === 0 ? (
        <div
          className="p-8 text-center rounded-xl border border-dashed border-border cursor-pointer hover:border-accent/40 hover:bg-accent/3 transition-colors group"
          onClick={handleAdd}
          data-testid="no-passkeys-prompt"
        >
          <Fingerprint className="w-10 h-10 text-muted-foreground group-hover:text-accent mx-auto mb-3 transition-colors" />
          <p className="text-sm font-medium text-foreground">No passkeys yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click to add your first passkey and enable biometric sign-in.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {passkeys.map((key) => (
            <Card key={key.id} className="p-4" data-testid="passkey-item">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <DeviceIcon type={key.device_type} />
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  {editingId === key.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(key.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        data-testid="passkey-rename-input"
                      />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleRename(key.id)}>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground truncate">{key.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at && (
                          <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</>
                        )}
                      </p>
                    </>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {key.backed_up && (
                    <Badge variant="secondary" className="text-[10px] gap-1 px-1.5">
                      <Cloud className="w-2.5 h-2.5" /> Synced
                    </Badge>
                  )}
                  {editingId !== key.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => { setEditingId(key.id); setEditName(key.name); }}
                      data-testid="passkey-rename-btn"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(key)}
                    data-testid="passkey-delete-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How passkeys work</p>
        <p>A passkey stores a private key on your device — it never leaves it. FineClause only sees a public key, so even if our database were breached, your passkey cannot be stolen or reused elsewhere.</p>
        <p>Synced passkeys (☁️) are backed up to iCloud Keychain or Google Password Manager and work across your devices.</p>
      </div>
    </div>
  );
};

export default PasskeyManager;
