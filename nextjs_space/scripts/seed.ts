import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const sampleThreats = [
  { threatId: 'CVE-2024-3094', title: 'XZ Utils Backdoor (liblzma)', type: 'CVE', severity: 'CRITICAL', status: 'INVESTIGATING', description: 'Malicious code discovered in XZ Utils versions 5.6.0 and 5.6.1 that could allow unauthorized remote access through sshd.', affectedAssets: 'Linux servers, xz-utils 5.6.x', source: 'NVD', cvssScore: 10.0 },
  { threatId: 'CVE-2024-21887', title: 'Ivanti Connect Secure Command Injection', type: 'CVE', severity: 'CRITICAL', status: 'RESOLVED', description: 'Command injection vulnerability in Ivanti Connect Secure and Policy Secure gateways allowing unauthenticated remote code execution.', affectedAssets: 'Ivanti Connect Secure, Policy Secure', source: 'NVD', cvssScore: 9.1 },
  { threatId: 'CVE-2024-1709', title: 'ConnectWise ScreenConnect Authentication Bypass', type: 'CVE', severity: 'CRITICAL', status: 'NEW', description: 'Authentication bypass vulnerability in ConnectWise ScreenConnect allowing unauthorized access to the setup wizard.', affectedAssets: 'ScreenConnect <= 23.9.7', source: 'NVD', cvssScore: 10.0 },
  { threatId: 'CVE-2024-27198', title: 'JetBrains TeamCity Authentication Bypass', type: 'CVE', severity: 'CRITICAL', status: 'INVESTIGATING', description: 'Critical authentication bypass allowing unauthenticated attackers to gain admin access to TeamCity server.', affectedAssets: 'JetBrains TeamCity < 2023.11.4', source: 'NVD', cvssScore: 9.8 },
  { threatId: 'CVE-2024-4577', title: 'PHP CGI Argument Injection', type: 'CVE', severity: 'HIGH', status: 'NEW', description: 'PHP CGI argument injection vulnerability affecting Windows installations with certain locales.', affectedAssets: 'PHP 8.1.x, 8.2.x, 8.3.x on Windows', source: 'NVD', cvssScore: 8.6 },
  { threatId: 'CVE-2024-0204', title: 'GoAnywhere MFT Authentication Bypass', type: 'CVE', severity: 'HIGH', status: 'RESOLVED', description: 'Authentication bypass in Fortra GoAnywhere MFT allowing unauthorized admin account creation.', affectedAssets: 'GoAnywhere MFT < 7.4.1', source: 'NVD', cvssScore: 9.8 },
  { threatId: 'CVE-2024-6387', title: 'OpenSSH regreSSHion RCE', type: 'CVE', severity: 'HIGH', status: 'INVESTIGATING', description: 'Signal handler race condition in OpenSSH sshd allowing unauthenticated remote code execution on glibc-based Linux systems.', affectedAssets: 'OpenSSH 8.5p1 - 9.7p1', source: 'NVD', cvssScore: 8.1 },
  { threatId: 'CVE-2024-38077', title: 'Windows Remote Desktop Licensing RCE', type: 'CVE', severity: 'MEDIUM', status: 'NEW', description: 'Heap-based buffer overflow in Windows Remote Desktop Licensing Service.', affectedAssets: 'Windows Server 2012-2025', source: 'NVD', cvssScore: 7.5 },
  { threatId: 'IOC-001', title: 'Cobalt Strike C2 Beacon - 185.220.101.x', type: 'IOC', severity: 'HIGH', status: 'INVESTIGATING', description: 'Known Cobalt Strike command and control server IP range associated with APT29 operations.', affectedAssets: 'Network perimeter', source: 'AlienVault OTX', indicators: '185.220.101.34, 185.220.101.45, 185.220.101.78' },
  { threatId: 'IOC-002', title: 'LockBit 3.0 Ransomware Hash', type: 'IOC', severity: 'CRITICAL', status: 'NEW', description: 'SHA256 hash of LockBit 3.0 ransomware payload observed in active campaigns targeting healthcare sector.', affectedAssets: 'Windows endpoints', source: 'VirusTotal', indicators: 'a]2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890' },
  { threatId: 'IOC-003', title: 'AsyncRAT Malicious Domain Cluster', type: 'IOC', severity: 'HIGH', status: 'NEW', description: 'Collection of domains used for AsyncRAT distribution through phishing campaigns.', affectedAssets: 'Email gateways, DNS', source: 'Abuse.ch', indicators: 'update-service.xyz, cloud-sync-auth.com, ms-update-check.net' },
  { threatId: 'IOC-004', title: 'QakBot Resurgence Infrastructure', type: 'IOC', severity: 'MEDIUM', status: 'INVESTIGATING', description: 'New QakBot botnet infrastructure identified after FBI takedown, using different C2 protocol.', affectedAssets: 'Windows endpoints, email', source: 'Proofpoint', indicators: '93.184.216.34, qbot-relay.darknet.onion' },
  { threatId: 'IOC-005', title: 'SolarWinds SUNBURST Domain IOCs', type: 'IOC', severity: 'HIGH', status: 'RESOLVED', description: 'DNS-based command and control domains associated with SUNBURST supply chain attack.', affectedAssets: 'SolarWinds Orion', source: 'FireEye', indicators: 'avsvmcloud.com, freescanonline.com' },
  { threatId: 'IOC-006', title: 'Emotet Botnet Email Templates', type: 'IOC', severity: 'MEDIUM', status: 'NEW', description: 'Latest Emotet email templates using invoice and shipping notification lures.', affectedAssets: 'Email systems', source: 'Proofpoint', indicators: 'Subjects: Invoice #[0-9]{6}, Shipping Update' },
  { threatId: 'TTP-001', title: 'T1566.001 - Spearphishing Attachment', type: 'TTP', severity: 'HIGH', status: 'NEW', description: 'Adversaries send spearphishing emails with malicious attachments to gain access. Commonly uses macro-enabled Office documents or ISO/IMG containers.', affectedAssets: 'Email, Endpoints', mitreTactic: 'Initial Access', mitreTechnique: 'T1566.001' },
  { threatId: 'TTP-002', title: 'T1059.001 - PowerShell Execution', type: 'TTP', severity: 'HIGH', status: 'INVESTIGATING', description: 'Adversaries abuse PowerShell for command execution, script-based attacks, and living-off-the-land techniques.', affectedAssets: 'Windows endpoints', mitreTactic: 'Execution', mitreTechnique: 'T1059.001' },
  { threatId: 'TTP-003', title: 'T1053.005 - Scheduled Task Persistence', type: 'TTP', severity: 'MEDIUM', status: 'NEW', description: 'Adversaries create scheduled tasks to maintain persistence and execute malicious payloads at recurring intervals.', affectedAssets: 'Windows endpoints', mitreTactic: 'Persistence', mitreTechnique: 'T1053.005' },
  { threatId: 'TTP-004', title: 'T1003.001 - LSASS Memory Credential Dump', type: 'TTP', severity: 'CRITICAL', status: 'INVESTIGATING', description: 'Adversaries dump LSASS process memory to extract credentials using tools like Mimikatz or procdump.', affectedAssets: 'Windows Domain Controllers', mitreTactic: 'Credential Access', mitreTechnique: 'T1003.001' },
  { threatId: 'TTP-005', title: 'T1071.001 - Web Protocol C2', type: 'TTP', severity: 'MEDIUM', status: 'NEW', description: 'Adversaries use HTTP/HTTPS for command and control communications to blend with normal web traffic.', affectedAssets: 'Network perimeter', mitreTactic: 'Command and Control', mitreTechnique: 'T1071.001' },
  { threatId: 'TTP-006', title: 'T1486 - Data Encrypted for Impact', type: 'TTP', severity: 'CRITICAL', status: 'NEW', description: 'Adversaries encrypt data on target systems to interrupt availability, commonly associated with ransomware operations.', affectedAssets: 'All systems', mitreTactic: 'Impact', mitreTechnique: 'T1486' },
  { threatId: 'TTP-007', title: 'T1021.001 - Remote Desktop Protocol', type: 'TTP', severity: 'HIGH', status: 'INVESTIGATING', description: 'Adversaries use valid accounts to log into systems via RDP for lateral movement.', affectedAssets: 'Windows servers', mitreTactic: 'Lateral Movement', mitreTechnique: 'T1021.001' },
  { threatId: 'IOC-007', title: 'APT28 Phishing Infrastructure', type: 'IOC', severity: 'HIGH', status: 'NEW', description: 'Phishing domains mimicking government and military portals used by APT28/Fancy Bear.', affectedAssets: 'Government networks', source: 'Mandiant', indicators: 'login-gov-verify.com, mil-portal-auth.net' },
  { threatId: 'CVE-2024-23897', title: 'Jenkins CLI Arbitrary File Read', type: 'CVE', severity: 'HIGH', status: 'NEW', description: 'Jenkins CLI allows reading arbitrary files from the Jenkins controller file system.', affectedAssets: 'Jenkins <= 2.441', source: 'NVD', cvssScore: 7.5 },
  { threatId: 'TTP-008', title: 'T1190 - Exploit Public-Facing Application', type: 'TTP', severity: 'HIGH', status: 'INVESTIGATING', description: 'Adversaries exploit vulnerabilities in internet-facing applications for initial access.', affectedAssets: 'Web applications, VPNs', mitreTactic: 'Initial Access', mitreTechnique: 'T1190' },
  { threatId: 'CVE-2024-21762', title: 'Fortinet FortiOS Out-of-Bounds Write', type: 'CVE', severity: 'CRITICAL', status: 'INVESTIGATING', description: 'Out-of-bounds write vulnerability in FortiOS SSL VPN allowing remote code execution.', affectedAssets: 'FortiOS 7.x, FortiProxy', source: 'NVD', cvssScore: 9.6 },
  { threatId: 'IOC-008', title: 'BlackCat/ALPHV Ransomware Wallet', type: 'IOC', severity: 'MEDIUM', status: 'RESOLVED', description: 'Bitcoin wallet addresses linked to BlackCat/ALPHV ransomware payment infrastructure.', affectedAssets: 'Financial systems', source: 'Chainalysis', indicators: 'bc1q...xyz, bc1q...abc' },
];

