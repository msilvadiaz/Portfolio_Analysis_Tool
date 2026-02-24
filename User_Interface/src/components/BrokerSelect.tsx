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
  const [isOtherMode, setIsOtherMode] = useState(false);

  const filteredBrokers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return TOP_BROKERS;
    return TOP_BROKERS.filter((broker) =>
      broker.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  useEffect(() => {
    const isKnown = TOP_BROKERS.some(
      (broker) => broker.name.toLowerCase() === value.trim().toLowerCase(),
    );
    setIsOtherMode(!isKnown && value.trim().length > 0);
    setQuery(value);
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

  const selectBroker = (selectedBroker: string, other = false) => {
    setIsOtherMode(other);
    setQuery(selectedBroker);
    onChange(selectedBroker);
    setIsOpen(false);
  };

  const handleInputChange = (next: string) => {
    setQuery(next);
    onChange(next);
    setIsOpen(true);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" && !isOtherMode && isOpen) {
      event.preventDefault();
      if (filteredBrokers.length > 0) {
        selectBroker(filteredBrokers[0].name);
      } else {
        selectBroker(OTHER_BROKER.name, true);
      }
    }
  };

  return (
    <div className="broker-select-wrapper" style={{ maxWidth: 240 }} ref={wrapperRef}>
      <input
        className="form-control bg-gray text-black"
        placeholder={isOtherMode ? "Enter broker name" : "broker"}
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => !isOtherMode && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {!isOtherMode && isOpen ? (
        <div className="broker-dropdown">
          {filteredBrokers.map((broker) => (
            <button
              key={broker.id}
              type="button"
              className="broker-option"
              onClick={() => selectBroker(broker.name)}
            >
              <span className="broker-icon-dot" aria-hidden="true" />
              {broker.name}
            </button>
          ))}
          <button
            type="button"
            className="broker-option broker-option-other"
            onClick={() => selectBroker("", true)}
          >
            <span className="broker-icon-dot" aria-hidden="true" />
            {OTHER_BROKER.name}
          </button>
        </div>
      ) : null}
    </div>
  );
}
