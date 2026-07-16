import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { User, LogOut, Save, Globe, Store, Phone, Mail, MapPin, Image as ImageIcon, Briefcase, AlertTriangle } from "lucide-react";
import { Card } from "./DashboardPage";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";

export default function SettingsPage() {
  const { t, load } = useOutletContext();
  const { shop, logout, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    shop_name: "",
    owner_name: "",
    mobile_number: "",
    email: "",
    shop_address: "",
    shop_logo: "",
    business_category: "",
    lang: "en",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [confirmResetText, setConfirmResetText] = useState("");

  const handleResetAllData = async () => {
    setBusy("reset");
    setError("");
    try {
      await api.resetData();
      toast.success("Your shop data has been reset successfully.");
      setShowConfirmReset(false);
      setConfirmResetText("");
      await load();
      navigate("/app/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to reset shop data");
    } finally {
      setBusy(false);
    }
  };

  // Initialize form with current shop data
  useEffect(() => {
    if (shop) {
      setForm({
        shop_name: shop.shop_name || shop.name || "",
        owner_name: shop.owner_name || "",
        mobile_number: shop.mobile_number || shop.whatsapp_number || "",
        email: shop.email || "",
        shop_address: shop.shop_address || "",
        shop_logo: shop.shop_logo || "",
        business_category: shop.business_category || "",
        lang: shop.lang_pref || "en"
      });
    }
  }, [shop]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    try {
      const res = await api.updateProfile(form);
      login(res.token, res.shop); // Update local context and localStorage
      setSuccess("Profile updated successfully!");
      // Automatically clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-shopfront">Settings</h1>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Profile Settings */}
        <Card title="Shop Profile" icon={User}>
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1 flex items-center gap-1.5">
                <Store className="h-4 w-4" /> Shop Name
              </label>
              <input
                className="w-full rounded-xl border border-black/15 bg-paper px-4 py-2.5 text-sm text-shopfront outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                value={form.shop_name}
                onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                placeholder="My Awesome Shop"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1 flex items-center gap-1.5">
                <User className="h-4 w-4" /> Owner Name
              </label>
              <input
                className="w-full rounded-xl border border-black/15 bg-paper px-4 py-2.5 text-sm text-shopfront outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                placeholder="Owner name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1 flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> Mobile Number
              </label>
              <input
                className="w-full rounded-xl border border-black/15 bg-paper px-4 py-2.5 text-sm text-shopfront outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                value={form.mobile_number}
                onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
                placeholder="+91XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1 flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> Email
              </label>
              <input
                className="w-full rounded-xl border border-black/15 bg-paper px-4 py-2.5 text-sm text-shopfront outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="owner@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Shop Address
              </label>
              <input
                className="w-full rounded-xl border border-black/15 bg-paper px-4 py-2.5 text-sm text-shopfront outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                value={form.shop_address}
                onChange={(e) => setForm({ ...form, shop_address: e.target.value })}
                placeholder="City, Area, Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" /> Shop Logo URL
              </label>
              <input
                className="w-full rounded-xl border border-black/15 bg-paper px-4 py-2.5 text-sm text-shopfront outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                value={form.shop_logo}
                onChange={(e) => setForm({ ...form, shop_logo: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" /> Business Category
              </label>
              <input
                className="w-full rounded-xl border border-black/15 bg-paper px-4 py-2.5 text-sm text-shopfront outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                value={form.business_category}
                onChange={(e) => setForm({ ...form, business_category: e.target.value })}
                placeholder="Grocery, Pharmacy, Bakery..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1 flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> Language Preference
              </label>
              <select
                className="w-full rounded-xl border border-black/15 bg-paper px-4 py-2.5 text-sm text-shopfront outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                value={form.lang}
                onChange={(e) => setForm({ ...form, lang: e.target.value })}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </div>

            {error && <p className="text-sm text-terracotta bg-terracotta/10 px-3 py-2 rounded-lg">{error}</p>}
            {success && <p className="text-sm text-leaf bg-leaf/10 px-3 py-2 rounded-lg">{success}</p>}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-shopfront px-5 py-2.5 text-sm font-semibold text-paper shadow-sm hover:-translate-y-0.5 transition-transform disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {busy ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </Card>

        {/* Appearance Settings */}
        <Card title="Appearance" icon={User}>
          <div className="max-w-md">
            <p className="font-medium text-shopfront">Light Mode</p>
            <p className="text-sm text-ink/60">The app is kept in light mode by default for a clean, consistent experience.</p>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card title="Account Actions" icon={LogOut}>
          <p className="text-sm text-ink/60 mb-4 max-w-md">
            Log out of Dukaan Saathi on this device. You can log back in at any time using your phone number and PIN.
          </p>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to log out?")) {
                logout();
                navigate("/login");
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/5 px-5 py-2.5 text-sm font-semibold text-terracotta hover:bg-terracotta hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </Card>

        {/* Danger Zone */}
        <Card title="⚠ Danger Zone" icon={AlertTriangle}>
          <div className="max-w-md space-y-4">
            <p className="text-sm text-ink/60">
              Resetting your shop data will permanently delete all business records associated with your account.
            </p>
            <p className="text-sm text-terracotta font-semibold">
              This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/5 px-5 py-2.5 text-sm font-semibold text-terracotta hover:bg-terracotta hover:text-white transition-colors"
            >
              Reset All Shop Data
            </button>
          </div>
        </Card>
      </div>

      {showConfirmReset && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => {
            setShowConfirmReset(false);
            setConfirmResetText("");
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-shopfront mb-2">Reset All Shop Data?</h3>
            <p className="text-sm text-ink/75 mb-3">This action will permanently delete:</p>
            <ul className="text-sm text-ink/60 list-disc list-inside space-y-1 mb-4">
              <li>Sales</li>
              <li>Customers</li>
              <li>Inventory</li>
              <li>Udhaar Records</li>
              <li>Reports</li>
              <li>Notifications</li>
              <li>Dashboard Statistics</li>
            </ul>
            <p className="text-sm text-terracotta font-semibold mb-4">This action cannot be undone.</p>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-ink/60 mb-1.5">
                Type <span className="font-bold text-terracotta select-all">RESET</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmResetText}
                onChange={(e) => setConfirmResetText(e.target.value)}
                placeholder="RESET"
                className="w-full rounded-xl border border-black/15 bg-paper px-4 py-2 text-sm text-shopfront outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={busy === "reset"}
                onClick={() => {
                  setShowConfirmReset(false);
                  setConfirmResetText("");
                }}
                className="rounded-full bg-paper px-5 py-2 text-sm font-semibold text-ink/70 hover:bg-paper-deep transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmResetText !== "RESET" || busy === "reset"}
                onClick={handleResetAllData}
                className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white hover:bg-terracotta/90 transition-colors disabled:opacity-50"
              >
                {busy === "reset" ? "Resetting…" : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
