import { useEffect, useMemo, useRef, useState, type KeyboardEventHandler } from "react";
import { OTHER_BROKER, TOP_BROKERS } from "../data/brokers";

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export default function BrokerSelect({ value, onChange, disabled }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  const filteredBrokers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return TOP_BROKERS;
    return TOP_BROKERS.filter((broker) =>
      broker.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  useEffect(() => {
    setQuery(value);
    if (!value.trim()) {
      setIsManualMode(false);
    }
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectBroker = (selectedBroker: string) => {
    setIsManualMode(false);
    setQuery(selectedBroker);
    onChange(selectedBroker);
    setIsOpen(false);
  };

  const activateManualMode = () => {
    setIsManualMode(true);
    setQuery("");
    onChange("");
    setIsOpen(false);
  };

  const handleInputChange = (next: string) => {
    setQuery(next);
    onChange(next);
    if (!isManualMode) {
      setIsOpen(true);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" && !isManualMode && isOpen && filteredBrokers.length > 0) {
      event.preventDefault();
      selectBroker(filteredBrokers[0].name);
    }
  };

  return (
    <div className="broker-select-wrapper" style={{ maxWidth: 240 }} ref={wrapperRef}>
      <input
        className="form-control bg-gray text-black"
        placeholder={isManualMode ? "Enter broker name" : "broker"}
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => !isManualMode && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {!isManualMode && isOpen ? (
        <div className="broker-dropdown">
          {filteredBrokers.map((broker) => (
            <button
              key={broker.id}
              type="button"
              className="broker-option"
              onClick={() => selectBroker(broker.name)}
            >
              {broker.name}
            </button>
          ))}
          <button
            type="button"
            className="broker-option broker-option-other"
            onClick={activateManualMode}
          >
            {OTHER_BROKER.name}
          </button>
        </div>
      ) : null}
    </div>
  );
}
