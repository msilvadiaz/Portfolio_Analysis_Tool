import { useState } from "react";

import { GENERIC_BROKER_ICON } from "../data/brokerIcons";

type Props = {
  src?: string;
  className?: string;
};

export default function BrokerIcon({ src, className }: Props) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = !failed && src ? src : GENERIC_BROKER_ICON;

  return (
    <img
      className={className}
      src={resolvedSrc}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}
