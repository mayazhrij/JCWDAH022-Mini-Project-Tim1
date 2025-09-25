import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	return NextResponse.next();
}

// See "Matching Paths" to learn more
export const config = {
	matcher: [],
};
