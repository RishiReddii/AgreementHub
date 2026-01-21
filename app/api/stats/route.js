import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { CONTRACT_STATES } from '@/lib/lifecycle';

// GET /api/stats - Get dashboard statistics
export async function GET() {
  try {
    const contracts = await getCollection('contracts');
    const blueprints = await getCollection('blueprints');

    const [contractStats, blueprintCount] = await Promise.all([
      contracts.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray(),
      blueprints.countDocuments({})
    ]);

    // Convert to object
    const statsByStatus = {};
    Object.values(CONTRACT_STATES).forEach(status => {
      statsByStatus[status] = 0;
    });
    contractStats.forEach(stat => {
      statsByStatus[stat._id] = stat.count;
    });

    const totalContracts = Object.values(statsByStatus).reduce((a, b) => a + b, 0);

    // Calculate category counts
    const categories = {
      active: statsByStatus[CONTRACT_STATES.SENT] || 0,
      pending: (statsByStatus[CONTRACT_STATES.CREATED] || 0) + (statsByStatus[CONTRACT_STATES.APPROVED] || 0),
      signed: (statsByStatus[CONTRACT_STATES.SIGNED] || 0) + (statsByStatus[CONTRACT_STATES.LOCKED] || 0),
      revoked: statsByStatus[CONTRACT_STATES.REVOKED] || 0
    };

    return NextResponse.json({
      totalContracts,
      totalBlueprints: blueprintCount,
      byStatus: statsByStatus,
      byCategory: categories
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
