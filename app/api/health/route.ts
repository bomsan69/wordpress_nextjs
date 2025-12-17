import { NextResponse } from 'next/server';

/**
 * Health Check API
 *
 * CI/CD 파이프라인에서 배포 후 애플리케이션 상태를 확인하는 엔드포인트입니다.
 *
 * @returns {Object} 애플리케이션 상태 정보
 */
export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
      service: 'ksenior',
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
