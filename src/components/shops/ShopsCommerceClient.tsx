'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Pill,
  CheckCircle2,
  XCircle,
  Receipt,
  Eye,
  Clock,
} from 'lucide-react';
import type { OrderRecord, ProductItem, ShopItem } from '@/lib/types/domain';
import {
  placeShopOrderAction,
  respondOrderPriceChangeAction,
} from '@/app/actions/community-actions';
import { formatPaiseToINR } from '@/lib/workflows/transactions';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { DetailModal } from '@/components/ui/DetailModal';

interface ShopsCommerceClientProps {
  actorId: string;
  actorName: string;
  shops: ShopItem[];
  orders: OrderRecord[];
}

const PRODUCTS_PER_PAGE = 4;
const ORDERS_PER_PAGE = 3;

export function ShopsCommerceClient({
  actorId,
  shops,
  orders,
}: ShopsCommerceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [selectedShopId, setSelectedShopId] = useState<string>(shops[0]?.id ?? '');
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState<
    'pay_on_delivery' | 'direct_upi' | 'counter_pickup'
  >('pay_on_delivery');
  const [instructions, setInstructions] = useState('Leave at security desk if unavailable');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Detail Modal States
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  const activeShop = shops.find((s) => s.id === selectedShopId) ?? shops[0];
  const products = activeShop?.products ?? [];
  const pagedProducts = products.slice(
    (productPage - 1) * PRODUCTS_PER_PAGE,
    productPage * PRODUCTS_PER_PAGE
  );

  const pagedOrders = orders.slice(
    (orderPage - 1) * ORDERS_PER_PAGE,
    orderPage * ORDERS_PER_PAGE
  );

  function handleQuickOrder(product: ProductItem) {
    if (!activeShop) return;
    const idempotencyKey = `ord-${actorId.slice(-4)}-${product.id.slice(-4)}-${Date.now()}`;
    startTransition(async () => {
      const res = await placeShopOrderAction({
        shopId: activeShop.id,
        productId: product.id,
        quantity: 1,
        idempotencyKey,
        paymentMethod,
        instructions,
      });
      if (res.ok) {
        setFeedback(`Ordered 1 × ${product.name} from ${activeShop.name}.`);
        setSelectedProduct(null);
        setActiveTab('orders');
        router.refresh();
      } else {
        setFeedback(`Order error: ${res.error}`);
      }
    });
  }

  function handlePriceRevisionResponse(orderId: string, approve: boolean) {
    startTransition(async () => {
      const res = await respondOrderPriceChangeAction({ orderId, approve });
      if (res.ok) {
        setFeedback(
          approve
            ? 'Revised order total approved.'
            : 'Revised price declined and order cancelled.'
        );
        setSelectedOrder(null);
        router.refresh();
      } else {
        setFeedback(`Error: ${res.error}`);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Header & Module Tabs */}
      <div className="rounded-[16px] bg-white border border-[#E8E8EC] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] sm:text-[26px] font-display font-bold tracking-[-0.03em] text-[#0A0A0A]">
            Local Shops & Pharmacy
          </h1>
          <p className="text-[13px] text-[#6B6B6B]">
            Order groceries and medicines from verified neighbourhood stores. Click any item for details.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC]">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-[#10B981] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Store Catalogue</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#6366F1] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>My Orders & Invoices ({orders.length})</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] text-[#0A0A0A] flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-medium text-[#6B6B6B] hover:text-[#0A0A0A]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: STORE CATALOGUE */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Store Switcher Pills */}
          <div className="flex flex-wrap gap-2">
            {shops.map((shop) => {
              const selected = shop.id === activeShop?.id;
              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => {
                    setSelectedShopId(shop.id);
                    setProductPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] border text-[13px] font-medium transition cursor-pointer ${
                    selected
                      ? 'bg-[#10B981] text-white border-[#10B981] shadow-2xs'
                      : 'bg-white text-[#0A0A0A] border-[#E8E8EC] hover:border-[#10B981]'
                  }`}
                >
                  {shop.is_pharmacy_gated ? (
                    <Pill className="w-4 h-4" />
                  ) : (
                    <ShoppingBag className="w-4 h-4" />
                  )}
                  <span>{shop.name}</span>
                </button>
              );
            })}
          </div>

          {activeShop && (
            <div className="bg-white border border-[#E8E8EC] rounded-[16px] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E8E8EC]">
                <div>
                  <h2 className="text-[17px] font-display font-bold text-[#0A0A0A]">
                    {activeShop.name}
                  </h2>
                  <p className="text-[12px] text-[#6B6B6B]">
                    {activeShop.unit_location} • {activeShop.operating_hours}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#059669] text-[11px] font-medium capitalize">
                  {activeShop.category}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {pagedProducts.map((prod: ProductItem) => {
                  const outOfStock = !prod.is_active || prod.stock_quantity <= 0;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className={`p-4 rounded-[12px] border flex flex-col justify-between gap-3 transition cursor-pointer ${
                        outOfStock
                          ? 'bg-[#FAFAFA] border-[#E8E8EC] opacity-65'
                          : 'bg-[#FAFAFA] border-[#E8E8EC] hover:border-[#10B981]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#6B6B6B]">
                            {prod.pack_size} ({prod.unit_label})
                          </span>
                          {prod.requires_prescription && (
                            <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[10px] font-bold">
                              Rx Required
                            </span>
                          )}
                        </div>
                        <h3 className="font-display font-bold text-[15px] text-[#0A0A0A] line-clamp-1">
                          {prod.name}
                        </h3>
                        <div className="text-[15px] font-display font-bold text-[#10B981]">
                          {formatPaiseToINR(prod.price_paise)}
                        </div>
                      </div>

                      <div
                        className="pt-2.5 border-t border-[#E8E8EC] flex items-center justify-between"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(prod)}
                          className="text-[12px] font-medium text-[#6B6B6B] hover:text-[#0A0A0A] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>

                        {outOfStock ? (
                          <span className="text-[11px] font-semibold text-[#EF4444]">
                            Out of Stock
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleQuickOrder(prod)}
                            className="h-[32px] px-3 rounded-[8px] bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-medium cursor-pointer"
                          >
                            Order Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <PaginationBar
                currentPage={productPage}
                totalItems={products.length}
                pageSize={PRODUCTS_PER_PAGE}
                onPageChange={setProductPage}
                itemLabel="products"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ORDERS & INVOICES */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-[#E8E8EC] rounded-[16px] p-5 space-y-4">
          <div className="space-y-3">
            {pagedOrders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] flex flex-wrap items-center justify-between gap-4 transition cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#6366F1]">
                      {ord.invoice?.invoice_number ?? ord.id.slice(0, 8)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                        ord.status === 'awaiting_buyer_approval'
                          ? 'bg-[#F59E0B]/15 text-[#D97706]'
                          : 'bg-[#10B981]/15 text-[#059669]'
                      }`}
                    >
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[15px] text-[#0A0A0A]">
                    {ord.shop_name}
                  </h3>
                  <p className="text-[12px] text-[#6B6B6B]">
                    {ord.items.length} item(s) • Total:{' '}
                    <strong className="text-[#0A0A0A]">{formatPaiseToINR(ord.total_paise)}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrder(ord);
                  }}
                  className="h-[34px] px-3.5 rounded-[8px] bg-white border border-[#E8E8EC] hover:border-[#6366F1] text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>View Invoice</span>
                </button>
              </div>
            ))}
          </div>

          <PaginationBar
            currentPage={orderPage}
            totalItems={orders.length}
            pageSize={ORDERS_PER_PAGE}
            onPageChange={setOrderPage}
            itemLabel="orders"
          />
        </div>
      )}

      {/* MODAL 1: Product Detail & Checkout Options */}
      <DetailModal
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name ?? ''}
        subtitle={activeShop?.name}
        badge={
          selectedProduct && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#059669] text-[11px] font-medium">
              {selectedProduct.pack_size}
            </span>
          )
        }
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] text-[13px]">
              <div>
                <span className="text-[#6B6B6B] block text-xs">Unit Price</span>
                <strong className="text-[16px] text-[#10B981]">
                  {formatPaiseToINR(selectedProduct.price_paise)}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block text-xs">Stock Status</span>
                <strong className="text-[#0A0A0A]">
                  {selectedProduct.stock_quantity > 0
                    ? `${selectedProduct.stock_quantity} units available`
                    : 'Out of Stock'}
                </strong>
              </div>
            </div>

            {selectedProduct.requires_prescription && (
              <div className="p-3 rounded-[10px] bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[12px] text-[#D97706]">
                Requires valid doctor prescription verification before pharmacy dispatch.
              </div>
            )}

            <div className="space-y-2 text-[13px]">
              <div>
                <label className="block font-medium mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                  className="w-full rounded-[8px] border border-[#E8E8EC] px-3 py-2 bg-white"
                >
                  <option value="pay_on_delivery">Pay on Delivery</option>
                  <option value="direct_upi">Direct Merchant UPI</option>
                  <option value="counter_pickup">Counter Pickup</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Delivery Note</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full rounded-[8px] border border-[#E8E8EC] px-3 py-2"
                />
              </div>
            </div>

            {selectedProduct.stock_quantity > 0 && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleQuickOrder(selectedProduct)}
                className="w-full h-[40px] rounded-[8px] bg-[#10B981] text-white text-[13px] font-medium cursor-pointer"
              >
                {isPending ? 'Placing Order...' : 'Place Order Now'}
              </button>
            )}
          </div>
        )}
      </DetailModal>

      {/* MODAL 2: Order & Invoice Detail */}
      <DetailModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={
          selectedOrder
            ? `Invoice ${selectedOrder.invoice?.invoice_number ?? selectedOrder.id.slice(0, 8)}`
            : ''
        }
        subtitle={
          selectedOrder
            ? `${selectedOrder.shop_name} • Buyer: ${selectedOrder.buyer_name_snapshot}`
            : ''
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="space-y-2">
              {selectedOrder.items.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between text-[13px] border-b border-[#E8E8EC] pb-2"
                >
                  <div>
                    <div className="font-medium text-[#0A0A0A]">{line.product_name_snapshot}</div>
                    <div className="text-[11px] text-[#6B6B6B]">
                      {line.quantity} × {formatPaiseToINR(line.unit_price_paise_snapshot)}
                    </div>
                  </div>
                  <div className="font-mono font-bold">
                    {formatPaiseToINR(line.line_total_paise_snapshot)}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] text-[13px]">
              <div>
                <span className="text-[#6B6B6B] block text-xs">Order Total</span>
                <strong className="text-[16px] text-[#0A0A0A]">
                  {formatPaiseToINR(selectedOrder.total_paise)}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block text-xs">Status</span>
                <strong className="capitalize text-[#6366F1]">
                  {selectedOrder.status.replace(/_/g, ' ')}
                </strong>
              </div>
            </div>

            {selectedOrder.status === 'awaiting_buyer_approval' && (
              <div className="p-4 rounded-[12px] bg-[#F59E0B]/10 border border-[#F59E0B]/40 space-y-3">
                <div className="text-[13px] font-bold text-[#D97706] flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>
                    Revised Total:{' '}
                    {formatPaiseToINR(
                      selectedOrder.proposed_total_paise ?? selectedOrder.total_paise
                    )}
                  </span>
                </div>
                <p className="text-[12px] text-[#0A0A0A]">{selectedOrder.price_change_reason}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handlePriceRevisionResponse(selectedOrder.id, true)}
                    className="h-[36px] px-4 rounded-[8px] bg-[#10B981] text-white text-[12px] font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Revision</span>
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handlePriceRevisionResponse(selectedOrder.id, false)}
                    className="h-[36px] px-4 rounded-[8px] bg-[#EF4444] text-white text-[12px] font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Decline & Cancel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