async function main() {
  console.log('Seeding database...');

  // Upsert default organization
  const org = await prisma.organization.upsert({
    where: { slug: 'threatpulse-demo' },
    update: { name: 'ThreatPulse Demo' },
    create: { name: 'ThreatPulse Demo', slug: 'threatpulse-demo' },
  });

  // Upsert test admin user
  const hashedPw = await bcrypt.hash('johndoe123', 12);
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: { password: hashedPw, role: 'ADMIN', organizationId: org.id },
    create: {
      email: 'john@doe.com',
      name: 'Admin User',
      password: hashedPw,
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  // Upsert admin user for demo
  const adminPw = await bcrypt.hash('admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@threatpulse.com' },
    update: { password: adminPw, role: 'ADMIN', organizationId: org.id },
    create: {
      email: 'admin@threatpulse.com',
      name: 'Security Admin',
      password: adminPw,
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  // Upsert analyst user for demo
  const analystPw = await bcrypt.hash('analyst123!', 12);
  await prisma.user.upsert({
    where: { email: 'analyst@threatpulse.com' },
    update: { password: analystPw, role: 'ANALYST', organizationId: org.id },
    create: {
      email: 'analyst@threatpulse.com',
      name: 'SOC Analyst',
      password: analystPw,
      role: 'ANALYST',
      organizationId: org.id,
    },
  });

  // Upsert sample threats
  for (const threat of sampleThreats) {
    await prisma.threat.upsert({
      where: { threatId: threat.threatId },
      update: { ...threat, organizationId: org.id },
      create: { ...threat, organizationId: org.id },
    });
  }

  console.log(`Seeded ${sampleThreats.length} threats, 3 users, 1 organization`);
}

main()
  .catch((e: any) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
