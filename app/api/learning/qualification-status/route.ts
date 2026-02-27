import { NextRequest, NextResponse } from 'next/server';
import { LearningSystemManager, calculateQualificationProgress, getNextQualificationAction } from '@/lib/learningSystem';
import { QualificationStatus } from '@/lib/types/paper-trading';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const learningManager = new LearningSystemManager();
    const qualificationStatus = await learningManager.getQualificationProgress(userId);
    
    // Calculate progress and next action on server side
    const progress = calculateQualificationProgress(qualificationStatus);
    const nextAction = getNextQualificationAction(qualificationStatus);

    return NextResponse.json({
      success: true,
      qualificationStatus: {
        ...qualificationStatus,
        progress,
        nextAction
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching qualification status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch qualification status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}