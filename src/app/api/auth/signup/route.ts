import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password, name, orgId } = await req.json();

    if (!username || !password || !name || !orgId) {
      return NextResponse.json({ error: "Missing required telemetry fields." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return NextResponse.json({ error: "Designation already registered in network." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        orgId,
        role: "MEMBER", // Default role for new signups
        status: "PENDING" // Requires admin approval
      }
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
