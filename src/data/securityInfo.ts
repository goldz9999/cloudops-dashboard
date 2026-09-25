export interface InfoEntry {
  description: string;
  /** Solo para elementos en estado "Revisión" */
  recommendation?: string;
}

/** Modelo de responsabilidad compartida: lo que gestiona AWS ("de la nube") */
export const awsResponsibilityInfo: Record<string, InfoEntry> = {
  'Infraestructura física': {
    description:
      'Edificios, energía, refrigeración y seguridad física (accesos, vigilancia) de los centros de datos donde se ejecuta tu nube.',
  },
  Hardware: {
    description:
      'Servidores, almacenamiento y equipos de red. AWS los adquiere, los mantiene y los reemplaza cuando fallan.',
  },
  Redes: {
    description:
      'La red global que conecta regiones y zonas de disponibilidad. AWS protege esa red base; tú configuras la tuya (VPC, subredes, Security Groups).',
  },
  'Centros de datos': {
    description:
      'Las regiones y zonas de disponibilidad, con redundancia y controles de acceso. Tú decides en cuáles desplegar tus recursos.',
  },
  Hipervisor: {
    description:
      'La capa de virtualización que aísla tus instancias de las de otros clientes que comparten el mismo hardware.',
  },
};

/** Modelo de responsabilidad compartida: lo que gestiona el cliente ("en la nube") */
export const customerResponsibilityInfo: Record<string, InfoEntry> = {
  IAM: {
    description:
      'Crear usuarios, grupos, roles y políticas, y decidir quién puede hacer qué en tu cuenta.',
  },
  'Cifrado de datos': {
    description:
      'Activar y administrar el cifrado de tus datos, tanto almacenados (S3, EBS, RDS) como en tránsito (HTTPS/TLS).',
  },
  Permisos: {
    description:
      'Aplicar el principio de mínimo privilegio: dar solo los accesos necesarios y revisarlos periódicamente.',
  },
  Configuración: {
    description:
      'Reglas de red, Security Groups, buckets y servicios. Una configuración incorrecta es una de las causas más comunes de incidentes.',
  },
  'Contraseñas y MFA': {
    description:
      'Definir políticas de contraseñas y activar la autenticación multifactor (MFA) en la cuenta raíz y en los usuarios.',
  },
  Aplicaciones: {
    description:
      'La seguridad del código que despliegas: dependencias actualizadas, validación de entradas y manejo seguro de secretos.',
  },
  'Parches del sistema operativo': {
    description:
      'En EC2, el sistema operativo de tus instancias es tu responsabilidad. En servicios administrados como RDS, AWS aplica los parches por ti.',
  },
};

export const accountProtectionInfo: Record<string, InfoEntry> = {
  'MFA de la cuenta raíz': {
    description:
      'La cuenta raíz tiene acceso total. Un segundo factor de autenticación evita que alguien entre solo con la contraseña.',
  },
  'MFA de usuarios IAM': {
    description: 'Exige un segundo factor a cada usuario IAM para iniciar sesión en la consola.',
  },
  'Rotación de claves de acceso': {
    description:
      'Cambiar las claves de acceso con regularidad limita el daño si alguna se filtra o queda olvidada.',
    recommendation:
      'Rota las claves con más de 90 días, elimina las que no uses o reemplázalas por roles con credenciales temporales.',
  },
  'Política de contraseñas': {
    description: 'Reglas de longitud mínima, complejidad y caducidad que deben cumplir las contraseñas de tus usuarios.',
  },
  'CloudTrail habilitado': {
    description:
      'CloudTrail registra las acciones realizadas en tu cuenta (quién, qué y cuándo). Es la base de cualquier auditoría.',
  },
};

export const dataProtectionInfo: Record<string, InfoEntry> = {
  'Cifrado en reposo': {
    description: 'Los datos guardados en discos, buckets y bases de datos están cifrados (por ejemplo con AWS KMS).',
  },
  'Cifrado en tránsito': {
    description: 'Los datos viajan cifrados entre el usuario y tus servicios mediante HTTPS/TLS.',
  },
  'Copias de seguridad automáticas': {
    description: 'Respaldos programados (por ejemplo de RDS) que permiten restaurar información ante fallos o borrados.',
  },
  'Listas de control de acceso (ACL)': {
    description:
      'Permisos a nivel de objeto en S3. Son un mecanismo antiguo y fácil de configurar mal; AWS recomienda usar políticas.',
    recommendation:
      'Revisa las ACL activas y desactívalas donde no hagan falta, gestionando el acceso con políticas del bucket o de IAM.',
  },
  'Bloqueo de acceso público en S3': {
    description: 'Impide que un bucket u objeto quede expuesto a internet por accidente, aunque alguien lo configure mal.',
  },
};

export const complianceInfo: Record<string, InfoEntry> = {
  'ISO 27001': {
    description: 'Estándar internacional para gestionar la seguridad de la información dentro de una organización.',
  },
  'SOC 2': {
    description:
      'Informe de auditoría sobre los controles de un proveedor en seguridad, disponibilidad y confidencialidad de los datos.',
  },
  GDPR: {
    description: 'Reglamento europeo de protección de datos personales. Aplica si tratas datos de residentes de la UE.',
  },
  HIPAA: {
    description: 'Ley de EE. UU. que protege la información de salud. Exige controles y acuerdos específicos con el proveedor.',
    recommendation:
      'Firma el acuerdo BAA con AWS, usa solo servicios elegibles para HIPAA y cifra toda la información de salud.',
  },
};