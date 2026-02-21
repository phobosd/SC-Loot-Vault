"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import axios from "axios";

export async function importGoogleSheet(orgId: string, sheetUrl: string, gid: string = "1808617689") {
  try {
    // Extract Spreadsheet ID from URL
    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) throw new Error("Invalid Google Sheet URL");
    
    const spreadsheetId = sheetIdMatch[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    
    console.log(`Fetching CSV from: ${csvUrl}`);
    const response = await axios.get(csvUrl);
    const csvData = response.data;
    
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });
    
    console.log(`Parsed ${parsed.data.length} rows`);
    
    const results = [];
    
    for (const row of (parsed.data as any[])) {
      // Mapping based on the observed headers
      const itemName = row["Part Name"];
      if (!itemName) continue;
      
      const item = await prisma.lootItem.create({
        data: {
          orgId: orgId,
          name: itemName,
          category: row["Item Type"] || "Unknown",
          subCategory: row["Comp. Type"] || null,
          quantity: parseInt(row["Qty"]) || 1,
          size: row["Size"] || null,
          grade: row["Grade"] || null,
          class: row["Class"] || null,
          source: "Google Sheet Import",
        }
      });
      results.push(item);
    }
    
    revalidatePath("/vault");
    return { success: true, count: results.length };
    
  } catch (error: any) {
    console.error("Import error:", error);
    return { success: false, error: error.message };
  }
}

export async function previewGoogleSheet(sheetUrl: string, gid: string = "1808617689") {
  try {
    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) throw new Error("Invalid Google Sheet URL");
    
    const spreadsheetId = sheetIdMatch[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    
    const response = await axios.get(csvUrl);
    const csvData = response.data;
    
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });
    
    const previewItems = (parsed.data as any[]).map(row => ({
      name: row["Part Name"] || "",
      category: row["Item Type"] || "Unknown",
      subCategory: row["Comp. Type"] || null,
      quantity: parseInt(row["Qty"]) || 1,
      size: row["Size"] || null,
      grade: row["Grade"] || null,
      class: row["Class"] || null,
      manufacturer: row["Manufacturer"] || null, // Optional, let's try to get it
    })).filter(item => item.name.trim() !== "");
    
    return { success: true, items: previewItems };
    
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
