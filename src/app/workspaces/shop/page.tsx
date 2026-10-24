import React from 'react';
import { Store, Lock, FileSpreadsheet, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { canAccessOrderPrescription, canAccessWorkspace } from '@/lib/permissions/engine';
import { formatPaiseToINR } from '@/lib/workflows/transactions';

export default async function ShopWorkspacePage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  const actor = bootstrap.actor;
  const access = canAccessWorkspace(actor, 'shop');
  const orders = bootstrap.orders ?? [];
  const ledger = bootstrap.ledger_entries ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 sm:p-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
          Separated Role Workspace • Merchant, Pharmacy & Vendor Ledger (SHOP-04..11 & Test 5)
        </span>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Shop Fulfilment Desk, Prescription Verification & Account Ledger
        </h1>
        <p className="text-sm text-[#475569]">
          Switch to <strong>Suresh Agarwal (Annapurna Daily Fresh Mart)</strong> or <strong>Dr. Zoya Merchant (CarePlus Community Pharmacy)</strong> in the top persona selector to compare shop-isolated orders, ledger entries, and pharmacist-only prescription access.
        </p>
      </section>

      {!access.allowed ? (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-400 p-6 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <Lock className="w-5 h-5" />
            <span>Shop Workspace Restricted for {actor.display_name}</span>
          </div>
          <p className="text-xs text-amber-950">{access.reason}</p>
          <p className="text-xs text-amber-900">
            Select <strong>Suresh Agarwal</strong>, <strong>Dr. Zoya Merchant (RPh)</strong>, or <strong>Meera Chawla (Commerce Sub-Admin)</strong> in the top persona selector to access this workspace.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-bold text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{access.reason}</span>
          </div>

          {/* Shop Order Queue & Prescription Privacy Check */}
          <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#0F766E]" />
              <h2 className="text-base font-bold text-[#0F172A]">
                Shop-Scoped Order Fulfilment & Prescription Gate ({orders.length} Orders)
              </h2>
            </div>

            <div className="space-y-3">
              {orders.map((ord) => {
                const rxCheck = canAccessOrderPrescription(actor, ord);
                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] text-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[#0F172A]">
                        {ord.shop_name} • Order {ord.id.slice(0, 8)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-[#0F766E] font-bold uppercase">
                        {ord.status.replace(/_/g, ' ')} • {formatPaiseToINR(ord.total_paise)}
                      </span>
                    </div>
                    <div className="text-[#475569]">
                      Order-Scoped Delivery Contact Snapshot (MEM-03 / Test 3):{' '}
                      <strong>
                        {ord.buyer_name_snapshot} — {ord.delivery_building_snapshot}, Flat {ord.delivery_unit_snapshot} ({ord.delivery_phone_snapshot})
                      </strong>
                    </div>
                    {ord.has_restricted_prescription && (
                      <div
                        className={`p-2.5 rounded-lg border font-medium ${
                          rxCheck.allowed
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                        }`}
                      >
                        <strong>Prescription Gate (SHOP-11 / Test 5):</strong> {rxCheck.reason}
                        {ord.prescription_attachment && (
                          <span className="block font-mono mt-1">
                            File: {ord.prescription_attachment.storage_bucket}/{ord.prescription_attachment.storage_path}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Vendor Account Ledger (SHOP-08, SHOP-10) */}
          <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#0F766E]" />
              <h2 className="text-base font-bold text-[#0F172A]">
                Vendor Account Ledger: Sales, Adjustments & Payment Verification ({ledger.length} Entries)
              </h2>
            </div>

            <div className="space-y-2">
              {ledger.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] text-xs flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-[#0F172A]">{entry.shop_name}</span> •{' '}
                    <span className="uppercase font-semibold text-[#0F766E]">
                      {entry.entry_type.replace('_', ' ')}
                    </span>
                    <p className="text-[#475569] mt-0.5">{entry.payment_evidence_note}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-[#0F172A] tabular-nums">
                      {formatPaiseToINR(entry.amount_paise)}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        entry.is_settled_verified ? 'text-emerald-800' : 'text-amber-800'
                      }`}
                    >
                      {entry.is_settled_verified ? 'Merchant Confirmed' : 'Payment Reported (Unverified)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
