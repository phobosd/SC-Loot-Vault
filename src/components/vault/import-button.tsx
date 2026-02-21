"use client";

import { useState } from "react";
import { 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ExternalLink,
  Table,
  ChevronRight,
  Database
} from "lucide-react";
import { previewGoogleSheet } from "@/app/actions/import-sheet";
import { addLootItems } from "@/app/actions/loot";
import { cn } from "@/lib/utils";

interface ImportButtonProps {
  orgId: string;
}

export function ImportButton({ orgId }: ImportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [gid, setGid] = useState("1808617689");
  const [status, setStatus] = useState<"idle" | "preview" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    
    try {
      const result = await previewGoogleSheet(url, gid);
      if (result.success) {
        setPreviewData(result.items || []);
        setStatus("preview");
      } else {
        setStatus("error");
        setMessage(result.error || "Preview failed");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    setLoading(true);
    try {
      const payload = previewData.map(item => ({
        ...item,
        orgId
      }));
      
      const result = await addLootItems(payload);
      if (result.success) {
        setStatus("success");
        setMessage(`Successfully committed ${result.count} items to vault.`);
        setTimeout(() => {
          setIsOpen(false);
          reset();
        }, 3000);
      } else {
        setStatus("error");
        setMessage(result.error || "Commit failed");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStatus("idle");
    setPreviewData([]);
    setMessage("");
    setUrl("");
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase transition-all rounded"
      >
        <FileSpreadsheet className="w-4 h-4 text-sc-blue" />
        Import Manifest
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className={cn(
            "sc-glass overflow-hidden border-sc-blue/30 shadow-2xl transition-all duration-500 flex flex-col max-h-[90vh]",
            status === "preview" ? "w-full max-w-5xl" : "w-full max-w-lg"
          )}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
              <div>
                <h2 className="text-lg font-bold text-sc-blue tracking-widest uppercase flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  {status === "preview" ? "Manifest Verification" : "Data Link Initialization"}
                </h2>
                <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">BRIDGE // CSV-TO-VAULT-PROTOCOL</p>
              </div>
              <button onClick={() => { setIsOpen(false); reset(); }} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {status === "preview" ? (
                <div className="p-6 space-y-6">
                  <div className="sc-hud-border p-4 bg-sc-blue/5 border-l-2 border-sc-blue/50 rounded-r">
                    <p className="text-[10px] font-bold text-sc-blue uppercase tracking-widest mb-1">Incoming Telemetry Detected</p>
                    <p className="text-xs text-gray-400 font-mono italic">Verify the parsed records below before committing to the persistent organization manifest.</p>
                  </div>

                  <div className="border border-white/10 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="px-4 py-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Designation</th>
                          <th className="px-4 py-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Category</th>
                          <th className="px-4 py-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">Qty</th>
                          <th className="px-4 py-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">Size</th>
                          <th className="px-4 py-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {previewData.map((item, i) => (
                          <tr key={i} className="hover:bg-sc-blue/[0.04] transition-colors">
                            <td className="px-4 py-2 text-[10px] text-white uppercase">{item.name}</td>
                            <td className="px-4 py-2 text-[10px] text-sc-blue/70 uppercase">{item.category}</td>
                            <td className="px-4 py-2 text-[10px] text-white text-center font-bold">{item.quantity}</td>
                            <td className="px-4 py-2 text-[10px] text-gray-500 text-center">{item.size || '—'}</td>
                            <td className="px-4 py-2 text-[10px] text-sc-gold/80 text-center">{item.grade || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePreview} className="p-6 space-y-6">
                  {status === "error" && (
                    <div className="p-3 bg-sc-red/10 border border-sc-red/30 text-sc-red text-[10px] font-mono uppercase">
                      Error: {message}
                    </div>
                  )}
                  {status === "success" && (
                    <div className="p-3 bg-sc-green/10 border border-sc-green/30 text-sc-green text-[10px] font-mono uppercase flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> {message}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Spreadsheet Source Link</label>
                      <input 
                        type="url" 
                        required
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..." 
                        className="w-full bg-black/60 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Worksheet Identification (GID)</label>
                      <input 
                        type="text" 
                        value={gid}
                        onChange={(e) => setGid(e.target.value)}
                        placeholder="1808617689" 
                        className="w-full bg-black/60 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                      />
                      <p className="text-[8px] text-gray-600 italic">The numeric ID found after 'gid=' in the worksheet URL.</p>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => { setIsOpen(false); reset(); }}
                      className="flex-1 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-colors rounded border border-white/10"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-[2] py-3 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest transition-all rounded disabled:opacity-30 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.1)]"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
                      Parse Telemetry
                    </button>
                  </div>
                </form>
              )}
            </div>

            {status === "preview" && (
              <div className="px-6 py-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase font-mono">Records Scanned</span>
                    <span className="text-lg font-bold text-white font-mono">{previewData.length}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setStatus("idle")}
                    className="px-6 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-colors rounded border border-white/10"
                  >
                    Back to Link
                  </button>
                  <button 
                    onClick={handleCommit}
                    disabled={loading}
                    className="px-8 py-3 bg-sc-green/20 hover:bg-sc-green/30 border border-sc-green/50 text-sc-green text-xs font-black uppercase tracking-widest transition-all rounded flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,194,0.1)]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    Confirm & Commit to Manifest
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
