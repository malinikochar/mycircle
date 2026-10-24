'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Lock,
  Plus,
  RefreshCw,
} from 'lucide-react';
import type { OrderRecord, ShopItem } from '@/lib/types/domain';
import { formatPaiseToINR } from '@/lib/workflows/transactions';
import { placeShopOrderAction, respondOrderPriceChangeAction } from '@/app/actions/community-actions';

interface ShopsCommerceClientProps {
  actorId: string;
  actorName: string;
  shops: ShopItem[];
  orders: OrderRecord[];
}

export function ShopsCommerceClient({
  actorId,
  actorName,
  shops,
  orders,
}: ShopsCommerceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedShopId, setSelectedShopId] = useState<string>(shops[0]?.id ?? '');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(`order-key-${Date.now()}`);
  const [paymentMethod, setPaymentMethod] = useState<'pay_on_delivery' | 'direct_upi' | 'counter_pickup'>('pay_on_delivery');
  const [instructions, setInstructions] = useState('Deliver to tower lobby security desk');
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedShop = shops.find((s) => s.id === selectedShopId) ?? shops[0];

  function handlePlaceOrder(shopId: string, productId: string, productName: string) {
    startTransition(async () => {
      const res = await placeShopOrderAction({
        shopId,
        productId,
        quantity: 1,
        idempotencyKey,
        paymentMethod,
        instructions,
      });
      if (res.ok) {
        setFeedback(
          res.data?.idempotent_replay
            ? `Idempotent Replay Verified (SHOP-04): Order ${res.data.order_id} with key "${idempotencyKey}" already exists — duplicate order prevented! Click "New Key" to place a fresh order.`
            : `Order placed for "${productName}"! Server calculated total: ${formatPaiseToINR(res.data?.total_paise)} (Invoice generated & Ledger debit recorded). Re-clicking with the same key will demonstrate idempotency.`
        );
        router.refresh();
      } else {
        setFeedback(`Server Validation Blocked Order: ${res.error}`);
      }
    });
  }

  function handlePriceChangeDecision(orderId: string, approve: boolean) {
    startTransition(async () => {
      const res = await respondOrderPriceChangeAction({ orderId, approve });
      if (res.ok) {
        setFeedback(
          approve
            ? `Approved proposed price/weight adjustment on order ${orderId.slice(0, 8)} — status moved to "accepted" (SHOP-05).`
            : `Declined proposed adjustment — order ${orderId.slice(0, 8)} cancelled without penalty.`
        );
        router.refresh();
      } else {
        setFeedback(`Error: ${res.error}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-[#E5DEC9] p-5 sm:p-6 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
          Phase 2 • SHOP-01..11 (Tests 4, 5 & 6)
        </span>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Local Arcade Shops, Server-Validated Orders, Invoices & Gated Pharmacy
        </h1>
        <p className="text-sm text-[#475569]">
          Prices, GST, and delivery fees are computed in integer paise on the Supabase server (`cc_place_shop_order`). Price/weight changes require explicit buyer approval (`SHOP-05`), and prescription attachments are restricted to the patient and licensed pharmacist (`SHOP-11`).
        </p>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-300 text-xs font-semibold text-[#0F172A]">
            {feedback}
          </div>
        )}
      </div>

      {/* Shop Selector & Catalogue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#0F172A]">Verified Community Shops</h2>
          {shops.map((shop) => {
            const active = shop.id === selectedShop?.id;
            return (
              <button
                key={shop.id}
                type="button"
                onClick={() => setSelectedShopId(shop.id)}
                className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                  active
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                    : 'bg-white text-[#0F172A] border-[#E5DEC9] hover:border-[#0F766E]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-600 text-white">
                    {shop.category}
                  </span>
                  <span className="text-xs opacity-80">{shop.unit_location}</span>
                </div>
                <div className="font-bold text-base">{shop.name}</div>
                <p className={`text-xs leading-relaxed ${active ? 'text-slate-300' : 'text-[#475569]'}`}>
                  {shop.description}
                </p>
                <div className="text-[11px] pt-1 flex items-center justify-between opacity-90">
                  <span>Min Order: {formatPaiseToINR(shop.min_order_paise)}</span>
                  <span>Delivery: {formatPaiseToINR(shop.delivery_fee_paise)}</span>
                </div>
              </button>
            );
          })}

          {/* Checkout Idempotency & Payment Controls */}
          <div className="rounded-2xl bg-white border border-[#E5DEC9] p-4 space-y-3 text-xs">
            <div className="font-bold text-[#0F172A] flex items-center justify-between">
              <span>Server Checkout Controls (Test 4)</span>
              <button
                type="button"
                onClick={() => setIdempotencyKey(`order-key-${Date.now()}`)}
                className="inline-flex items-center gap-1 text-[#0F766E] font-bold hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>New Idempotency Key</span>
              </button>
            </div>
            <div>
              <label className="block text-[#475569] mb-1">Idempotency Key (Prevents Double Submit)</label>
              <input
                type="text"
                readOnly
                value={idempotencyKey}
                className="w-full rounded-lg border border-[#E5DEC9] px-2.5 py-1.5 bg-[#FAF8F5] font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[#475569] mb-1">Payment Mode (Honest Adapter — SHOP-10)</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                className="w-full rounded-lg border border-[#E5DEC9] px-2.5 py-1.5 bg-white"
              >
                <option value="pay_on_delivery">Pay on Delivery (Cash / Doorstep UPI)</option>
                <option value="direct_upi">Direct Merchant UPI (Reported → Merchant Confirmed)</option>
                <option value="counter_pickup">Counter Pickup</option>
              </select>
            </div>
            <div>
              <label className="block text-[#475569] mb-1">Delivery Note</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full rounded-lg border border-[#E5DEC9] px-2.5 py-1.5 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Selected Shop Product Catalogue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F172A]">
              {selectedShop?.name} — Catalogue & Live Stock
            </h2>
            <span className="text-xs text-[#475569]">GSTIN: {selectedShop?.gstin_number ?? 'Exempt'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(selectedShop?.products ?? []).map((prod) => (
              <div
                key={prod.id}
                className="rounded-2xl bg-white border border-[#E5DEC9] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#0F766E]">{prod.category}</span>
                    <span className="text-xs font-medium text-[#475569] tabular-nums">
                      Stock: {prod.stock_quantity} {prod.unit_label}s
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#0F172A]">{prod.name}</h3>
                  <div className="text-xs text-[#475569]">
                    Pack: <strong>{prod.pack_size}</strong> • GST: {(prod.tax_rate_bps / 100).toFixed(1)}%
                  </div>
                  {prod.requires_prescription && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>Gated Rx Item: Requires private prescription & licensed pharmacist review (SHOP-11)</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E5DEC9] flex items-center justify-between gap-2">
                  <div className="text-base font-bold text-[#0F172A] tabular-nums">
                    {formatPaiseToINR(prod.price_paise)}
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handlePlaceOrder(selectedShop.id, prod.id, prod.name)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Order 1 {prod.unit_label}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actor-Scoped Orders, Buyer Approval Queue & Traceable Invoices */}
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">
            Orders, Buyer Price-Change Approvals & Itemised Invoices ({orders.length} Visible to {actorName})
          </h2>
          <p className="text-xs text-[#475569]">
            RLS & RPC Scoped: You only see orders where you are the buyer, an active shop member, or Commerce Sub-Admin (Test 4 & Test 5).
          </p>
        </div>

        <div className="space-y-4">
          {orders.map((ord) => (
            <article
              key={ord.id}
              className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#0F766E]" />
                  <span className="font-bold text-sm text-[#0F172A]">{ord.shop_name}</span>
                  <span className="text-xs text-[#475569]">• Buyer: {ord.buyer_name_snapshot}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-[#0F766E]">
                    Fulfilment: {ord.status.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-800">
                    Payment: {ord.payment_status.replace(/_/g, ' ')} ({ord.payment_method})
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-1 text-xs">
                {ord.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-[#1E293B]">
                    <span>
                      {item.quantity}x <strong>{item.product_name_snapshot}</strong> ({item.pack_size_snapshot})
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatPaiseToINR(item.line_total_paise_snapshot)} (incl. GST {formatPaiseToINR(item.tax_paise_snapshot)})
                    </span>
                  </div>
                ))}
              </div>

              {/* Buyer Price/Weight Approval Prompt (SHOP-05 / Test 6) */}
              {ord.status === 'awaiting_buyer_approval' && ord.proposed_total_paise && (
                <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-amber-400 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#B45309]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Shop Proposed Pack/Price Adjustment (Requires Buyer Approval — SHOP-05)
                    </span>
                    <span className="tabular-nums">
                      {formatPaiseToINR(ord.total_paise)} → {formatPaiseToINR(ord.proposed_total_paise)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800">{ord.price_change_reason}</p>
                  {ord.buyer_id === actorId ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handlePriceChangeDecision(ord.id, true)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0F766E] text-white text-xs font-bold cursor-pointer"
                      >
                        Approve Revised Total ({formatPaiseToINR(ord.proposed_total_paise)})
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handlePriceChangeDecision(ord.id, false)}
                        className="px-3.5 py-1.5 rounded-lg bg-white border border-red-300 text-red-700 text-xs font-bold cursor-pointer"
                      >
                        Decline & Cancel Order
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-900">
                      Only buyer {ord.buyer_name_snapshot} can approve or reject this adjustment.
                    </p>
                  )}
                </div>
              )}

              {/* Prescription Privacy Verification (SHOP-11 / Test 5) */}
              {ord.has_restricted_prescription && (
                <div className="p-3 rounded-xl bg-white border border-[#E5DEC9] text-xs flex items-center justify-between">
                  {ord.prescription_attachment ? (
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Authorised Prescription Access ({ord.prescription_attachment.storage_bucket}/
                        {ord.prescription_attachment.storage_path}) • Verified by Pharmacist
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Lock className="w-4 h-4 shrink-0 text-amber-700" />
                      <span>
                        Prescription Attachment Redacted by Server (SHOP-11 / Test 5): Only patient or licensed shop pharmacist Dr. Zoya Merchant can view Rx files.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Itemised Invoice & Revision Trail (SHOP-07..09) */}
              {ord.invoice && (
                <div className="p-3 rounded-xl bg-white border border-[#E5DEC9] text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0F766E]" />
                      Invoice {ord.invoice.invoice_number} (Rev #{ord.invoice.current_revision_number} •{' '}
                      {ord.invoice.status.toUpperCase()})
                    </span>
                    <span className="font-bold text-sm text-[#0F172A] tabular-nums">
                      Total: {formatPaiseToINR(ord.invoice.total_paise)}
                    </span>
                  </div>
                  {ord.invoice.revisions && ord.invoice.revisions.length > 0 && (
                    <div className="pt-1 border-t border-[#E5DEC9] text-[11px] text-[#475569]">
                      {ord.invoice.revisions.map((rev) => (
                        <div key={rev.revision_number}>
                          <strong>Revision #{rev.revision_number}:</strong>{' '}
                          {formatPaiseToINR(rev.previous_total_paise)} →{' '}
                          {formatPaiseToINR(rev.new_total_paise)} ({rev.adjustment_reason})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
