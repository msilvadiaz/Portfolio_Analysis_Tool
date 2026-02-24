import { useId, useMemo } from "react";

import { OTHER_BROKER, TOP_BROKERS } from "../data/brokers";

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export default function BrokerSelect({ value, onChange, disabled }: Props) {
  const datalistId = useId();

  const brokerNames = useMemo(
    () => [...TOP_BROKERS.map((broker) => broker.name), OTHER_BROKER.name],
    [],
  );

  const customBrokerEnabled = value === OTHER_BROKER.name;

  return (
    <div className="broker-select-container" style={{ maxWidth: 240, width: "100%" }}>
      <div className="broker-select-wrap">
        <input
          className="form-control bg-gray text-black broker-select-input"
          list={datalistId}
          placeholder="broker"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          disabled={disabled}
          aria-label="Broker"
        />
      </div>
      <datalist id={datalistId}>
        {brokerNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      {customBrokerEnabled ? (
        <small className="text-secondary d-block mt-1">Custom broker</small>
      ) : null}
    </div>
  );
}
