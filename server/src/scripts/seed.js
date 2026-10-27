import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';
import { Booking } from '../models/Booking.js';
import { ensureAdmin, hashPassword } from '../services/authService.js';

const resources = [
  {
    name: 'Electronics Workbench A1',
    resourceCode: 'EL-WB-A1',
    description: 'Full electronics workstation with dual-channel oscilloscope, soldering station, and ESD-safe surface.',
    category: 'WORKSTATION',
    location: 'Electronics Lab — Block B',
    specifications: 'Tektronix TBS1052B, Weller WE1010, 24V supply, ESD mat',
  },
  {
    name: 'Electronics Workbench A2',
    resourceCode: 'EL-WB-A2',
    description: 'Second electronics bench for circuit prototyping and PCB debugging.',
    category: 'WORKSTATION',
    location: 'Electronics Lab — Block B',
    specifications: 'Keysight DSOX1102G, Hakko FX888D, dual supply',
  },
  {
    name: 'CAD Workstation 01',
    resourceCode: 'CS-CAD-01',
    description: 'High-performance computer for CAD, simulation, and software labs.',
    category: 'COMPUTER',
    location: 'Computer Lab 1 — Block A',
    specifications: 'Ryzen 7, 32GB RAM, NVIDIA T1000, AutoCAD, MATLAB',
  },
  {
    name: 'CAD Workstation 02',
    resourceCode: 'CS-CAD-02',
    description: 'CAD workstation reserved for project work and design courses.',
    category: 'COMPUTER',
    location: 'Computer Lab 1 — Block A',
    specifications: 'Ryzen 7, 32GB RAM, NVIDIA T1000, SolidWorks, MATLAB',
  },
  {
    name: 'Programming PC 12',
    resourceCode: 'CS-PC-12',
    description: 'General-purpose programming computer with development tools preinstalled.',
    category: 'COMPUTER',
    location: 'Computer Lab 2 — Block A',
    specifications: 'Intel i5, 16GB RAM, VS Code, JDK, Python 3, Git',
  },
  {
    name: 'Digital Oscilloscope DSO-04',
    resourceCode: 'EL-DSO-04',
    description: '100 MHz four-channel digital storage oscilloscope for advanced measurements.',
    category: 'ELECTRONIC_EQUIPMENT',
    location: 'Instrumentation Room — Block B',
    specifications: '100 MHz, 4 ch, USB export, 1 GS/s',
  },
  {
    name: 'Function Generator FG-02',
    resourceCode: 'EL-FG-02',
    description: 'Arbitrary waveform generator for analog and digital circuit labs.',
    category: 'ELECTRONIC_EQUIPMENT',
    location: 'Instrumentation Room — Block B',
    specifications: '25 MHz, sine/square/triangle/arb, 50 Ω output',
  },
  {
    name: 'Soldering Station S-07',
    resourceCode: 'EL-SOL-07',
    description: 'Temperature-controlled soldering station with fume extractor nearby.',
    category: 'ELECTRONIC_EQUIPMENT',
    location: 'Electronics Lab — Block B',
    specifications: 'Temp 200–450°C, interchangeable tips',
  },
  {
    name: 'UV-Vis Spectrophotometer',
    resourceCode: 'CH-UV-01',
    description: 'Laboratory instrument for absorbance measurements in chemistry practicals.',
    category: 'LABORATORY_INSTRUMENT',
    location: 'Chemistry Lab — Block C',
    specifications: '190–1100 nm, quartz cuvette holder',
  },
  {
    name: 'Analytical Balance AB-03',
    resourceCode: 'CH-BAL-03',
    description: 'Precision analytical balance for quantitative chemistry work.',
    category: 'LABORATORY_INSTRUMENT',
    location: 'Chemistry Lab — Block C',
    specifications: '0.1 mg readability, draft shield, internal calibration',
  },
  {
    name: '3D Printer Lab Unit 1',
    resourceCode: 'ME-3DP-01',
    description: 'FDM 3D printer for mechanical engineering prototypes and student projects.',
    category: 'LABORATORY_INSTRUMENT',
    location: 'Maker Space — Block D',
    specifications: 'PLA/PETG, 220x220x250 mm build volume',
  },
  {
    name: 'Materials Testing Workstation',
    resourceCode: 'ME-MT-01',
    description: 'Workstation adjacent to the universal testing machine for specimen prep and logging.',
    category: 'WORKSTATION',
    location: 'Strength of Materials Lab — Block D',
    specifications: 'Specimen clamps, calipers, data logger PC',
  },
];

async function seed() {
  await connectDb();
  const admin = await ensureAdmin();
  console.log(`Admin ready: ${admin.email}`);

  let demo = await User.findOne({ email: 'student@labslot.local' });
  if (!demo) {
    demo = await User.create({
      name: 'Demo Student',
      email: 'student@labslot.local',
      passwordHash: await hashPassword('StudentPass123'),
      role: 'STUDENT',
      department: 'Computer Science',
    });
    console.log('Demo student created: student@labslot.local');
  }

  for (const item of resources) {
    const existing = await Resource.findOne({ resourceCode: item.resourceCode });
    if (!existing) {
      await Resource.create(item);
      console.log(`Resource created: ${item.resourceCode}`);
    }
  }

  const printer = await Resource.findOne({ resourceCode: 'ME-3DP-01' });
  if (printer && printer.status !== 'MAINTENANCE') {
    printer.status = 'MAINTENANCE';
    await printer.save();
  }

  const count = await Resource.countDocuments();
  const users = await User.countDocuments();
  const bookings = await Booking.countDocuments();
  console.log(`Seed complete. Users=${users} Resources=${count} Bookings=${bookings}`);
  console.log(`Approval required: ${env.requireBookingApproval}`);
  await disconnectDb();
}

seed().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
