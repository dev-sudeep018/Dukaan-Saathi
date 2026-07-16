import { X, MessageCircle } from "lucide-react";

export default function AutoPayReminderModal({ customer, shopName, money, onClose }) {
  const pendingAmount = customer.outstanding || customer.total_outstanding || 0;
  const amountStr = money ? money(pendingAmount) : `₹${pendingAmount}`;
  const sName = shopName || "our shop";
  
  let upiLink = "";
  if (customer.upi_id) {
    upiLink = `upi://pay?pa=${customer.upi_id.trim()}&pn=${encodeURIComponent(sName)}&am=${pendingAmount}`;
  }

  const generatedMessage = `Hello ${customer.name},

This is a friendly reminder from ${sName}.

Your pending Udhaar balance is ${amountStr}.
Due Date: Immediately

${upiLink ? `Please complete your payment using this UPI link:\n${upiLink}\n\n` : `Please complete your payment using UPI.\n\n`}Thank you for shopping with us.`;

  let waUrl = `https://wa.me/`;
  if (customer.phone) {
    const phoneNum = customer.phone.replace(/[^\d]/g, '');
    if (phoneNum) {
      // If it doesn't have country code (e.g., length 10 for India), prepend 91 as default.
      // But standard normalizePhone might not have added 91 if it was just a local number.
      // We'll just pass whatever digits we have. wa.me is smart enough or the user will figure it out.
      waUrl = `https://wa.me/${phoneNum.length === 10 ? '91' + phoneNum : phoneNum}`;
    }
  }
  waUrl += `?text=${encodeURIComponent(generatedMessage)}`;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-shopfront">Payment Reminder</h3>
            <span className="text-xs text-ink/40">Auto-generated message</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-ink/40 hover:text-ink rounded-full bg-paper p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl bg-paper p-4 border border-black/5 whitespace-pre-wrap text-sm text-ink/80 leading-relaxed font-medium">
          {generatedMessage}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {upiLink && (
            <a
              href={upiLink}
              className="w-full inline-flex items-center justify-center rounded-full bg-marigold py-2.5 text-sm font-semibold text-shopfront hover:bg-marigold/90 transition-colors"
            >
              Pay Now
            </a>
          )}
          
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-semibold text-white hover:bg-[#128C7E] transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> Send via WhatsApp
          </a>

          <button
            onClick={onClose}
            className="w-full rounded-full bg-paper py-2.5 text-sm font-semibold text-shopfront ring-1 ring-black/10 hover:bg-black/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
