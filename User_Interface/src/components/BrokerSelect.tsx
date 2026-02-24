/**
 * BrokerSelect notes:
 * - To add a broker: append it to src/data/brokers.ts (with aliases for shortcut searches).
 * - To add an icon: place an SVG/PNG in public/broker-icons/ and map broker name in src/data/brokerIcons.ts.
 */
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";

import BrokerIcon from "./BrokerIcon";
import { BROKER_ICONS } from "../data/brokerIcons";
import { OTHER_BROKER, TOP_BROKERS } from "../data/brokers";

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

type SelectOption = { id: string; label: string; isOther?: boolean };

const RECENT_KEY = "stockboard_recent_brokers";
const RECENT_LIMIT = 5;

export default function BrokerSelect({ value, onChange, disabled, placeholder = "broker" }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentNames, setRecentNames] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
      if (Array.isArray(parsed)) {
        return parsed.filter((name) => TOP_BROKERS.some((broker) => broker.name === name));
      }
    } catch {
      // ignore malformed data
    }
    return [];
  });
  const [freeTextMode, setFreeTextMode] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const normalizedValue = value.trim().toLowerCase();
  const selectedKnownBroker = useMemo(
    () => TOP_BROKERS.find((broker) => broker.name.toLowerCase() === normalizedValue),
    [normalizedValue],
  );

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const filteredBrokers = useMemo(() => {
    if (!normalizedValue) return TOP_BROKERS;
    return TOP_BROKERS.filter((broker) => {
      const inName = broker.name.toLowerCase().includes(normalizedValue);
      const inAlias = broker.aliases?.some((alias) => alias.toLowerCase().includes(normalizedValue));
      return inName || inAlias;
    });
  }, [normalizedValue]);

  const recentBrokers = useMemo(
    () =>
      recentNames
        .map((name) => TOP_BROKERS.find((broker) => broker.name === name))
        .filter((broker): broker is (typeof TOP_BROKERS)[number] => Boolean(broker)),
    [recentNames],
  );

  const nonRecentBrokers = useMemo(() => {
    const recentIds = new Set(recentBrokers.map((broker) => broker.id));
    return filteredBrokers.filter((broker) => !recentIds.has(broker.id));
  }, [filteredBrokers, recentBrokers]);

  const allOptions = useMemo<SelectOption[]>(() => {
    const core = [...recentBrokers, ...nonRecentBrokers].map((broker) => ({ id: broker.id, label: broker.name }));
    return [...core, { id: OTHER_BROKER.id, label: OTHER_BROKER.name, isOther: true }];
  }, [nonRecentBrokers, recentBrokers]);

  const optionIndexById = useMemo(() => {
    const map = new Map<string, number>();
    allOptions.forEach((option, index) => map.set(option.id, index));
    return map;
  }, [allOptions]);


  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const upsertRecent = (brokerName: string) => {
    if (!TOP_BROKERS.some((broker) => broker.name === brokerName)) return;
    const merged = [brokerName, ...recentNames.filter((name) => name !== brokerName)].slice(0, RECENT_LIMIT);
    setRecentNames(merged);
    localStorage.setItem(RECENT_KEY, JSON.stringify(merged));
  };

  const chooseOption = (option: SelectOption) => {
    if (option.isOther) {
      setFreeTextMode(true);
      onChange("");
      setOpen(false);
      return;
    }
    setFreeTextMode(false);
    onChange(option.label);
    upsertRecent(option.label);
    setOpen(false);
  };

  const activeOption = allOptions[activeIndex];

  return (
    <div className="brokerSelect" ref={rootRef}>
      <div className="brokerSelectInputWrap">
        <input
          className="form-control brokerSelectInput"
          role="combobox"
          aria-label="Broker"
          aria-expanded={open}
          aria-controls="broker-listbox"
          aria-activedescendant={open && activeOption ? `broker-option-${activeOption.id}` : undefined}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onFocus={() => {
            setActiveIndex(0);
            setOpen(true);
          }}
          onClick={() => {
            setActiveIndex(0);
            setOpen(true);
          }}
          onChange={(e) => {
            setFreeTextMode(false);
            setActiveIndex(0);
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActiveIndex((prev) => Math.min(prev + 1, allOptions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActiveIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && open && activeOption) {
              e.preventDefault();
              chooseOption(activeOption);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <div className="brokerSelectRightAdornment" aria-hidden="true">
          {selectedKnownBroker ? (
            <BrokerIcon className="brokerIcon brokerIconPreview" src={BROKER_ICONS[selectedKnownBroker.name]} />
          ) : null}
          <span className={`brokerChevron ${open ? "open" : ""}`}>⌄</span>
        </div>
      </div>

      {open ? (
        <div className="brokerDropdown" role="listbox" id="broker-listbox">
          {recentBrokers.length > 0 ? <div className="brokerSectionLabel">Recent</div> : null}
          {recentBrokers.map((broker) => (
            <OptionRow
              key={`recent-${broker.id}`}
              ref={(el) => {
                const i = optionIndexById.get(broker.id);
                if (i != null) optionRefs.current[i] = el;
              }}
              optionId={`broker-option-${broker.id}`}
              active={activeOption?.id === broker.id}
              selected={value === broker.name}
              label={broker.name}
              onSelect={() => chooseOption({ id: broker.id, label: broker.name })}
            />
          ))}

          {nonRecentBrokers.length > 0 ? <div className="brokerSectionLabel">All brokers</div> : null}
          {filteredBrokers.length === 0 ? (
            <div className="brokerEmpty">No results</div>
          ) : (
            nonRecentBrokers.map((broker) => (
              <OptionRow
                key={broker.id}
                ref={(el) => {
                  const i = optionIndexById.get(broker.id);
                  if (i != null) optionRefs.current[i] = el;
                }}
                optionId={`broker-option-${broker.id}`}
                active={activeOption?.id === broker.id}
                selected={value === broker.name}
                label={broker.name}
                onSelect={() => chooseOption({ id: broker.id, label: broker.name })}
              />
            ))
          )}

          <div className="brokerDivider" />
          <OptionRow
            ref={(el) => {
              const i = optionIndexById.get(OTHER_BROKER.id);
              if (i != null) optionRefs.current[i] = el;
            }}
            optionId={`broker-option-${OTHER_BROKER.id}`}
            active={activeOption?.id === OTHER_BROKER.id}
            selected={freeTextMode}
            label={OTHER_BROKER.name}
            onSelect={() => chooseOption({ id: OTHER_BROKER.id, label: OTHER_BROKER.name, isOther: true })}
          />
        </div>
      ) : null}
    </div>
  );
}

type OptionRowProps = {
  optionId: string;
  active: boolean;
  selected: boolean;
  label: string;
  onSelect: () => void;
};

const OptionRow = forwardRef<HTMLButtonElement, OptionRowProps>(({ optionId, active, selected, label, onSelect }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      id={optionId}
      role="option"
      aria-selected={selected}
      className={`brokerOption ${active ? "brokerOptionActive" : ""} ${selected ? "brokerOptionSelected" : ""}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
    >
      <BrokerIcon className="brokerIcon" src={BROKER_ICONS[label]} />
      <span>{label}</span>
    </button>
  );
});

OptionRow.displayName = "OptionRow";
