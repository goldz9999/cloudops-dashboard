interface Props {
  selected: string[];
}

const arrow = <span className="text-slate-300 dark:text-slate-600">→</span>;

export default function ArchitecturePreview({ selected }: Props) {
  const has = (id: string) => selected.includes(id);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text-main mb-3">Resumen de arquitectura</h3>
      <div className="flex flex-row flex-wrap items-center gap-1.5 text-xs overflow-x-auto pb-1">
        {has('route53') && (
          <>
            <div className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
              Route 53
            </div>
            {arrow}
          </>
        )}
        {has('cloudfront') && (
          <>
            <div className="px-3 py-1.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-600 font-medium whitespace-nowrap">
              CloudFront
            </div>
            {arrow}
          </>
        )}
        <div className="px-3 py-1.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-medium whitespace-nowrap">
          VPC
        </div>
        {(has('ec2') || has('rds')) && (
          <>
            {arrow}
            <div className="flex gap-1.5">
              {has('ec2') && (
                <div className="px-2.5 py-1 rounded bg-orange-50 dark:bg-orange-500/10 text-[#F59E0B] font-medium whitespace-nowrap">EC2</div>
              )}
              {has('rds') && (
                <div className="px-2.5 py-1 rounded bg-green-50 dark:bg-green-500/10 text-[#16A34A] font-medium whitespace-nowrap">RDS</div>
              )}
            </div>
          </>
        )}
        {has('s3') && (
          <>
            {arrow}
            <div className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-500/10 text-[#2563EB] font-medium whitespace-nowrap">S3</div>
          </>
        )}
      </div>
    </div>
  );
}