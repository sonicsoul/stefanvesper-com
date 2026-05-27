import { PRESETS } from "../audio/presets";

interface PresetBarProps {
  onLoadPreset: (index: number) => void;
}

export default function PresetBar({ onLoadPreset }: PresetBarProps) {
  return (
    <div className="presets">
      <span className="presets__label">PRESETS</span>
      <div className="presets__buttons">
        {PRESETS.map((preset, i) => (
          <button
            key={preset.name}
            type="button"
            className="btn btn--preset"
            onClick={() => onLoadPreset(i)}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
