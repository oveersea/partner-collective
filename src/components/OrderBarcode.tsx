import Barcode from "react-barcode";
import { Ticket, CheckCircle2, QrCode } from "lucide-react";

interface OrderBarcodeProps {
  orderNumber: string;
  title: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
  compact?: boolean;
}

const OrderBarcode = ({ orderNumber, title, checkedIn, checkedInAt, compact }: OrderBarcodeProps) => {
  return (
    <div className={`rounded-2xl border border-border bg-card overflow-hidden ${compact ? "" : "shadow-card"}`}>
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">E-Ticket</span>
        </div>
        {checkedIn ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Checked-in
          </span>
        ) : (
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

      {/* Barcode */}
      <div className="flex flex-col items-center px-4 py-4 gap-3">
        <p className="text-xs text-muted-foreground text-center line-clamp-1">{title}</p>
        <div className="bg-background rounded-xl p-3 border border-border">
          <Barcode
            value={orderNumber}
            format="CODE128"
            width={1.8}
            height={compact ? 50 : 64}
            displayValue={true}
            fontSize={11}
            font="monospace"
            textMargin={4}
            margin={4}
            background="transparent"
          />
        </div>
        {checkedIn && checkedInAt && (
          <p className="text-[10px] text-muted-foreground">
            Check-in: {new Date(checkedInAt).toLocaleString("id-ID")}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground text-center">
          Tunjukkan barcode ini saat check-in di lokasi event/program
        </p>
      </div>
    </div>
  );
};

export default OrderBarcode;
