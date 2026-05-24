import { SEVERITY_COLORS } from '../../utils/helpers';

export default function SeverityBadge({ severity, size = 'sm' }) {
  const cls = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info;
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1' };
  return (
    <span className={`inline-flex items-center rounded-full border font-medium uppercase ${cls} ${sizes[size]}`}>
      {severity}
    </span>
  );
}
