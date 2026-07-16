import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { History, Send, AlertTriangle, Check, Clock, Filter, RefreshCw, MessageSquare, PhoneCall, Calendar } from "lucide-react";
import { api } from "../lib/api";

function statusBadge(status, isOverdue) {
  if (isOverdue)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-terracotta/10 text-terracotta">
        <AlertTriangle className="h-2.5 w-2.5" /> Overdue
      </span>
    );
  if (status === "sent")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-leaf/10 text-leaf">
        <Check className="h-2.5 w-2.5" /> Sent
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-marigold/10 text-amber-700">
      <Clock className="h-2.5 w-2.5" /> Pending
    </span>
  );
}

function triggerLabel(trigger_type) {
  if (!trigger_type) return "Manual";
  if (trigger_type === "3_days_before") return "3 Days Before Due";
  if (trigger_type === "on_due_date") return "On Due Date";
  if (trigger_type.startsWith("7_days_after_")) {
    const days = trigger_type.replace("7_days_after_", "");
    return `${days} Days Overdue`;
  }
  return trigger_type.replace(/_/g, " ");
}

function channelBadge(sent_via) {
  if (sent_via === "whatsapp")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/10 text-[#128C7E]">
        <MessageSquare className="h-2.5 w-2.5" /> WhatsApp
      </span>
    );
  if (sent_via === "sms")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-shopfront/10 text-shopfront">
        <PhoneCall className="h-2.5 w-2.5" /> SMS
      </span>
    );
  if (sent_via === "scheduled")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-marigold/10 text-amber-700">
        <Calendar className="h-2.5 w-2.5" /> Scheduled
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-paper text-ink/50">
      {(sent_via || "").toUpperCase()}
    </span>
  );
}

export default function ReminderHistoryPage() {
  const { money } = useOutletContext();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | sent | overdue
  const [search, setSearch] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getReminderHistory();
      setHistory(res.history || []);
    } catch (err) {
      setError(err.message || "Failed to load reminder history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filtered = useMemo(() => {
    return history.filter((log) => {
      const isOverdue =
        log.status === "pending" &&
        log.customer_due_date &&
        new Date(log.customer_due_date) < today;

      const matchFilter =
        filter === "all" ||
        (filter === "pending" && log.status === "pending" && !isOverdue) ||
        (filter === "sent" && log.status === "sent") ||
        (filter === "overdue" && isOverdue);

      const matchSearch =
        !search.trim() ||
        (log.customer_name || "").toLowerCase().includes(search.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [history, filter, search, today]);

  const stats = useMemo(() => {
    let pending = 0, sent = 0, overdue = 0;
    history.forEach((log) => {
      const isOverdue =
        log.status === "pending" &&
        log.customer_due_date &&
        new Date(log.customer_due_date) < today;
      if (isOverdue) overdue++;
      else if (log.status === "pending") pending++;
      else sent++;
    });
    return { pending, sent, overdue, total: history.length };
  }, [history, today]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-shopfront flex items-center gap-2">
            <History className="h-6 w-6 text-marigold" />
            Reminder History
          </h1>
          <p className="text-xs text-ink/50 mt-0.5">
            All payment reminders sent to customers — manual and auto-scheduled
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="inline-flex items-center gap-1.5 rounded-full bg-paper px-4 py-2 text-xs font-semibold text-ink/75 ring-1 ring-black/5 hover:bg-paper-deep transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Reminders", value: stats.total, color: "text-shopfront", bg: "bg-shopfront/5" },
          { label: "Pending", value: stats.pending, color: "text-amber-700", bg: "bg-marigold/10" },
          { label: "Sent", value: stats.sent, color: "text-leaf", bg: "bg-leaf/10" },
          { label: "Overdue", value: stats.overdue, color: "text-terracotta", bg: "bg-terracotta/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl ${s.bg} p-4 ring-1 ring-black/5 shadow-sm`}>
            <span className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold block">{s.label}</span>
            <span className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/50 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "sent", label: "Sent" },
            { key: "overdue", label: "Overdue" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === key
                  ? "bg-shopfront text-white shadow-sm"
                  : "bg-paper text-ink/60 hover:bg-black/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 sm:max-w-xs ml-auto">
          <input
            type="text"
            placeholder="Search by customer name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-paper px-3 py-1.5 text-sm outline-none focus:border-marigold transition-all"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl bg-terracotta/10 p-4 text-sm text-terracotta">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-ink/40 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-marigold" />
            Loading reminder history…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Send className="h-10 w-10 text-ink/20 mx-auto" />
            <p className="text-ink/40 text-sm font-medium">No reminders match the current filter.</p>
            <p className="text-ink/30 text-xs">
              {history.length === 0
                ? "Reminders appear here once you send them from the Udhaar page."
                : "Try selecting a different filter above."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-black/5 bg-paper text-xs text-ink/50 uppercase font-semibold tracking-wide">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-3 text-right">Pending Amount</th>
                  <th className="py-3 px-3">Reminder Date</th>
                  <th className="py-3 px-3">Reminder Type</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const isOverdue =
                    log.status === "pending" &&
                    log.customer_due_date &&
                    new Date(log.customer_due_date) < today;
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-black/5 hover:bg-black/[0.01] transition-colors ${
                        isOverdue ? "bg-terracotta/[0.02]" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold capitalize text-shopfront">
                          {log.customer_name || "—"}
                        </span>
                        {log.customer_phone && (
                          <span className="block text-[10px] font-mono text-ink/40 mt-0.5">
                            {log.customer_phone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-terracotta whitespace-nowrap">
                        {money ? money(log.amount) : `₹${log.amount}`}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-ink/60 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-3 px-3 text-xs text-ink/70">
                        {triggerLabel(log.trigger_type)}
                      </td>
                      <td className="py-3 px-3">{channelBadge(log.sent_via)}</td>
                      <td className="py-3 px-4">{statusBadge(log.status, isOverdue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-black/5 text-xs text-ink/40 bg-paper">
            Showing {filtered.length} of {history.length} reminders
          </div>
        )}
      </div>
    </div>
  );
}
