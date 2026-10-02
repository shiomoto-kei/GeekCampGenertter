"use client";

import { iconImageUrl, type IconOption } from "@/lib/icons";

type IconPickerProps = {
  icons: IconOption[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  name: string;
};

export default function IconPicker({ icons, selectedId, onSelect, name }: IconPickerProps) {
  if (icons.length === 0) {
    return <p className="icon-empty">アイコンはまだ登録されていません。後から設定できます。</p>;
  }

  return (
    <fieldset className="icon-picker">
      <legend>アイコンを選ぶ</legend>
      <div className="icon-options">
        {icons.map((icon) => {
          const imageUrl = iconImageUrl(icon.image_path);
          return (
            <label className={`icon-option ${selectedId === icon.id ? "selected" : ""}`} key={icon.id}>
              <input
                type="radio"
                name={name}
                value={icon.id}
                checked={selectedId === icon.id}
                onChange={() => onSelect(icon.id)}
              />
              <span className="icon-preview">{imageUrl && <img src={imageUrl} alt="" />}</span>
              <span className="icon-name">{icon.name}</span>
              <span className="icon-detail">{icon.generation}・{icon.gender}</span>
            </label>
          );
        })}
      </div>
      <style jsx>{`
        .icon-picker { width: 100%; margin: 0; padding: 0; border: 0; }
        legend { margin-bottom: 8px; color: #333; font-size: 14px; font-weight: 700; }
        .icon-options { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; max-height: 230px; overflow-y: auto; }
        .icon-option { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; padding: 8px 4px; border: 2px solid #ddd; border-radius: 10px; cursor: pointer; text-align: center; }
        .icon-option.selected { border-color: #299d48; background: #f1faed; }
        input { position: absolute; width: 1px; height: 1px; opacity: 0; }
        .icon-option:focus-within { outline: 2px solid #299d48; outline-offset: 2px; }
        .icon-option.selected:focus-within { outline: none; }
        .icon-preview { width: 52px; height: 52px; border-radius: 50%; background: #d9d9d9; overflow: hidden; }
        .icon-preview img { width: 100%; height: 100%; object-fit: cover; }
        .icon-name { font-size: 12px; color: #222; overflow-wrap: anywhere; }
        .icon-detail { font-size: 10px; color: #666; overflow-wrap: anywhere; }
      `}</style>
    </fieldset>
  );
}
