import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUserSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate with Zod
    const validatedData = createUserSchema.parse({
      ...body,
      role: "MEMBER", // Enforce MEMBER role for public signups
    });

    const existing = await prisma.user.findUnique({
      where: { username: validatedData.username || "" }
    });

    if (existing) {
      return NextResponse.json({ error: "Designation already registered in network." }, { status: 400 });
    }

    const hashedPassword = validatedData.password ? await bcrypt.hash(validatedData.password, 10) : null;

    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        password: hashedPassword,
        name: validatedData.name,
        orgId: validatedData.orgId,
        role: "MEMBER",
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid telemetry fields: " + error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
