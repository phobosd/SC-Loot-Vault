import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileExt = path.extname(file.name);
    const fileName = `logo-${session.user.orgId}${fileExt}`;
    const uploadPath = path.join(process.cwd(), "public/uploads/logos", fileName);

    await writeFile(uploadPath, buffer);
    
    // Use the dynamic proxy URL instead of a static path
    const logoUrl = `/api/assets/logo?oid=${session.user.orgId}&v=${Date.now()}`;

    // Update the Org record
    await prisma.org.update({
      where: { id: session.user.orgId },
      data: { logoUrl }
    });

    return NextResponse.json({ success: true, logoUrl });
  } catch (error: any) {
    console.error("[UPLOAD_ERROR]", error);
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
  }
}
