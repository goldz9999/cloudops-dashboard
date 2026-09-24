import { services as catalog } from './mockData';

export type RegionStatus = 'operational' | 'review' | 'issue';
export type ServiceStatus = 'in-use' | 'available';
export type HealthStatus = 'healthy' | 'review' | 'issue';

export interface CostRow {
  id: number;
  service: string;
  quantity: number;
  hours: number;
  rate: number;
  monthly: number;
}

export interface ServiceMetric {
  status: ServiceStatus;
  /** Cantidad de recursos desplegados en la región */
  resources: number;
  /** Porcentaje de uso (0-100) */
  usage: number;
}

export interface RegionSecurity {
  iam: HealthStatus;
  mfa: HealthStatus;
  dataProtection: HealthStatus;
  accountProtection: HealthStatus;
  compliance: HealthStatus;
}

export interface RegionData {
  id: string;
  name: string;
  location: string;
  lat: number;
  lon: number;
  status: RegionStatus;
  securityScore: number;
  availability: number;
  security: RegionSecurity;
  costTable: CostRow[];
  /** Métricas por id de servicio del catálogo */
  serviceMetrics: Record<string, ServiceMetric>;
  /** Nombres de los servicios en uso (derivado de serviceMetrics) */
  services: string[];
}

export interface RegionSummary {
  servicesUsed: number;
  cloudResources: number;
  monthlyCost: number;
  annualCost: number;
  costDistribution: { name: string; value: number; percentage: number }[];
}

// monthly se calcula como cantidad × horas × tarifa salvo que se indique explícitamente
const row = (id: number, service: string, quantity: number, hours: number, rate: number, monthly?: number): CostRow => ({
  id,
  service,
  quantity,
  hours,
  rate,
  monthly: monthly ?? +(quantity * hours * rate).toFixed(2),
});

const m = (status: ServiceStatus, resources: number, usage: number): ServiceMetric => ({ status, resources, usage });

type RawRegion = Omit<RegionData, 'services'>;

