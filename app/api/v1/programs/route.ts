import { ProgramService } from '@/lib/services/program.service';
import { CreateProgramSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const programs = await ProgramService.getAllPrograms();
    return NextResponse.json(
      { data: programs },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ccht] Get programs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = CreateProgramSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // TODO: Check if user is admin
    // const { user } = await supabase.auth.getUser();
    // if user is not admin, return 403

    const program = await ProgramService.createProgram(validationResult.data);
    return NextResponse.json(
      { data: program },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ccht] Create program error:', error);
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    );
  }
}
