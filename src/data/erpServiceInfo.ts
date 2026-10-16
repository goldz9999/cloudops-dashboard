/** Explicación corta de cada servicio de AWS que cubre una brecha. La clave es el id del servicio que envía Backencito. */
export interface ServiceInfo {
    /** Nombre corto del servicio. */
    name: string;
    /** La brecha, dicha en una frase simple. */
    gap: string;
    /** Qué hará el servicio al activarlo. */
    does: string;
}

export const SERVICE_INFO: Record<string, ServiceInfo> = {
    waf: {
        name: 'AWS WAF',
        gap: 'Sin firewall delante del ERP',
        does: 'Filtra el tráfico web y bloquea ataques (como inyecciones SQL o exceso de peticiones) antes de que lleguen al ERP.',
    },
    threat: {
        name: 'Amazon GuardDuty',
        gap: 'Nadie vigila la actividad sospechosa',
        does: 'Analiza la actividad de la cuenta y de la red, y avisa cuando detecta algo anormal, como accesos extraños.',
    },
    backup: {
        name: 'AWS Backup',
        gap: 'Sin copias de seguridad propias',
        does: 'Hace copias automáticas y programadas de los datos, y permite restaurarlas si algo se borra o se daña.',
    },
    kms: {
        name: 'AWS KMS',
        gap: 'Datos sin claves de cifrado propias',
        does: 'Cifra los datos con claves que controla el equipo, de modo que nadie sin la clave pueda leerlos.',
    },
    secrets: {
        name: 'AWS Secrets Manager',
        gap: 'Claves guardadas sin protección ni cambio periódico',
        does: 'Guarda las claves y contraseñas del sistema en una bóveda segura y puede cambiarlas automáticamente cada cierto tiempo.',
    },
    mfa: {
        name: 'Amazon Cognito (MFA)',
        gap: 'El inicio de sesión no pide un segundo paso',
        does: 'Pide un segundo factor al entrar (por ejemplo, un código en el celular), así una contraseña robada no basta.',
    },
};