const rawRegions: RawRegion[] = [
  {
    id: 'us-east-1',
    name: 'EE. UU. Este',
    location: 'N. Virginia',
    lat: 38.9,
    lon: -77.5,
    status: 'operational',
    securityScore: 92,
    availability: 99.9,
    security: { iam: 'healthy', mfa: 'healthy', dataProtection: 'healthy', accountProtection: 'review', compliance: 'healthy' },
    costTable: [
      row(1, 'EC2', 4, 730, 0.0528, 154.13),
      row(2, 'RDS', 2, 730, 0.0704, 102.75),
      row(3, 'S3', 500, 1, 0.023, 41.1),
      row(4, 'CloudFront', 1000, 1, 0.0274, 27.4),
      row(5, 'Route 53', 1, 1, 17.12, 17.12),
    ],
    serviceMetrics: {
      ec2: m('in-use', 4, 68),
      s3: m('in-use', 3, 54),
      rds: m('in-use', 2, 61),
      iam: m('in-use', 3, 40),
      vpc: m('in-use', 2, 35),
      route53: m('in-use', 2, 72),
      cloudfront: m('in-use', 2, 58),
    },
  },
  {
    id: 'us-west-2',
    name: 'EE. UU. Oeste',
    location: 'Oregón',
    lat: 45.8,
    lon: -119.7,
    status: 'operational',
    securityScore: 94,
    availability: 99.95,
    security: { iam: 'healthy', mfa: 'healthy', dataProtection: 'healthy', accountProtection: 'healthy', compliance: 'healthy' },
    costTable: [
      row(1, 'EC2', 3, 730, 0.0416),
      row(2, 'RDS', 1, 730, 0.0704),
      row(3, 'S3', 800, 1, 0.023),
      row(4, 'Route 53', 1, 1, 17.12),
    ],
    serviceMetrics: {
      ec2: m('in-use', 3, 74),
      s3: m('in-use', 2, 47),
      rds: m('in-use', 1, 66),
      iam: m('in-use', 2, 38),
      vpc: m('in-use', 1, 29),
      route53: m('in-use', 1, 55),
      cloudfront: m('available', 0, 0),
    },
  },
  {
    id: 'sa-east-1',
    name: 'Sudamérica',
    location: 'São Paulo',
    lat: -23.5,
    lon: -46.6,
    status: 'operational',
    securityScore: 88,
    availability: 99.7,
    security: { iam: 'healthy', mfa: 'healthy', dataProtection: 'healthy', accountProtection: 'healthy', compliance: 'review' },
    costTable: [
      row(1, 'EC2', 3, 730, 0.0672),
      row(2, 'RDS', 1, 730, 0.0896),
      row(3, 'S3', 300, 1, 0.0405),
    ],
    serviceMetrics: {
      ec2: m('in-use', 3, 59),
      s3: m('in-use', 1, 33),
      rds: m('in-use', 1, 52),
      iam: m('in-use', 2, 45),
      vpc: m('in-use', 1, 30),
      route53: m('available', 0, 0),
      cloudfront: m('available', 0, 0),
    },
  },
  {
    id: 'eu-west-1',
    name: 'Europa',
    location: 'Irlanda',
    lat: 53.3,
    lon: -8.0,
    status: 'review',
    securityScore: 85,
    availability: 99.5,
    security: { iam: 'review', mfa: 'healthy', dataProtection: 'healthy', accountProtection: 'review', compliance: 'review' },
    costTable: [
      row(1, 'EC2', 2, 730, 0.0584),
      row(2, 'S3', 400, 1, 0.0245),
      row(3, 'CloudFront', 800, 1, 0.03),
    ],
    serviceMetrics: {
      ec2: m('in-use', 2, 81),
      s3: m('in-use', 2, 44),
      rds: m('available', 0, 0),
      iam: m('in-use', 2, 50),
      vpc: m('in-use', 1, 41),
      route53: m('available', 0, 0),
      cloudfront: m('in-use', 1, 77),
    },
  },
  {
    id: 'eu-central-1',
    name: 'Europa Central',
    location: 'Fráncfort',
    lat: 50.1,
    lon: 8.7,
    status: 'operational',
    securityScore: 91,
    availability: 99.9,
    security: { iam: 'healthy', mfa: 'healthy', dataProtection: 'healthy', accountProtection: 'healthy', compliance: 'healthy' },
    costTable: [
      row(1, 'EC2', 2, 730, 0.0624),
      row(2, 'RDS', 2, 730, 0.0768),
      row(3, 'S3', 600, 1, 0.0245),
      row(4, 'CloudFront', 1200, 1, 0.0274),
    ],
    serviceMetrics: {
      ec2: m('in-use', 2, 63),
      s3: m('in-use', 2, 49),
      rds: m('in-use', 2, 70),
      iam: m('in-use', 2, 36),
      vpc: m('in-use', 1, 32),
      route53: m('available', 0, 0),
      cloudfront: m('in-use', 2, 64),
    },
  },
  {
    id: 'ap-southeast-1',
    name: 'Asia Pacífico',
    location: 'Singapur',
    lat: 1.35,
    lon: 103.8,
    status: 'operational',
    securityScore: 90,
    availability: 99.8,
    security: { iam: 'healthy', mfa: 'review', dataProtection: 'healthy', accountProtection: 'healthy', compliance: 'healthy' },
    costTable: [row(1, 'EC2', 2, 730, 0.0656), row(2, 'S3', 250, 1, 0.025)],
    serviceMetrics: {
      ec2: m('in-use', 2, 57),
      s3: m('in-use', 1, 28),
      rds: m('available', 0, 0),
      iam: m('in-use', 1, 34),
      vpc: m('in-use', 1, 27),
      route53: m('available', 0, 0),
      cloudfront: m('available', 0, 0),
    },
  },
];

export const regionsData: RegionData[] = rawRegions.map((r) => ({
  ...r,
  services: catalog.filter((s) => r.serviceMetrics[s.id]?.status === 'in-use').map((s) => s.name),
}));

export const DEFAULT_REGION_ID = 'us-east-1';

export const regionLabel = (r: Pick<RegionData, 'name' | 'location'>) => `${r.name} (${r.location})`;

export const regionStatusLabel: Record<RegionStatus, string> = {
  operational: 'Operativo',
  review: 'Revisión',
  issue: 'Problema',
};

export function summarizeRegion(r: RegionData): RegionSummary {
  const monthlyCost = +r.costTable.reduce((s, c) => s + c.monthly, 0).toFixed(2);
  const metrics = Object.values(r.serviceMetrics);
  return {
    servicesUsed: metrics.filter((x) => x.status === 'in-use').length,
    cloudResources: metrics.reduce((s, x) => s + x.resources, 0),
    monthlyCost,
    annualCost: Math.round(monthlyCost * 12),
    costDistribution: r.costTable.map((c) => ({
      name: c.service,
      value: c.monthly,
      percentage: monthlyCost ? Math.round((c.monthly / monthlyCost) * 100) : 0,
    })),
  };
}