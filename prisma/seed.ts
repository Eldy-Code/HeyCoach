import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🏒 Seeding HeyCoach database...')

  // Create demo admin
  const hashedPassword = await bcrypt.hash('heycoach123', 12)
  const coach = await prisma.user.upsert({
    where: { email: 'coach@juniorrailers.com' },
    update: { role: 'admin' },
    create: {
      name: 'Coach Demo',
      email: 'coach@juniorrailers.com',
      password: hashedPassword,
      teamName: 'Worcester Rail Dawgs',
      role: 'admin',
    },
  })

  // Create a second demo coach (non-admin)
  const coach2 = await prisma.user.upsert({
    where: { email: 'assistant@juniorrailers.com' },
    update: {},
    create: {
      name: 'Asst. Coach',
      email: 'assistant@juniorrailers.com',
      password: hashedPassword,
      teamName: 'Worcester Rail Dawgs',
      role: 'coach',
    },
  })

  console.log('✅ Created demo admin:', coach.email)
  console.log('✅ Created demo coach:', coach2.email)

  const drillsData = [
    {
      title: 'Rail Dawgs Speed Circuit',
      description: 'High-intensity skating circuit to build edge control and acceleration. Players skate through a series of cones placed in a circuit pattern across all three zones, focusing on explosive starts and sharp turns.',
      objectives: JSON.stringify(['Build explosive acceleration', 'Improve edge control', 'Develop crossover technique']),
      duration: 12,
      players: 'full-team',
      intensity: 'high',
      ageGroups: JSON.stringify(['12u', '14u', '16u', '18u']),
      positions: JSON.stringify(['all']),
      skills: JSON.stringify(['skating', 'conditioning']),
      phases: JSON.stringify(['warmup', 'skill-development']),
      isPublic: true,
    },
    {
      title: 'Sauce Pass Challenge',
      description: 'Players pair up and practice sauce passes (backhand aerial passes) over a stick lying flat on the ice. Progress to longer distances and moving targets. Great for developing soft hands and creativity.',
      objectives: JSON.stringify(['Master the sauce pass', 'Develop backhand touch', 'Improve puck creativity']),
      duration: 8,
      players: 'pairs',
      intensity: 'medium',
      ageGroups: JSON.stringify(['10u', '12u', '14u', '16u', '18u']),
      positions: JSON.stringify(['all']),
      skills: JSON.stringify(['passing', 'puck-handling']),
      phases: JSON.stringify(['skill-development']),
      isPublic: true,
    },
    {
      title: '2-on-1 Rush Drill',
      description: 'Classic 2-on-1 drill where two attackers come in against one defender. Coach controls timing from the blue line. Attackers must read the defender and make the right play — shoot or pass. Defenders practice gap control and angling.',
      objectives: JSON.stringify(['Read the defensive play', 'Execute under pressure', 'Defender gap control', 'Communication between attackers']),
      duration: 15,
      players: 'groups',
      intensity: 'medium',
      ageGroups: JSON.stringify(['12u', '14u', '16u', '18u']),
      positions: JSON.stringify(['forwards', 'defensemen']),
      skills: JSON.stringify(['shooting', 'passing', 'defense']),
      phases: JSON.stringify(['skill-development']),
      isPublic: true,
    },
    {
      title: 'Mite Puck Control Maze',
      description: 'Set up 8 cones in a zigzag pattern in one zone. Young players skate through the maze carrying the puck, focusing on keeping their head up and maintaining control at speed. Use music to make it fun!',
      objectives: JSON.stringify(['Keep head up while handling puck', 'Build confidence with the puck', 'Improve edge work at slow speed']),
      duration: 10,
      players: 'individual',
      intensity: 'low',
      ageGroups: JSON.stringify(['8u', '10u']),
      positions: JSON.stringify(['all']),
      skills: JSON.stringify(['puck-handling', 'skating']),
      phases: JSON.stringify(['warmup', 'skill-development']),
      isPublic: true,
    },
    {
      title: 'Breakout Zone Exit - D Activation',
      description: 'Full breakout drill focusing on defenseman activation. D retrieves puck behind their net, reads pressure, and either makes an outlet pass to the winger or joins the rush. Forwards must read the D and support properly.',
      objectives: JSON.stringify(['Defenseman puck retrieval technique', 'Reading pressure and making decisions', 'Forward positioning and support', 'Zone exit timing']),
      duration: 18,
      players: 'full-team',
      intensity: 'medium',
      ageGroups: JSON.stringify(['14u', '16u', '18u']),
      positions: JSON.stringify(['all']),
      skills: JSON.stringify(['systems', 'passing', 'skating']),
      phases: JSON.stringify(['skill-development']),
      isPublic: true,
    },
    {
      title: 'Goalie Butterfly Save Progression',
      description: 'Goalie-specific drill progressing from static butterfly slides to dynamic save scenarios. Start with slide saves to both posts, then add shooter from the slot for deflections. Focus on RVH (reverse VH) positioning.',
      objectives: JSON.stringify(['Butterfly slide technique', 'Post integration and coverage', 'Rebound control', 'RVH positioning']),
      duration: 20,
      players: 'individual',
      intensity: 'medium',
      ageGroups: JSON.stringify(['12u', '14u', '16u', '18u']),
      positions: JSON.stringify(['goalies']),
      skills: JSON.stringify(['goaltending']),
      phases: JSON.stringify(['skill-development']),
      isPublic: true,
    },
    {
      title: 'Power Play Cycle - Umbrella Setup',
      description: 'Teach players the umbrella power play formation. QB at the point with two half-wall players and two low slot players. Run set plays from the cycle — cross-ice passes, back-door plays, and point shots with traffic.',
      objectives: JSON.stringify(['Understand umbrella PP formation', 'Execute set plays with timing', 'Point shot with traffic', 'Back-door opportunity recognition']),
      duration: 20,
      players: 'groups',
      intensity: 'medium',
      ageGroups: JSON.stringify(['14u', '16u', '18u']),
      positions: JSON.stringify(['all']),
      skills: JSON.stringify(['power-play', 'shooting', 'passing', 'systems']),
      phases: JSON.stringify(['skill-development']),
      isPublic: true,
    },
    {
      title: 'Penalty Kill Box Formation Drill',
      description: 'Four players practice the box PK formation against a stationary 5-on-4 setup. Focus on collapsing on the puck carrier, stick positioning to block passing lanes, and clearing pucks to neutral zone.',
      objectives: JSON.stringify(['Box formation discipline', 'Passing lane obstruction', 'Puck pressure triggers', 'Clearing pucks under pressure']),
      duration: 15,
      players: 'groups',
      intensity: 'high',
      ageGroups: JSON.stringify(['14u', '16u', '18u']),
      positions: JSON.stringify(['all']),
      skills: JSON.stringify(['penalty-kill', 'defense', 'systems']),
      phases: JSON.stringify(['skill-development']),
      isPublic: true,
    },
    {
      title: 'Rail Dawgs Conditioning End-to-End',
      description: 'Players skate from goal line to goal line using full-stride, no-puck sprints. First set is straight-line speed. Second set adds crossover turns at each blue line. Third set adds stopping at blue lines. Rest 30 seconds between sets.',
      objectives: JSON.stringify(['Build cardiovascular conditioning', 'Improve stride length', 'Skating endurance']),
      duration: 12,
      players: 'full-team',
      intensity: 'high',
      ageGroups: JSON.stringify(['12u', '14u', '16u', '18u', 'adult']),
      positions: JSON.stringify(['all']),
      skills: JSON.stringify(['skating', 'conditioning']),
      phases: JSON.stringify(['warmup', 'cooldown']),
      isPublic: true,
    },
    {
      title: 'Corner Battle & Net Drive',
      description: 'One-on-one battle in the corner. Puck is rimmed in and two players fight for possession. The winner must attempt to drive the net and either score or get to the front. Great for physical engagement and compete level.',
      objectives: JSON.stringify(['Win battles in the corners', 'Drive to the net after possession', 'Physical engagement and compete', 'Net-front presence']),
      duration: 10,
      players: 'pairs',
      intensity: 'high',
      ageGroups: JSON.stringify(['12u', '14u', '16u', '18u']),
      positions: JSON.stringify(['forwards']),
      skills: JSON.stringify(['puck-handling', 'shooting', 'conditioning']),
      phases: JSON.stringify(['skill-development', 'scrimmage']),
      isPublic: true,
    },
  ]

  for (const drillData of drillsData) {
    await prisma.drill.create({
      data: {
        ...drillData,
        authorId: coach.id,
      },
    })
  }

  console.log(`✅ Created ${drillsData.length} sample drills`)

  // Create a sample practice plan
  const drills = await prisma.drill.findMany({ where: { authorId: coach.id } })
  const speedDrill = drills.find((d) => d.title.includes('Speed Circuit'))
  const sauceDrill = drills.find((d) => d.title.includes('Sauce'))
  const rushDrill = drills.find((d) => d.title.includes('2-on-1'))
  const condDrill = drills.find((d) => d.title.includes('Conditioning'))

  if (speedDrill && sauceDrill && rushDrill && condDrill) {
    await prisma.practicePlan.create({
      data: {
        title: 'Rail Dawgs Tuesday Practice - 14U',
        description: 'Standard Tuesday practice focused on skating and transition play',
        ageGroup: '14u',
        totalDuration: 55,
        teamNotes: 'Bring extra water! Focus on compete level in battles.',
        isPublic: true,
        authorId: coach.id,
        drills: {
          create: [
            { drillId: speedDrill.id, order: 0, duration: 12, notes: 'Emphasize proper edges' },
            { drillId: sauceDrill.id, order: 1, duration: 8, notes: 'Start close (5 feet), progress to 15 feet' },
            { drillId: rushDrill.id, order: 2, duration: 25, notes: 'Keep score! Winners move up' },
            { drillId: condDrill.id, order: 3, duration: 10, notes: 'Cool-down pace, then stretching' },
          ],
        },
      },
    })
    console.log('✅ Created sample practice plan')
  }

  console.log('\n🏒 Seed complete! Login at: coach@juniorrailers.com / heycoach123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
