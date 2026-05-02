import { listOrders } from "@/lib/orders";
import { getTier } from "@/lib/pricing";
import { getGenre } from "@/lib/genres";
import AdminOrderList from "./AdminOrderList";

export const metadata = {
  title: "Admin · Orders",
  robots: "noindex, nofollow",
};

interface SearchParams {
  pw?: string;
}

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const required = process.env.ADMIN_PASSWORD;
  const provided = searchParams.pw;

  // Soft auth — require ADMIN_PASSWORD via ?pw= query string
  if (required && required !== "change-me" && provided !== required) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-md mx-auto card-deep rounded-2xl p-8 text-center">
          <h1 className="font-display text-2xl text-cream-100 mb-4">Restricted</h1>
          <p className="text-cream-200/60 text-sm mb-6">
            Add <code className="bg-ink-800 px-2 py-0.5 rounded">?pw=YOUR_PASSWORD</code> to the URL.
          </p>
          <p className="text-xs text-cream-200/40">
            Set <code className="text-gold-300">ADMIN_PASSWORD</code> in <code>.env.local</code> to a long random value.
          </p>
        </div>
      </div>
    );
  }

  const orders = await listOrders();

  // Stats
  const stats = {
    total: orders.length,
    pendingPayment: orders.filter((o) => o.status === "pending_payment").length,
    drafting: orders.filter((o) => o.status === "drafting" || o.status === "received").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenueCents: orders
      .filter((o) => o.status !== "pending_payment" && o.status !== "refunded")
      .reduce((sum, o) => sum + o.amountCents, 0),
  };

  // Enrich for display
  const enriched = orders.map((o) => ({
    ...o,
    tierName: getTier(o.tierId)?.name || o.tierId,
    genreName: getGenre(o.genreId)?.name || o.genreId,
  }));

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-2">
            SongSouls Admin
          </div>
          <h1 className="font-display text-4xl text-cream-100">Orders</h1>
        </header>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Stat label="Total orders" value={stats.total.toString()} />
          <Stat label="Awaiting payment" value={stats.pendingPayment.toString()} />
          <Stat label="In production" value={stats.drafting.toString()} />
          <Stat label="Revenue" value={`$${(stats.revenueCents / 100).toFixed(0)}`} />
        </div>

        <AdminOrderList orders={enriched} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-deep rounded-xl p-5">
      <div className="text-xs uppercase tracking-widest text-gold-400/70 mb-2">{label}</div>
      <div className="font-display text-3xl text-cream-100">{value}</div>
    </div>
  );
}
