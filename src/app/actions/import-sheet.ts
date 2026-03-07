"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import axios from "axios";

import { requireAdmin, requireAuth, requireOrgAccess } from "@/lib/auth-checks";

export async function importGoogleSheet(orgId: string, sheetUrl: string, gid: string = "1808617689") {
  try {
    await requireAdmin();
    await requireOrgAccess(orgId);

    // ... rest of logic
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return { success: false, error: "Access Denied: The Google Sheet must be set to 'Anyone with the link can view'." };
    }
    console.error("Import error:", error);
    return { success: false, error: error.message };
  }
}

export async function previewGoogleSheet(sheetUrl: string, gid: string = "1808617689") {
  try {
    await requireAuth();
    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) throw new Error("Invalid Google Sheet URL");
    
    const spreadsheetId = sheetIdMatch[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    
    const response = await axios.get(csvUrl);
    const csvData = response.data;
    
    // Improved Heuristic: Find the first row that has a high density of non-empty columns
    const lines = csvData.split('\n');
    let headerRowIndex = 0;
    let maxFields = 0;

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      const fields = line.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);
      
      // If this row has significantly more populated columns than previous ones, it's likely the header
      if (fields.length > maxFields && fields.length > 3) {
        maxFields = fields.length;
        headerRowIndex = i;
      }
    }

    const cleanCsv = lines.slice(headerRowIndex).join('\n');

    const parsed = Papa.parse(cleanCsv, {
      header: true,
      skipEmptyLines: true,
    });
    
    return { 
      success: true, 
      data: parsed.data,
      headers: parsed.meta.fields || []
    };
    
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return { success: false, error: "Access Denied: Ensure the Google Sheet is shared as 'Anyone with the link can view'." };
    }
    return { success: false, error: error.message };
  }
}
