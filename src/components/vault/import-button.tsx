"use client";

import { useState } from "react";
import { 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle, 
  X, 
  Table,
  Database,
  Info,
  Settings2,
  ArrowRight,
  Upload,
  Link as LinkIcon
} from "lucide-react";
import { previewGoogleSheet } from "@/app/actions/import-sheet";
import { addLootItems } from "@/app/actions/loot";
import { cn } from "@/lib/utils";
import Papa from "papaparse";

interface ImportButtonProps {
  orgId: string;
}

// Platform Schema Standards
const REQUIRED_FIELDS = [
  { key: "name", labels: ["Part Name", "Item", "Designation", "Name", "Item Name"] },
  { key: "category", labels: ["Item Type", "Type", "Category", "Classification", "Item Class"] },
  { key: "quantity", labels: ["Qty", "Quantity", "Count", "Amount", "QTY"] },
];

const OPTIONAL_FIELDS = [
  { key: "subCategory", labels: ["Comp. Type", "Sub Type", "SubCategory", "Item Sub Class"] },
  { key: "size", labels: ["Size", "S", "Item Size"] },
  { key: "grade", labels: ["Grade", "G", "Item Grade"] },
  { key: "class", labels: ["Class", "C", "Item Class"] },
  { key: "manufacturer", labels: ["Manufacturer", "Maker", "Brand"] },
];

