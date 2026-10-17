interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function NumberField({ label, value, min, max, step = 1, suffix, onChange }: NumberFieldProps) {
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <div className="number-control">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          type="number"
          className="number-input"
          min={min}
          max={max}
          step={step}
          value={round(value)}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isNaN(next)) onChange(next);
          }}
        />
        {suffix ? <span className="field-suffix">{suffix}</span> : null}
      </div>
    </div>
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
