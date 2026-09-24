export const services = [
  {
    id: 'ec2',
    name: 'EC2',
    category: 'Cómputo',
    description: 'Servidores virtuales en la nube. Ejecuta aplicaciones con capacidad de cómputo escalable.',
    mainFunction: 'Ejecutar aplicaciones',
    status: 'in-use' as const,
    icon: 'Server',
  },
  {
    id: 's3',
    name: 'S3',
    category: 'Almacenamiento',
    description: 'Almacenamiento de objetos diseñado para guardar y recuperar cualquier cantidad de datos desde cualquier lugar.',
    mainFunction: 'Almacenar objetos',
    status: 'in-use' as const,
    icon: 'HardDrive',
  },
  {
    id: 'rds',
    name: 'RDS',
    category: 'Bases de datos',
    description: 'Servicio de bases de datos relacionales administradas para MySQL, PostgreSQL y más.',
    mainFunction: 'Bases de datos administradas',
    status: 'in-use' as const,
    icon: 'Database',
  },
  {
    id: 'iam',
    name: 'IAM',
    category: 'Seguridad',
    description: 'Gestión de identidades y accesos. Controla de forma segura el acceso a los servicios de AWS.',
    mainFunction: 'Control de acceso',
    status: 'in-use' as const,
    icon: 'Shield',
  },
  {
    id: 'vpc',
    name: 'VPC',
    category: 'Redes',
    description: 'Recursos en la nube aislados dentro de una red virtual privada.',
    mainFunction: 'Aislamiento de red',
    status: 'in-use' as const,
    icon: 'Network',
  },
  {
    id: 'route53',
    name: 'Route 53',
    category: 'Redes',
    description: 'Servicio web escalable del Sistema de Nombres de Dominio (DNS).',
    mainFunction: 'Enrutamiento DNS',
    status: 'in-use' as const,
    icon: 'Globe',
  },
  {
    id: 'cloudfront',
    name: 'CloudFront',
    category: 'Redes',
    description: 'Servicio de red de entrega de contenido (CDN) rápido.',
    mainFunction: 'Entrega de contenido',
    status: 'available' as const,
    icon: 'Cloud',
  },
];

export const serviceCategories = [
  'Todos',
  'Cómputo',
  'Almacenamiento',
  'Bases de datos',
  'Redes',
  'Seguridad',
] as const;

export const sharedResponsibility = {
  aws: [
    'Infraestructura física',
    'Hardware',
    'Redes',
    'Centros de datos',
    'Hipervisor',
  ],
  customer: [
    'IAM',
    'Cifrado de datos',
    'Permisos',
    'Configuración',
    'Contraseñas y MFA',
    'Aplicaciones',
    'Parches del sistema operativo',
  ],
};

export const iamCards = [
  { title: 'Usuarios', value: 12, status: 'healthy' as const, description: 'Usuarios IAM activos' },
  { title: 'Roles', value: 8, status: 'healthy' as const, description: 'Roles de servicio configurados' },
  { title: 'Políticas', value: 24, status: 'review' as const, description: 'Políticas personalizadas' },
  { title: 'MFA', value: 'Habilitado', status: 'healthy' as const, description: 'Cuenta raíz y usuarios protegidos' },
  { title: 'Mínimo privilegio', value: 'Parcial', status: 'review' as const, description: 'Revisar roles con exceso de permisos' },
];

export const networkComponents = [
  { name: 'Internet', description: 'Punto de entrada del tráfico público de internet' },
  { name: 'Route 53', description: 'Resolución DNS y enrutamiento de tráfico' },
  { name: 'CloudFront', description: 'CDN para entrega de contenido con baja latencia' },
  { name: 'VPC', description: 'Red virtual aislada para los recursos' },
  { name: 'EC2', description: 'Instancias de cómputo que ejecutan las aplicaciones' },
  { name: 'RDS', description: 'Base de datos relacional administrada' },
];