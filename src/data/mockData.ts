export const kpiData = {
  servicesUsed: 7,
  cloudResources: 18,
  monthlyCost: 342.5,
  annualCost: 4110,
  securityScore: 92,
  availability: 99.9,
};

export const costDistribution = [
  { name: 'EC2', value: 154.13, percentage: 45 },
  { name: 'RDS', value: 102.75, percentage: 30 },
  { name: 'S3', value: 41.1, percentage: 12 },
  { name: 'CloudFront', value: 27.4, percentage: 8 },
  { name: 'Route 53', value: 17.12, percentage: 5 },
];

export const regions = [
  {
    id: 'us-east-1',
    name: 'US East',
    location: 'N. Virginia',
    status: 'operational' as const,
    services: ['EC2', 'S3', 'RDS', 'CloudFront', 'Route 53'],
  },
  {
    id: 'sa-east-1',
    name: 'South America',
    location: 'São Paulo',
    status: 'operational' as const,
    services: ['EC2', 'S3', 'RDS'],
  },
  {
    id: 'eu-west-1',
    name: 'Europe',
    location: 'Ireland',
    status: 'review' as const,
    services: ['EC2', 'S3', 'CloudFront'],
  },
  {
    id: 'ap-southeast-1',
    name: 'Asia Pacific',
    location: 'Singapore',
    status: 'operational' as const,
    services: ['EC2', 'S3'],
  },
];

export const services = [
  {
    id: 'ec2',
    name: 'EC2',
    category: 'Compute',
    description: 'Virtual servers in the cloud. Run applications with scalable compute capacity.',
    mainFunction: 'Run applications',
    status: 'in-use' as const,
    icon: 'Server',
  },
  {
    id: 's3',
    name: 'S3',
    category: 'Storage',
    description: 'Object storage built to store and retrieve any amount of data from anywhere.',
    mainFunction: 'Store objects',
    status: 'in-use' as const,
    icon: 'HardDrive',
  },
  {
    id: 'rds',
    name: 'RDS',
    category: 'Database',
    description: 'Managed relational database service for MySQL, PostgreSQL, and more.',
    mainFunction: 'Managed databases',
    status: 'in-use' as const,
    icon: 'Database',
  },
  {
    id: 'iam',
    name: 'IAM',
    category: 'Security',
    description: 'Identity and Access Management. Securely control access to AWS services.',
    mainFunction: 'Access control',
    status: 'in-use' as const,
    icon: 'Shield',
  },
  {
    id: 'vpc',
    name: 'VPC',
    category: 'Networking',
    description: 'Isolated cloud resources in a virtual private network.',
    mainFunction: 'Network isolation',
    status: 'in-use' as const,
    icon: 'Network',
  },
  {
    id: 'route53',
    name: 'Route 53',
    category: 'Networking',
    description: 'Scalable Domain Name System (DNS) web service.',
    mainFunction: 'DNS routing',
    status: 'in-use' as const,
    icon: 'Globe',
  },
  {
    id: 'cloudfront',
    name: 'CloudFront',
    category: 'Networking',
    description: 'Fast content delivery network (CDN) service.',
    mainFunction: 'Content delivery',
    status: 'available' as const,
    icon: 'Cloud',
  },
];

export const securityItems = {
  score: 92,
  iam: 'healthy' as const,
  dataProtection: 'healthy' as const,
  accountProtection: 'review' as const,
  compliance: 'healthy' as const,
};

export const sharedResponsibility = {
  aws: [
    'Physical infrastructure',
    'Hardware',
    'Networking',
    'Data centers',
    'Hypervisor',
  ],
  customer: [
    'IAM',
    'Data encryption',
    'Permissions',
    'Configuration',
    'Passwords & MFA',
    'Applications',
    'Operating system patches',
  ],
};

export const iamCards = [
  { title: 'Users', value: 12, status: 'healthy' as const, description: 'Active IAM users' },
  { title: 'Roles', value: 8, status: 'healthy' as const, description: 'Service roles configured' },
  { title: 'Policies', value: 24, status: 'review' as const, description: 'Custom policies' },
  { title: 'MFA', value: 'Enabled', status: 'healthy' as const, description: 'Root & users protected' },
  { title: 'Least Privilege', value: 'Partial', status: 'review' as const, description: 'Review over-privileged roles' },
];

export const costTableData = [
  { id: 1, service: 'EC2', quantity: 4, hours: 730, rate: 0.0528, monthly: 154.13 },
  { id: 2, service: 'RDS', quantity: 2, hours: 730, rate: 0.0704, monthly: 102.75 },
  { id: 3, service: 'S3', quantity: 500, hours: 1, rate: 0.023, monthly: 41.1 },
  { id: 4, service: 'CloudFront', quantity: 1000, hours: 1, rate: 0.0274, monthly: 27.4 },
  { id: 5, service: 'Route 53', quantity: 1, hours: 1, rate: 17.12, monthly: 17.12 },
];

export const networkComponents = [
  { name: 'Internet', description: 'Public internet traffic entry point' },
  { name: 'Route 53', description: 'DNS resolution and traffic routing' },
  { name: 'CloudFront', description: 'CDN for low-latency content delivery' },
  { name: 'VPC', description: 'Isolated virtual network for resources' },
  { name: 'EC2', description: 'Compute instances running applications' },
  { name: 'RDS', description: 'Managed relational database' },
];
