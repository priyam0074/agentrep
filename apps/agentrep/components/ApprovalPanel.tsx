"use client";

import { useEffect, useRef } from "react";
import { formatINR } from "@agentrep/webmcp";
import { usePlanStore } from "@/store/planStore";

/**
 * The gate. request_approval blocks on this panel: the promise it
 * returned resolves only when one of these buttons is pressed, or when
 * it times out. The agent cannot route around it, and the token it
 * receives is bound to exactly the plan shown here.
 */
export function ApprovalPanel() {
  const pending = usePlanStore((s) => s.pendingApproval);
  const resolve = usePlanStore((s) => s.resolveApproval);
  const approveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (pending) approveRef.current?.focus(); }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") resolve("rejected"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, resolve]);

  if (!pending) return null;

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label="Approve bookings">
      <div className="approve">
        <p className="approve-kicker">Human approval required</p>
        <h3>Approve these bookings?</h3>
        <p className="ask">{pending.message}</p>

        <table className="lines">
          <tbody>
            {pending.lineItems.map((li) => (
              <tr key={li.slot}>
                <td>
                  {li.name}
                  <div className="prov">{li.label} · {li.provider}</div>
                </td>
                <td className="num">{formatINR(li.priceInPaise)}</td>
              </tr>
            ))}
            <tr className="total">
              <td>Total</td>
              <td className="num">{formatINR(pending.totalInPaise)}</td>
            </tr>
          </tbody>
        </table>

        <div className="approve-actions">
          <button ref={approveRef} className="btn btn-primary" onClick={() => resolve("approved")}>
            Approve and book
          </button>
          <button className="btn btn-ghost" onClick={() => resolve("rejected")}>
            Not yet
          </button>
        </div>
        <p className="fineprint">
          Approving issues a single-use token tied to this exact plan. If
          anything changes afterwards the token stops working and your agent
          has to ask again.
        </p>
      </div>
    </div>
  );
}
