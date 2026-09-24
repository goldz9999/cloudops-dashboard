import { Globe2, Cloud, Network, Server, Database, ArrowDown } from 'lucide-react';
import { networkComponents } from '../data/mockData';

export default function ArquitecturaRed() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-main">Arquitectura de Red</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Representación visual de la arquitectura de red Cloud — desde Internet hasta los recursos internos
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Architecture diagram */}
        <div className="xl:col-span-2 bg-card rounded-xl border border-border p-5 lg:p-8">
          <h2 className="text-sm font-semibold text-text-main mb-6">Diagrama de arquitectura</h2>

          <div className="flex flex-col items-center gap-0 max-w-lg mx-auto">
            {/* Internet */}
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm">
                <Globe2 className="w-5 h-5" />
                INTERNET
              </div>
            </div>

            <div className="flex flex-col items-center py-1">
              <div className="w-0.5 h-6 bg-border" />
              <ArrowDown className="w-4 h-4 text-text-secondary -mt-1" />
            </div>

            {/* Route 53 */}
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-[#2563EB] font-semibold text-sm">
                <Globe2 className="w-5 h-5" />
                ROUTE 53
              </div>
              <p className="text-[10px] text-center text-text-secondary mt-1">DNS & Traffic Routing</p>
            </div>

            <div className="flex flex-col items-center py-1">
              <div className="w-0.5 h-6 bg-border" />
              <ArrowDown className="w-4 h-4 text-text-secondary -mt-1" />
            </div>

            {/* CloudFront */}
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-purple-700 font-semibold text-sm">
                <Cloud className="w-5 h-5" />
                CLOUDFRONT
              </div>
              <p className="text-[10px] text-center text-text-secondary mt-1">CDN / Ubicaciones perimetrales</p>
            </div>

            <div className="flex flex-col items-center py-1">
              <div className="w-0.5 h-6 bg-border" />
              <ArrowDown className="w-4 h-4 text-text-secondary -mt-1" />
            </div>

            {/* VPC Container */}
            <div className="w-full border-2 border-dashed border-indigo-300 dark:border-indigo-500/40 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/10 p-5">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Network className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-indigo-700 text-sm">VPC</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                  10.0.0.0/16
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* EC2 */}
                <div className="bg-card rounded-xl border border-orange-200 dark:border-orange-500/30 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                      <Server className="w-4 h-4 text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-main">EC2</p>
                      <p className="text-[10px] text-text-secondary">Cómputo</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-[11px] text-text-secondary">
                    <p>• t3.medium × 2</p>
                    <p>• Grupo de Auto Scaling</p>
                    <p>• Subred privada</p>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    <span className="text-[10px] text-[#16A34A] font-medium">Running</span>
                  </div>
                </div>

                {/* RDS */}
                <div className="bg-card rounded-xl border border-green-200 dark:border-green-500/30 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                      <Database className="w-4 h-4 text-[#16A34A]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-main">RDS</p>
                      <p className="text-[10px] text-text-secondary">Base de datos</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-[11px] text-text-secondary">
                    <p>• PostgreSQL 15</p>
                    <p>• Multi-AZ (alta disponibilidad)</p>
                    <p>• Subred privada</p>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    <span className="text-[10px] text-[#16A34A] font-medium">Disponible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Components panel */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-main mb-4">Network Components</h2>
          <div className="space-y-3">
            {networkComponents.map((comp, i) => (
              <div
                key={comp.name}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-border"
              >
                <div className="w-6 h-6 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-main">{comp.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{comp.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Flujo de tráfico</h3>
            <p className="text-xs text-text-main leading-relaxed">
              El tráfico de usuarios llega desde Internet, es resuelto por Route 53, acelerado por CloudFront,
              entra a la VPC a través del Internet Gateway y es distribuido a las instancias EC2. RDS permanece
              en subred privada sin acceso público directo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}