export function ImportButton({ orgId }: ImportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importMethod, setImportMethod] = useState<"LINK" | "UPLOAD">("LINK");
  const [url, setUrl] = useState("");
  const [gid, setGid] = useState("");
  const [status, setStatus] = useState<"idle" | "mapping" | "preview" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    // Auto-extract GID if present
    const gidMatch = newUrl.match(/gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      setGid(gidMatch[1]);
    } else if (!gid) {
      setGid("0"); // Default to first sheet
    }
  };
  
  // Data States
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewItems, setPreviewItems] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processRawData(results.meta.fields || [], results.data);
        setLoading(false);
      },
      error: (err) => {
        setStatus("error");
        setMessage("CSV Parsing Error: " + err.message);
        setLoading(false);
      }
    });
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    
    try {
      const result = await previewGoogleSheet(url, gid);
      if (result.success) {
        processRawData(result.headers || [], result.data || []);
      } else {
        setStatus("error");
        setMessage(result.error || "Link failure: Check Spreadsheet permissions.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const processRawData = (headers: string[], data: any[]) => {
    setRawHeaders(headers);
    setRawData(data);
    
    const initialMapping: Record<string, string> = {};
    const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
    
    allFields.forEach(field => {
      const match = headers.find(h => 
        field.labels.some(l => h.toLowerCase().trim() === l.toLowerCase().trim())
      );
      if (match) initialMapping[field.key] = match;
    });

    setColumnMapping(initialMapping);
    setStatus("mapping");
  };

  const generatePreview = () => {
    const items = rawData.map(row => {
      const item: any = {};
      Object.entries(columnMapping).forEach(([schemaKey, csvHeader]) => {
        item[schemaKey] = row[csvHeader];
      });
      item.quantity = parseInt(item.quantity) || 1;
      return item;
    }).filter(i => i.name && i.name.trim() !== "");

    setPreviewItems(items);
    setStatus("preview");
  };

  const handleCommit = async () => {
    setLoading(true);
    try {
      const payload = previewItems.map(item => ({
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
    setRawData([]);
    setPreviewItems([]);
    setColumnMapping({});
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
            (status === "preview" || status === "mapping") ? "w-full max-w-5xl" : "w-full max-w-lg"
          )}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
              <div>
                <h2 className="text-lg font-bold text-sc-blue tracking-widest uppercase flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  {status === "idle" && "Bridge Initialization"}
                  {status === "mapping" && "Protocol Mapping"}
                  {status === "preview" && "Manifest Verification"}
                </h2>
                <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">BRIDGE // CSV-TO-VAULT-PROTOCOL</p>
              </div>
              <button onClick={() => { setIsOpen(false); reset(); }} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {(status === "error" || status === "success") && (
                <div className="p-6 pb-0">
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
                </div>
              )}

              {status === "idle" && (
                <div className="flex flex-col h-full">
                  <div className="p-6 bg-sc-blue/[0.02] border-b border-white/5">
                    <h3 className="text-xs font-black text-sc-blue uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4" /> Standard Manifest Schema
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter">Primary Columns:</p>
                        <div className="flex flex-wrap gap-1">
                          {["Part Name", "Item Type", "Qty", "Comp. Type"].map(c => (
                            <span key={c} className="text-[8px] bg-sc-blue/10 border border-sc-blue/20 text-sc-blue px-1.5 py-0.5 rounded uppercase font-bold">{c}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter">Optional:</p>
                        <div className="flex flex-wrap gap-1">
                          {["Size", "Grade", "Class", "Manufacturer"].map(c => (
                            <span key={c} className="text-[8px] bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded uppercase font-bold">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="flex bg-black/40 border border-white/10 rounded p-1">
                      <button 
                        onClick={() => setImportMethod("LINK")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase transition-all rounded",
                          importMethod === "LINK" ? "bg-sc-blue text-black" : "text-gray-500 hover:text-white"
                        )}
                      >
                        <LinkIcon className="w-3 h-3" /> Google Sheet Link
                      </button>
                      <button 
                        onClick={() => setImportMethod("UPLOAD")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase transition-all rounded",
                          importMethod === "UPLOAD" ? "bg-sc-blue text-black" : "text-gray-500 hover:text-white"
                        )}
                      >
                        <Upload className="w-3 h-3" /> Local CSV Upload
                      </button>
                    </div>

                    {importMethod === "LINK" ? (
                      <form onSubmit={handlePreview} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Spreadsheet Source Link</label>
                          <input 
                            type="url" 
                            required
                            value={url}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..." 
                            className="w-full bg-black/60 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                          />
                          <p className="text-[8px] text-gray-600 italic">Note: Sheet must be shared as 'Anyone with link can view'.</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Worksheet GID</label>
                          <input 
                            type="text" 
                            value={gid}
                            onChange={(e) => setGid(e.target.value)}
                            placeholder="1808617689" 
                            className="w-full bg-black/60 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
                          Initialize Link
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-sc-blue/20 rounded-lg p-10 flex flex-col items-center justify-center gap-4 hover:border-sc-blue/40 transition-all group">
                          <input 
                            type="file" 
                            id="csv-upload" 
                            accept=".csv" 
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <label 
                            htmlFor="csv-upload"
                            className="flex flex-col items-center cursor-pointer"
                          >
                            <Upload className="w-10 h-10 text-sc-blue/40 group-hover:text-sc-blue transition-colors mb-2" />
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Select Local Manifest</span>
                            <span className="text-[9px] text-gray-500 font-mono mt-1">UPLOAD .CSV FILE DIRECTLY</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {status === "mapping" && (
                <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="sc-hud-border p-4 bg-sc-blue/5 border-l-2 border-sc-blue/50">
                    <p className="text-[10px] font-bold text-sc-blue uppercase tracking-widest mb-1">Mapping Protocol Active</p>
                    <p className="text-xs text-gray-400 font-mono">Align spreadsheet columns to the Vault manifest schema.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] border-b border-white/10 pb-2">Core Fields</h4>
                      {REQUIRED_FIELDS.map(field => (
                        <div key={field.key} className="space-y-2">
                          <label className="text-[9px] font-mono text-sc-blue/60 uppercase">{field.key}</label>
                          <select 
                            value={columnMapping[field.key] || ""}
                            onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className="w-full bg-black/60 border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-sc-blue/50 outline-none uppercase"
                          >
                            <option value="">-- UNMAPPED --</option>
                            {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/10 pb-2">Metadata</h4>
                      {OPTIONAL_FIELDS.map(field => (
                        <div key={field.key} className="space-y-2">
                          <label className="text-[9px] font-mono text-gray-600 uppercase">{field.key}</label>
                          <select 
                            value={columnMapping[field.key] || ""}
                            onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className="w-full bg-black/60 border border-white/10 px-3 py-2 text-xs font-mono text-gray-400 focus:border-sc-blue/50 outline-none uppercase"
                          >
                            <option value="">-- IGNORE --</option>
                            {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                    <button 
                      onClick={() => setStatus("idle")}
                      className="px-6 py-3 text-xs font-bold text-white uppercase border border-white/10 hover:bg-white/5 transition-all rounded"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={generatePreview}
                      disabled={!columnMapping.name || !columnMapping.category || !columnMapping.quantity}
                      className="px-10 py-3 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest transition-all rounded disabled:opacity-30 flex items-center gap-2"
                    >
                      Analyze Records <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {status === "preview" && (
                <div className="p-6 space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="sc-hud-border p-4 bg-sc-green/5 border-l-2 border-sc-green/50">
                    <p className="text-[10px] font-bold text-sc-green uppercase tracking-widest mb-1">Manifest Preview</p>
                    <p className="text-xs text-gray-400 font-mono italic">Check records. If misaligned, return to mapping.</p>
                  </div>

                  <div className="border border-white/10 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                          <th className="px-4 py-3">Designation</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3 text-center">Qty</th>
                          <th className="px-4 py-3 text-center">Manufacturer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                        {previewItems.map((item, i) => (
                          <tr key={i} className="hover:bg-sc-blue/[0.04] transition-colors">
                            <td className="px-4 py-2 text-white uppercase">{item.name}</td>
                            <td className="px-4 py-2 text-sc-blue/70 uppercase">{item.category}</td>
                            <td className="px-4 py-2 text-white text-center font-bold">{item.quantity}</td>
                            <td className="px-4 py-2 text-gray-500 text-center uppercase">{item.manufacturer || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {status === "preview" && (
              <div className="px-6 py-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase font-mono">Records Scanned</span>
                  <span className="text-lg font-bold text-white font-mono">{previewItems.length}</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setStatus("mapping")}
                    className="px-6 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-colors rounded border border-white/10 flex items-center gap-2"
                  >
                    <Settings2 className="w-4 h-4" /> Re-Map
                  </button>
                  <button 
                    onClick={handleCommit}
                    disabled={loading}
                    className="px-8 py-3 bg-sc-green/20 hover:bg-sc-green/30 border border-sc-green/50 text-sc-green text-xs font-black uppercase tracking-widest transition-all rounded flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,194,0.1)]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    Confirm & Commit
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
