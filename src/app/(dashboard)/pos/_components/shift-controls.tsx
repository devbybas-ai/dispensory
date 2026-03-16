"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import {
  openShift,
  closeShift,
  openCashDrawer,
} from "@/domains/commerce/pos/shift-actions";
import { wrapAction } from "@/lib/action-response";

interface ActiveShift {
  id: string;
  startedAt: string;
  drawerCount: number;
}

interface ShiftControlsProps {
  activeShift: ActiveShift | null;
  premisesId: string;
}

export function ShiftControls({ activeShift, premisesId }: ShiftControlsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [drawerDialogOpen, setDrawerDialogOpen] = useState(false);
  const [pendingShiftId, setPendingShiftId] = useState<string | null>(null);
  const [registerName, setRegisterName] = useState("Register 1");
  const [openingBalance, setOpeningBalance] = useState("");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  async function handleOpenShift() {
    setIsLoading(true);

    const result = await wrapAction(() => openShift(premisesId));

    if (!result.success) {
      toast.error("Failed to open shift", { description: result.error });
      setIsLoading(false);
      return;
    }

    toast.success("Shift opened");
    setPendingShiftId(result.data.id);
    setDrawerDialogOpen(true);
    setIsLoading(false);
  }

  async function handleOpenDrawer() {
    if (!pendingShiftId) return;

    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) {
      toast.error("Enter a valid opening balance");
      return;
    }

    setIsLoading(true);

    const result = await wrapAction(() =>
      openCashDrawer(pendingShiftId, registerName.trim(), balance)
    );

    if (!result.success) {
      toast.error("Failed to open cash drawer", {
        description: result.error,
      });
      setIsLoading(false);
      return;
    }

    toast.success("Cash drawer opened", {
      description: `${registerName} with $${balance.toFixed(2)} opening balance`,
    });

    setDrawerDialogOpen(false);
    setPendingShiftId(null);
    setRegisterName("Register 1");
    setOpeningBalance("");
    setIsLoading(false);
    router.refresh();
  }

  async function handleCloseShift() {
    if (!activeShift) return;

    setIsLoading(true);

    const result = await wrapAction(() => closeShift(activeShift.id));

    if (!result.success) {
      toast.error("Failed to close shift", { description: result.error });
      setIsLoading(false);
      setConfirmCloseOpen(false);
      return;
    }

    toast.success("Shift closed");
    setConfirmCloseOpen(false);
    setIsLoading(false);
    router.refresh();
  }

  if (!activeShift) {
    return (
      <Button onClick={handleOpenShift} disabled={isLoading}>
        <Clock data-icon="inline-start" />
        {isLoading ? "Opening..." : "Open Shift"}
      </Button>
    );
  }

  const startedAt = new Date(activeShift.startedAt);
  const duration = formatDuration(startedAt);

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Shift started </span>
          <span className="font-medium">
            {startedAt.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-muted-foreground"> ({duration})</span>
          <span className="text-muted-foreground">
            {" "}
            &middot; {activeShift.drawerCount} drawer(s)
          </span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={isLoading}
          onClick={() => setConfirmCloseOpen(true)}
        >
          Close Shift
        </Button>
      </div>

      {/* Cash Drawer Dialog */}
      <Dialog open={drawerDialogOpen} onOpenChange={setDrawerDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Open Cash Drawer</DialogTitle>
            <DialogDescription>
              Set up your cash drawer for this shift.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-name">Register Name</Label>
              <Input
                id="register-name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="e.g., Register 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening-balance">Opening Balance ($)</Label>
              <Input
                id="opening-balance"
                type="number"
                min={0}
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleOpenDrawer}
              disabled={isLoading || !registerName.trim()}
            >
              {isLoading ? "Opening..." : "Open Drawer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Close Dialog */}
      <Dialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Close Shift</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this shift? Make sure all
              transactions are complete.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCloseOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseShift}
              disabled={isLoading}
            >
              {isLoading ? "Closing..." : "Close Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Format duration from a start time to now as a human-readable string. */
function formatDuration(start: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
}
