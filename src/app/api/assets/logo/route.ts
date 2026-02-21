import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { existsSync } from "fs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oid = searchParams.get("oid");

  if (!oid) return new NextResponse("Missing organization ID", { status: 400 });

  const extensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
  let foundPath = "";
  let contentType = "image/png";

  for (const ext of extensions) {
    const testPath = path.join(process.cwd(), "public/uploads/logos", `logo-${oid}${ext}`);
    if (existsSync(testPath)) {
      foundPath = testPath;
      contentType = ext === ".svg" ? "image/svg+xml" : `image/${ext.replace(".", "")}`;
      break;
    }
  }

  if (!foundPath) {
    return new NextResponse("Logo not found", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(foundPath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    });
  } catch (error) {
    return new NextResponse("Error reading file", { status: 500 });
  }
}
